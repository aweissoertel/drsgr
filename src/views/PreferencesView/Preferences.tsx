import React from 'react';

import { Button, Form } from 'react-bootstrap';

import AdditionalInfo from './components/AdditionalInfo';
import Budget from './components/Budget';
import { CustomizationContainer } from './components/CustomizationContainer';

interface PreferencesProps {
  userData: UserPreferences;
  setUserData: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const Preferences = ({ userData, setUserData }: PreferencesProps) => {
  const [query, setQuery] = React.useState('');
  const handleTestButton = async () => {
    const response = await fetch('/recommendation', { method: 'POST' });
    const data = await response.json();
    console.log(data);
  };
  const handleGetButton = async () => {
    const response = await fetch(`/recommendation?code=${query}`, { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      console.log(data);
    } else {
      console.log('NOT FOUND');
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '10px 0' }}>
        <Budget userData={userData} setUserData={setUserData} />
      </div>
      <div>
        <AdditionalInfo userData={userData} setUserData={setUserData} />
      </div>
      <div style={{ padding: '10px 0' }}>
        <CustomizationContainer userData={userData} setUserData={setUserData} />
      </div>
      <Button onClick={() => handleTestButton()}>Create Recommendation</Button>
      <Form.Control type="text" value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())} />
      <Button onClick={() => handleGetButton()}>Get Recommendation</Button>
    </div>
  );
};

export default Preferences;
