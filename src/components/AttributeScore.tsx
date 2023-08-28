import React from 'react';

import { Col, Row } from 'react-bootstrap';

import * as constants from '../data/constantData';
import { BarChart } from './BarChart';

interface AttributeScoreProps {
  score: Score;
  index: number;
  userPref?: number;
}

export const AttributeScore = ({ score, index, userPref }: AttributeScoreProps) => {
  return (
    <Row>
      <Col xs={4} style={{ textAlign: 'left', fontSize: 'small' }}>
        {score.name.charAt(0).toUpperCase() + score.name.slice(1)}
      </Col>
      <Col xs={5}>
        <BarChart score={score} color={constants.COLORS[index % constants.COLORS.length]} benchmark={userPref} showBenchmark={true} />
      </Col>

      {userPref && (
        <Col xs={1} style={{ textAlign: 'right', fontSize: 'small' }}>
          {100 - Math.abs(score.value - userPref)}%
        </Col>
      )}
    </Row>
  );
};
