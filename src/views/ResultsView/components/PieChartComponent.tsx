import React from 'react';
import Donut from './Donut';
import { Row, Col } from 'react-bootstrap';

interface PieChartComponentProps {
  scores: Score[];
  label: number;
  countryName?: string;
  region: string;
}

const PieChartComponent = ({ scores, label, countryName, region }: PieChartComponentProps) => {
  return (
    <Row style={{ textAlign: 'left' }}>
      <Col>
        <Donut scores={scores} label={label} />
      </Col>
      <Col>
        <p style={{ fontSize: 'x-small', marginBottom: '0' }}>{countryName}</p>
        <h6>{region}</h6>
        <p style={{ fontSize: 'x-small' }}>Each parameter&apos;s effect on the recommendation</p>
      </Col>
    </Row>
  );
};
export default PieChartComponent;
