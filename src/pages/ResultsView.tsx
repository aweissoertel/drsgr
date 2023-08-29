import * as React from 'react';

import { Col, Row } from 'react-bootstrap';

import Map from '../components/Map';
import { Results } from '../components/Results';
import { features } from '../data/regions.json';

interface ResultsViewProps {
  item: GroupRecommendation;
}

const ResultsView = ({ item }: ResultsViewProps) => {
  const [currentAResult, setCurrentAResult] = React.useState<RankResult[]>();
  const [resultCountries, setResultCountries] = React.useState<FullCountry[]>();
  const [regions, setRegions] = React.useState<Region[]>();

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
    if (!regions) return;
    setResultCountries(
      features
        .map((feature) => {
          const result = currentAResult!.find((res) => res.u_name === feature.properties.u_name);
          const region = regions.find((region) => region.u_name === feature.properties.u_name);
          return {
            ...feature,
            ...region!,
            rankResult: result!,
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
      <Col>Votes? Method switch?</Col>
      <Col xs={6}>{resultCountries && <Map countries={resultCountries} />}</Col>
      <Col>
        <Results results={resultCountries} stay={4} />
      </Col>
    </Row>
  );
};
export default ResultsView;
