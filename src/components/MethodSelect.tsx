import * as React from 'react';

import { Button, Form, Modal, Stack } from 'react-bootstrap';

import { MethodContext } from '../shared/MethodContext';
import { APMethods, ARMethods } from '../shared/constants';
import { getAggregatedInput, getAggregationStrategy } from '../shared/util';
import { DetailScores } from './results/DetailScores';

export interface MethodSelectProps {
  item: GroupRecommendation;
  setCurrentAResult: React.Dispatch<React.SetStateAction<RankResult[] | undefined>>;
  aggregatedProfile?: Attributes;
  setAggregatedProfile: React.Dispatch<React.SetStateAction<Attributes | undefined>>;
  setAGMethod: React.Dispatch<React.SetStateAction<string>>;
  ignoreBudget: boolean;
  setIgnoreBudget: React.Dispatch<React.SetStateAction<boolean>>;
}

const MethodSelect = React.memo(function MethodSelect({
  item,
  setCurrentAResult,
  aggregatedProfile,
  setAggregatedProfile,
  setAGMethod,
  ignoreBudget,
  setIgnoreBudget,
}: MethodSelectProps) {
  const [strategy, setStrategy] = React.useState<string>('average');
  const [privacyMode, setPrivacyMode] = React.useState(false);
  const [showHelpModal, setShowHelpModal] = React.useState(false);

  const AGMethod = React.useContext(MethodContext);

  const handleAGMethodSwitch = (value: string) => {
    setAGMethod(value);
    if (value === 'preferences') {
      setCurrentAResult(item.aggregationResultsAP?.find((strat) => strat.method === strategy)?.rankedCountries);
    } else {
      setCurrentAResult(item.aggregationResultsAR?.find((strat) => strat.method === strategy)?.rankedCountries);
    }
    if (privacyMode) {
      setAggregatedProfile(undefined);
    } else {
      const aInput = item.aggregatedInput![getAggregatedInput(strategy)] as Attributes;
      setAggregatedProfile(aInput);
    }
  };

  const handleStrategySwitch = (value: string) => {
    setStrategy(value);
    if (AGMethod === 'preferences') {
      setCurrentAResult(item.aggregationResultsAP?.find((strat) => strat.method === value)?.rankedCountries);
      const aInput = item.aggregatedInput![getAggregatedInput(value)] as Attributes;
      setAggregatedProfile(aInput);
    } else {
      setCurrentAResult(item.aggregationResultsAR?.find((strat) => strat.method === value)?.rankedCountries);
    }
  };

  const handleGoBackButton = async () => {
    const response = await fetch(`/recommendationreset?id=${item.id}`, { method: 'PUT' });
    if (response.ok) {
      location.reload();
    } else {
      console.log('error:', response);
    }
  };

  const handleShowAPSwitch = () => {
    if (!privacyMode) {
      setAggregatedProfile(undefined);
      setPrivacyMode(true);
    } else {
      const aInput = item.aggregatedInput![getAggregatedInput(strategy)] as Attributes;
      setAggregatedProfile(aInput);
      setPrivacyMode(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction='horizontal' style={{ marginBottom: '1rem' }} gap={4}>
        <h4>Setttings</h4>
        <Button variant='outline-secondary' size='sm' onClick={() => setShowHelpModal(true)}>
          Need Help?
        </Button>
      </Stack>
      <p style={{ marginBottom: '0.5rem' }}>Choose the aggregation method</p>
      <Form.Select
        defaultValue='preferences'
        aria-label='Aggregation Method'
        onChange={(e) => handleAGMethodSwitch(e.target.value)}
        name='Aggregation Method'
      >
        <option value='results'>Aggregating Results</option>
        <option value='preferences'>Aggregating Profiles</option>
      </Form.Select>
      <p style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>Choose the aggregation strategy</p>
      <Form.Select
        defaultValue='average'
        aria-label='Aggregation Strategy'
        onChange={(e) => handleStrategySwitch(e.target.value)}
        name='Aggregation Strategy'
      >
        <option>Select...</option>
        {AGMethod === 'results'
          ? ARMethods.map((method, idx) => (
              <option key={idx} value={method}>
                {getAggregationStrategy(method)}
              </option>
            ))
          : APMethods.map((method, idx) => (
              <option key={idx} value={method}>
                {getAggregationStrategy(method)}
              </option>
            ))}
      </Form.Select>
      <Form.Switch
        className='mt-2'
        label='Exclude destinations above living costs budget'
        checked={!ignoreBudget}
        onChange={() => setIgnoreBudget((val) => !val)}
        id='ignoreBudget'
      />
      <hr />
      <Form.Switch
        label='Privacy mode'
        checked={privacyMode}
        onChange={() => handleShowAPSwitch()}
        id='Show aggregated profile'
        className='mb-2'
      />
      {!privacyMode && aggregatedProfile && AGMethod === 'preferences' && (
        <div className='bg-dark p-2 mt-2 mb-2 border rounded'>
          <DetailScores
            groupProfileMode
            scores={Object.keys(aggregatedProfile).map((key) => ({
              name: key,
              value: aggregatedProfile[key as keyof AggregatedInput],
            }))}
          />
        </div>
      )}
      <Button onClick={() => handleGoBackButton()} variant='danger' className='mt-auto'>
        Go back to vote phase
      </Button>
      <HelpModal show={showHelpModal} onHide={() => setShowHelpModal(false)} />
    </div>
  );
});
export default MethodSelect;

interface ConfirmModalProps {
  show: boolean;
  onHide: () => void;
}

const HelpModal = ({ onHide, ...rest }: ConfirmModalProps) => {
  return (
    <Modal onHide={onHide} {...rest} size='lg' centered>
      <Modal.Header closeButton>
        <Modal.Title id='contained-modal-title-vcenter'>Help</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          <h5>Aggregation Method</h5>
          <i>The aggregation method defines which dimension is aggregated.</i>
          <ul>
            <li>
              <strong>Aggregating Results</strong>: First, a ranked list of destinations is created for every user based on the user&apos;s
              preferences. Then, these lists of destinations get aggregated into one list, representing the group&apos;s preferences.
            </li>
            <li>
              <strong>Aggregating Profiles</strong>: The profile of preferences of every user get aggregated into a combined profile of the
              group. The destination recommendation list for this group is matched from this combined profile with its preferences.
            </li>
          </ul>
          <h5>Aggregation Strategy</h5>
          <i>The aggregation strategy determines how items are aggregated.</i>
          <ul>
            <li>
              <strong>Multiplicative</strong>: Score is obtained by multiplying the reverse rank of items: One point for last rank, two for
              second to last etc.
            </li>
            <li>
              <strong>Average</strong>: The mean of the items&apos; ranks
            </li>
            <li>
              <strong>Borda Count</strong>: Score is the items&apos; ranks added together
            </li>
            <li>
              <strong>Most Pleasure</strong>: The maximum of the ranks of an item
            </li>
            <li>
              <strong>Average Without Misery</strong>: Like Average, but the items with a rank in the lower 40% are not taken into account
            </li>
          </ul>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onHide} variant='outline-secondary'>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
