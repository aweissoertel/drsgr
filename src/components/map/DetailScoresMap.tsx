import React from 'react';

import { Col, Row } from 'react-bootstrap';

import { AttributeScore } from './AttributeScore';

interface DetailScoresProps {
  scores: Score[];
  price: number;
}

export const DetailScoresMap = ({ scores, price }: DetailScoresProps) => {
  return (
    <div>
      <div
        style={{
          padding: '10px 10px',
          width: '250px',
          backgroundColor: 'white',
          color: '#000',
        }}
      >
        <div style={{ width: '100%' }}>
          <p style={{ margin: 0 }}>Price for your trip length: {price}€</p>
          <hr style={{ marginBottom: '1.2rem', marginTop: 0 }} />
        </div>
        <div>
          {scores.map((entry, index) => (
            <AttributeScore score={entry} index={index} key={index} />
          ))}
        </div>
      </div>
      <div style={{ padding: '0px 10px', width: '250px' }}>
        <Row style={{ alignItems: 'center' }}>
          <Col xs={4}>estimation*</Col>
          <Col xs={8}>
            <Row>
              <Col xs={4}>
                <div style={{ padding: '0', fontSize: 'x-small' }}>.</div>
                <div style={{ padding: '0', fontSize: 'x-small' }}>0</div>
              </Col>
              <Col xs={4} style={{ textAlign: 'center' }}>
                <div style={{ padding: '0', fontSize: 'x-small' }}>.</div>
                <div style={{ padding: '0', fontSize: 'x-small' }}>50</div>
              </Col>
              <Col xs={4} style={{ textAlign: 'end' }}>
                <div style={{ padding: '0', fontSize: 'x-small' }}>.</div>
                <div style={{ padding: '0', fontSize: 'x-small' }}>100</div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </div>
  );
};
