import React from 'react';

import { Col, Row } from 'react-bootstrap';

import * as myConstant from '../../../data/constantData';
import { BarChart } from '../../SharedComponents/BarChart';

interface AttributeScoreProps {
  score: Score;
  index: number;
}

export const AttributeScore = ({ score, index }: AttributeScoreProps) => {
  return (
    <Row>
      <Col xs={4} style={{ textAlign: 'left', fontSize: 'small' }}>
        {score.name}
      </Col>
      <Col xs={8}>
        <BarChart score={score} showBenchmark={false} color={myConstant.COLORS[index % myConstant.COLORS.length]} />
      </Col>
    </Row>
  );
};
