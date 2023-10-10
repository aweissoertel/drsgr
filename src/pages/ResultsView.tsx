import * as React from 'react';

import { Col, Row } from 'react-bootstrap';

import Map from '../components/Map';
import MethodSelect from '../components/MethodSelect';
import { Results } from '../components/Results';
import { features } from '../data/regions.json';

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
    setResultCountries(
      features
        .map((feature) => {
          const result = currentAResult!.find((res) => res.u_name === feature.properties.u_name) || defaultResult;
          const region = regions.find((region) => region.u_name === feature.properties.u_name);
          return {
            ...feature,
            rankResult: result,
            ...region!,
          };
        })
        .sort((a, b) => a.rankResult.rank - b.rankResult.rank),
    );
  }, [currentAResult, regions]);

  if (!resultCountries) {
    return <h1>Loading...</h1>;
  }

  return (
    <Row style={{ height: '100%' }}>
      <Col>
        <MethodSelect
          item={item}
          setCurrentAResult={setCurrentAResult}
          aggregatedProfile={aggregatedProfile}
          setAggregatedProfile={setAggregatedProfile}
        />
      </Col>
      <Col xs={6}>{resultCountries && <Map countries={resultCountries} />}</Col>
      <Col>
        <Results results={resultCountries} aggregatedProfile={aggregatedProfile} stay={4} />
      </Col>
    </Row>
  );
};
export default ResultsView;
