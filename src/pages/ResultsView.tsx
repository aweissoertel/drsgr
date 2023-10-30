import * as React from 'react';

import { Button, Col, Form, ListGroup, Modal, Row, Spinner } from 'react-bootstrap';

import MethodSelect from '../components/MethodSelect';
import Map from '../components/map/Map';
import { Results } from '../components/results/Results';
import { features } from '../data/regions.json';
import { FinalVoteContext } from '../shared/FinalVoteContext';
import { MethodContext } from '../shared/MethodContext';
import ConcludedView from './ConcludedView';

interface ResultsViewProps {
  item: GroupRecommendation;
  setData: React.Dispatch<React.SetStateAction<GroupRecommendation | undefined>>;
}

const defaultResult: RankResult = {
  u_name: 'default',
  rank: 199,
  rankReverse: 0,
  rankOverBudget: 0,
  totalScore: 0,
  overBudget: false,
};

const ResultsView = ({ item, setData }: ResultsViewProps) => {
  const [currentAResult, setCurrentAResult] = React.useState<RankResult[]>();
  const [resultCountries, setResultCountries] = React.useState<FullCountry[]>();
  const [regions, setRegions] = React.useState<Region[]>();
  const [aggregatedProfile, setAggregatedProfile] = React.useState<Attributes | undefined>(item.aggregatedInput?.averageAP as Attributes);
  const [AGMethod, setAGMethod] = React.useState<string>('preferences');
  const [ignoreBudget, setIgnoreBudet] = React.useState(true);
  const [finalVotes, setFinalVotes] = React.useState<FinalVote[]>([]);
  const [voteModal, setVoteModal] = React.useState<FullCountry | undefined>(undefined);
  const [confirmModal, setConfirmModal] = React.useState(false);

  const fetchRegions = async () => {
    const response = await fetch('/countries', { method: 'GET' });
    if (response.ok) {
      const data: Region[] = await response.json();
      return data;
    } else {
      console.log('error:', response);
    }
  };

  const fetchFinalVotes = async () => {
    const response = await fetch(`/finalVotes?id=${item.id}`, { method: 'GET' });
    if (response.ok) {
      const data: FinalVote[] | Record<string, never> = await response.json();
      return Object.keys(data).length === 0 ? [] : (data as FinalVote[]);
    } else {
      console.log('error:', response);
    }
  };

  const openVoteModal = (u_name: string) => {
    setVoteModal(resultCountries!.find((country) => country.properties.u_name === u_name));
  };

  const init = async () => {
    const regions = await fetchRegions();
    setRegions(regions);
    const first = item.aggregationResultsAP?.find((item) => item.method === 'average')?.rankedCountries;
    setCurrentAResult(first);
    const finVotes = await fetchFinalVotes();
    setFinalVotes(finVotes || []);
  };

  React.useEffect(() => {
    init();
  }, []);

  React.useEffect(() => {
    if (!regions || !currentAResult) return;
    const resCountries: FullCountry[] = features
      .map((feature) => {
        const result = currentAResult!.find((res) => res.u_name === feature.properties.u_name) || defaultResult;
        const region = regions.find((region) => region.u_name === feature.properties.u_name);

        return {
          ...feature,
          favorites: {
            best: [],
            second: [],
            third: [],
            topTen: [],
          },
          rankResult: result,
          ...region!,
        };
      })
      .sort((a, b) => {
        if (ignoreBudget) {
          return a.rankResult.rank - b.rankResult.rank;
        } else {
          return a.rankResult.rankOverBudget - b.rankResult.rankOverBudget;
        }
      });
    item.aggregatedInput?.recommendationsPerUserVote.forEach((user) => {
      resCountries.find((country) => country.properties.u_name === user.list[0].u_name)!.favorites.best.push(user.name);
      resCountries.find((country) => country.properties.u_name === user.list[1].u_name)!.favorites.second.push(user.name);
      resCountries.find((country) => country.properties.u_name === user.list[2].u_name)!.favorites.third.push(user.name);
      for (let i = 3; i < 10; i++) {
        resCountries.find((country) => country.properties.u_name === user.list[i].u_name)!.favorites.topTen.push(user.name);
      }
    });
    setResultCountries(resCountries);
  }, [currentAResult, regions, ignoreBudget]);

  if (!resultCountries) {
    return <h1>Loading...</h1>;
  }

  return (
    <FinalVoteContext.Provider value={finalVotes}>
      <MethodContext.Provider value={AGMethod}>
        {item.concluded ? (
          <ConcludedView item={item} countries={resultCountries} setData={setData} />
        ) : (
          <>
            <Row style={{ height: '100%' }}>
              <Col xs lg>
                <MethodSelect
                  item={item}
                  setCurrentAResult={setCurrentAResult}
                  aggregatedProfile={aggregatedProfile}
                  setAggregatedProfile={setAggregatedProfile}
                  setAGMethod={setAGMethod}
                  ignoreBudget={ignoreBudget}
                  setIgnoreBudget={setIgnoreBudet}
                />
              </Col>
              <Col xs lg={5}>
                {resultCountries && <Map countries={resultCountries} stayDays={item.stayDays} ignoreBudget={ignoreBudget} />}
              </Col>
              <Col xs={12} lg>
                <Results
                  openConfirmModal={() => setConfirmModal(true)}
                  openVoteModal={openVoteModal}
                  results={resultCountries}
                  aggregatedProfile={aggregatedProfile}
                  stay={item.stayDays}
                />
              </Col>
            </Row>
            <VoteModal item={voteModal} show={Boolean(voteModal)} onHide={() => setVoteModal(undefined)} setFinalVotes={setFinalVotes} />
            <ConfirmModal
              countries={resultCountries}
              show={confirmModal}
              privacy={!aggregatedProfile}
              onHide={() => setConfirmModal(false)}
              id={item.id}
              setData={setData}
            />
          </>
        )}
      </MethodContext.Provider>
    </FinalVoteContext.Provider>
  );
};
export default ResultsView;

