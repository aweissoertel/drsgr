import React from 'react';

import { Col, Row } from 'react-bootstrap';

import * as constants from '../data/constantData';

interface CustomizationContainerProps {
  userData: UserVote;
  setUserData: React.Dispatch<React.SetStateAction<UserVote>>;
}

const VotingContainer = ({ userData, setUserData }: CustomizationContainerProps) => {
  return (
    <div>
      <p style={{ textAlign: 'start', fontSize: 'small' }}>Rate the topics according to their importance to you:</p>
      {Object.keys(userData.preferences).map((item, index) => (
        <div
          style={{
            backgroundColor: constants.COLORS[index % constants.COLORS.length],
            borderRadius: '100',
            color: '#fff',
            textAlign: 'left',
            padding: '0 5px',
            margin: '5px 0 0 0',
            height: '40px',
            alignItems: 'center',
          }}
          key={index}
        >
          <Attribute attrName={item} userData={userData} setUserData={setUserData} />
        </div>
      ))}
    </div>
  );
};
export default VotingContainer;

interface AttributeProps {
  attrName: string;
  userData: UserVote;
  setUserData: React.Dispatch<React.SetStateAction<UserVote>>;
}

const Attribute = ({ attrName, userData, setUserData }: AttributeProps) => {
  return (
    <Row
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '5px',
        height: '100%',
      }}
    >
      <Col xs={4}>{attrName.charAt(0).toUpperCase() + attrName.slice(1)}</Col>
      <Col xs={8}>
        <SlideRange attrName={attrName} userData={userData} setUserData={setUserData} />
      </Col>
    </Row>
  );
};

const SlideRange = ({ attrName, userData, setUserData }: AttributeProps) => {
  return (
    <form style={{ width: '100%', display: 'flex' }}>
      <input
        id='slider'
        style={{ width: '100%', height: '1.5rem' }}
        type='range'
        step={25}
        value={userData.preferences[attrName]}
        onChange={(e) => {
          setUserData((old) => ({
            ...old,
            preferences: {
              ...old.preferences,
              [attrName]: e.target.valueAsNumber,
            },
          }));
        }}
      ></input>
    </form>
  );
};
