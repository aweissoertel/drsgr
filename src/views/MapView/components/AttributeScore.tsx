import React from 'react';

import { Col, Row } from 'react-bootstrap';

import { BarChart } from '../../../components/BarChart';
import * as myConstant from '../../../data/constantData';

interface AttributeScoreProps {
  score: Score;
  index: number;
}

export const AttributeScore = ({ score, index }: AttributeScoreProps) => {
  return (
    <Row>
      <Col xs={4} style={{ textAlign: 'left', fontSize: 'small' }}>
        {score.name.charAt(0).toUpperCase() + score.name.slice(1)}
      </Col>
      <Col xs={8}>
        <BarChart score={score} color={myConstant.COLORS[index % myConstant.COLORS.length]} />
      </Col>
    </Row>
  );
};
