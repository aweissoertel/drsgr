import React from 'react';
import { Row, Col } from 'react-bootstrap';
import SlideRange from './SlideRange';

interface AttributeProps {
  attrName: string;
  userData: UserPreferences;
  setUserData: React.Dispatch<React.SetStateAction<UserPreferences>>;
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
      <Col xs={4}>{attrName}</Col>
      <Col xs={8}>
        <SlideRange
          attrName={attrName}
          userData={userData}
          setUserData={setUserData}
          // color="#000"
        />
      </Col>
    </Row>
  );
};

export default Attribute;
