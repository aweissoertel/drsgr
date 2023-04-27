import React from 'react';
import Budget from './components/Budget';
import { CustomizationContainer } from './components/CustomizationContainer';
import AdditionalInfo from './components/AdditionalInfo';

interface PreferencesProps {
  userData: UserPreferences;
  setUserData: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const Preferences = ({ userData, setUserData }: PreferencesProps) => {
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
    </div>
  );
};

export default Preferences;