interface VoteModalProps {
  item?: FullCountry;
  show: boolean;
  onHide: () => void;
  setFinalVotes: React.Dispatch<React.SetStateAction<FinalVote[]>>;
}

type Prio = 'first' | 'second' | 'third' | '';

const VoteModal = ({ item, onHide, setFinalVotes, ...rest }: VoteModalProps) => {
  const allVotes = React.useContext(FinalVoteContext);
  const [saving, setSaving] = React.useState(false);
  const [nameId, setNameId] = React.useState<string>('');
  const [prio, setPrio] = React.useState<Prio>('');

  const handleSave = async () => {
    setSaving(true);
    const idx = allVotes.findIndex((vote) => vote.id === nameId);
    const body = allVotes[idx];

    const res = await fetch('/finalVote', {
      method: 'PUT',
      body: JSON.stringify({ ...body, [prio as string]: item!.properties.u_name }),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    setFinalVotes((old) => {
      const updated = old;
      updated[idx] = json;
      return updated;
    });
    setSaving(false);
    onHide();
  };

  return (
    <Modal onHide={onHide} {...rest} size='lg' centered>
      <Modal.Header closeButton>
        <Modal.Title id='contained-modal-title-vcenter'>Vote for {item?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Label htmlFor='nameSelect'>My name is</Form.Label>
        <Form.Select id='nameSelect' onChange={(e) => setNameId(e.target.value)}>
          <option value=''>Please select</option>
          {allVotes.map((vote) => (
            <option value={vote.id} key={vote.id}>
              {vote.name}
            </option>
          ))}
        </Form.Select>
        <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          and I vote for{' '}
          <strong>
            {item?.name}, {item?.parentRegion}
          </strong>
        </p>
        <Form.Label htmlFor='prioritySelect'>as my</Form.Label>
        <Form.Select id='prioritySelect' onChange={(e) => setPrio(e.target.value as Prio)}>
          <option value=''>Please select</option>
          <option value='first'>most</option>
          <option value='second'>second most</option>
          <option value='third'>third most</option>
        </Form.Select>
        <p style={{ marginTop: '0.5rem' }}>favorite destination.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onHide} variant='outline-secondary'>
          Cancel
        </Button>
        <Button onClick={() => handleSave()} variant='success' disabled={!nameId || !prio || nameId.length === 0 || prio.length === 0}>
          Save
          <Spinner as='span' size='sm' hidden={!saving} />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

interface ConfirmModalProps {
  id: string;
  show: boolean;
  privacy: boolean;
  countries: FullCountry[];
  onHide: () => void;
  setData: React.Dispatch<React.SetStateAction<GroupRecommendation | undefined>>;
}

const ConfirmModal = ({ id, onHide, privacy, countries, setData, ...rest }: ConfirmModalProps) => {
  const allVotes = React.useContext(FinalVoteContext);
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);

    const res = await fetch(`/concludeSession?id=${id}`, {
      method: 'POST',
    });
    const body = await res.json();

    setSaving(false);
    onHide();
    setData(body);
  };

  const getText = (input: string) => {
    if (!input) {
      return <i>no choice</i>;
    } else {
      const country = countries.find((c) => c.properties.u_name === input);
      return country!.name;
    }
  };

  return (
    <Modal onHide={onHide} {...rest} size='lg' centered>
      <Modal.Header closeButton>
        <Modal.Title id='contained-modal-title-vcenter'>Conclude Session And Find Consensus</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!privacy && (
          <>
            <p style={{ marginBottom: '1rem' }}>Here is how everybody voted:</p>
            <ListGroup>
              {allVotes.map((vote) => (
                <ListGroup.Item key={vote.id}>
                  <strong>{vote.name}</strong>: <i>First choice</i>: {getText(vote.first)}. <i>Second choice</i>: {getText(vote.second)}.{' '}
                  <i>Third choice</i>: {getText(vote.third)}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
        <p style={{ marginTop: '1rem', marginBottom: 0 }}>Do you want to conclude this session and see your group consensus?</p>
        <p>You can still go back later.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onHide} variant='outline-secondary'>
          Cancel
        </Button>
        <Button onClick={() => handleSave()} variant='success'>
          See consensus
          <Spinner as='span' size='sm' hidden={!saving} />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
