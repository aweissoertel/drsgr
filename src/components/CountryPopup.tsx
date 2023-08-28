import React from 'react';

import { Col, Row } from 'react-bootstrap';

import { DetailScoresMap } from './DetailScoresMap';

interface CountryPopupProps {
  country: FullCountry;
}

export const CountryPopup = ({ country }: CountryPopupProps) => {
  if (!country) return null;
  return (
    <div style={{ color: 'white' }}>
      <h6>{country.name}</h6>
      <Row style={{ alignItems: 'flex-end' }}>
        <Col>{country.parentRegion}</Col>
        <Col style={{ textAlign: 'end' }}>Score: {country.rankResult.totalScore.toFixed(2)}/100</Col>
      </Row>

      <div style={{ width: '100%' }}>
        <DetailScoresMap
          scores={Object.keys(country.attributes)?.map((key) => ({
            name: key,
            value: country.attributes[key as keyof Attributes],
          }))}
          price={country.costPerWeek}
          // userData={undefined}
        />
      </div>
    </div>
  );
};
