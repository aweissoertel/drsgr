import React from 'react';
import '../../../App.css';
import { DetailScores } from './DetailScores';
import { Row, Col } from 'react-bootstrap';

interface CountryPopupProps {
  country?: CompleteResult;
}

export const CountryPopup = ({ country }: CountryPopupProps) => {
  if (!country) return null;
  return (
    <div style={{ color: 'white' }}>
      <h6>{country.region}</h6>
      <Row style={{ alignItems: 'flex-end' }}>
        <Col>{country.country}</Col>
        <Col style={{ textAlign: 'end' }}>Score: {country.scores.totalScore}/100</Col>
      </Row>

      <div style={{ width: '100%' }}>
        <DetailScores
          scores={Object.keys(country.qualifications)?.map((key) => ({
            name: key,
            value: country.qualifications[key as keyof Attributes],
          }))}
          price={country.price}
        />
      </div>
    </div>
  );
};
