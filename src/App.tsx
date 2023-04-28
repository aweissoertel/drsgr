import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css';
import LoadCountriesTask from './tasks/LoadCountriesTask';
import Loading from './views/GeneralView/Loading';
import TravelRecommender from './views/GeneralView/TravelRecommender';

const App = () => {
  const [countries, setCountries] = React.useState<MapCountry[]>([]);
  const [fileRetrieved, setFileRetrieved] = React.useState<RawCountries[]>([]);
  const [results, setResults] = React.useState<CompleteResult[]>([]);
  const [userData, setUserData] = React.useState<UserPreferences>({
    isPriceImportant: false,
    stay: 4,
    budget: 1,
    attributes: {
      nature: 50,
      architecture: 50,
      hiking: 50,
      wintersports: 50,
      beach: 50,
      culture: 50,
      culinary: 50,
      entertainment: 50,
      shopping: 50,
    },
  });

  const test = async () => {
    const response = await fetch('/hello');
    const data = await response.text();
    console.log(data);
  };

  const load = () => {
    const loadCountriesTask = new LoadCountriesTask();
    loadCountriesTask.load(setFileRetrieved);
    test();
  };

  const calculateScores = () => {
    if (fileRetrieved.length > 0) {
      const loadCountriesTask = new LoadCountriesTask();
      loadCountriesTask.processCountries(fileRetrieved, userData, setCountries, setResults);
    }
  };

  React.useEffect(load, []);
  React.useEffect(calculateScores, [userData, fileRetrieved]);

  return (
    <div style={{ height: '100vh' }}>
      {countries.length === 0 ? (
        <Loading />
      ) : (
        <TravelRecommender countries={countries} userData={userData} setUserData={setUserData} results={results} />
      )}
    </div>
  );
};

export default App;
