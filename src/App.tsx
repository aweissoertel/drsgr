import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Route, Switch } from 'wouter';

import './App.css';
import ErrorPage from './pages/ErrorPage';
import Root from './pages/Root';
import SessionPage from './pages/SessionPage';

const App = () => {
  return (
    <div className='App'>
      <Switch>
        <Route path='/'>
          <Root />
        </Route>
        <Route path='/session/:recommendationId'>
          <SessionPage />
        </Route>
        <Route>
          <ErrorPage />
        </Route>
      </Switch>
    </div>
  );
};

export default App;
