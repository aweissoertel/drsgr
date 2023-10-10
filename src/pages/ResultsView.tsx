import * as React from 'react';

import { Col, Row } from 'react-bootstrap';

import Map from '../components/Map';
import MethodSelect from '../components/MethodSelect';
import { Results } from '../components/Results';
import { features } from '../data/regions.json';
import { MethodContext } from '../shared/MethodContext';

interface ResultsViewProps {
  item: GroupRecommendation;
}

const defaultResult: RankResult = {
  u_name: 'default',
  rank: 199,
  rankReverse: 0,
  totalScore: 0,
};

const ResultsView = ({ item }: ResultsViewProps) => {
  const [currentAResult, setCurrentAResult] = React.useState<RankResult[]>();
  const [resultCountries, setResultCountries] = React.useState<FullCountry[]>();
  const [regions, setRegions] = React.useState<Region[]>();
  const [aggregatedProfile, setAggregatedProfile] = React.useState<Attributes>();
  const [AGMethod, setAGMethod] = React.useState<string>('preferences');

  const fetchRegions = async () => {
    const response = await fetch('/countries', { method: 'GET' });
    if (response.ok) {
      const data: Region[] = await response.json();
      return data;
    } else {
      console.log('error:', response);
    }
  };

  React.useEffect(() => {
    fetchRegions().then((res) => setRegions(res));

    const first = item.aggregationResultsAR?.at(0)?.rankedCountries;
    setCurrentAResult(first);
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
            topFive: [],
          },
          rankResult: result,
          ...region!,
        };
      })
      .sort((a, b) => a.rankResult.rank - b.rankResult.rank);
    item.aggregatedInput?.recommendationsPerUserVote.forEach((user) => {
      resCountries.find((country) => country.properties.u_name === user.list[0].u_name)!.favorites.best.push(user.name);
      resCountries.find((country) => country.properties.u_name === user.list[1].u_name)!.favorites.second.push(user.name);
      resCountries.find((country) => country.properties.u_name === user.list[2].u_name)!.favorites.third.push(user.name);
      resCountries.find((country) => country.properties.u_name === user.list[3].u_name)!.favorites.topFive.push(user.name);
      resCountries.find((country) => country.properties.u_name === user.list[4].u_name)!.favorites.topFive.push(user.name);
    });
    setResultCountries(resCountries);
  }, [currentAResult, regions]);

  if (!resultCountries) {
    return <h1>Loading...</h1>;
  }

  return (
    <MethodContext.Provider value={AGMethod}>
      <Row style={{ height: '100%' }}>
        <Col>
          <MethodSelect
            item={item}
            setCurrentAResult={setCurrentAResult}
            aggregatedProfile={aggregatedProfile}
            setAggregatedProfile={setAggregatedProfile}
            setAGMethod={setAGMethod}
          />
        </Col>
        <Col xs={6}>{resultCountries && <Map countries={resultCountries} />}</Col>
        <Col>
          <Results results={resultCountries} aggregatedProfile={aggregatedProfile} stay={4} />
        </Col>
      </Row>
    </MethodContext.Provider>
  );
};
export default ResultsView;
