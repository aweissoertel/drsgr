import React from 'react';

import { Col, Form, Row } from 'react-bootstrap';

interface AdditionalInfoProps {
  userData: UserPreferences;
  setUserData: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const AdditionalInfo = ({ userData, setUserData }: AdditionalInfoProps) => {
  return (
    <div>
      <Form className='filter'>
        <Form.Check
          className='filter'
          type='checkbox'
          id='custom-switch'
          label='Filter out the destinations over the  budget'
          onChange={(e) => setUserData({ ...userData, isPriceImportant: e.target.checked })}
        ></Form.Check>
        <span className='tooltip-box'>
          If you select the checkbox the over-budget destinations will be filtered out. if it is not selected, price
          would have an impact on the recommendations just like any other attribute.
        </span>
      </Form>
      <hr style={{ marginBottom: '1.2rem' }} />
      <Row>
        <Col style={{ justifyContent: 'center' }}>
          <p
            style={{
              textAlign: 'left',
              justifyContent: 'center',
              lineHeight: '44px',
              margin: 0,
            }}
          >
            Maximum # of days:
          </p>
        </Col>
        <Col>
          <input
            type='number'
            className='stay-days'
            defaultValue={userData.stay}
            onChange={(e) => setUserData({ ...userData, stay: parseInt(e.target.value) })}
          />
        </Col>
      </Row>
    </div>
  );
};

export default AdditionalInfo;
