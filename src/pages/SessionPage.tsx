import * as React from 'react';

import { Spinner } from 'react-bootstrap';
import { useLocation, useRoute } from 'wouter';

import ResultsView from './ResultsView';
import Votingview from './VotingView';

const SessionPage = () => {
  const [, params] = useRoute('/session/:recommendationId');
  const id = params?.recommendationId;
  const [, setLocation] = useLocation();
  const [data, setData] = React.useState<GroupRecommendation | undefined>(undefined);

  const fetchRecommendation = async (id: string) => {
    const response = await fetch(`/recommendation?id=${id}&full=1`, { method: 'GET' });
    if (response.ok) {
      const data: GroupRecommendation = await response.json();
      if (!data) {
        setLocation('/error');
      }
      return data;
    } else {
      console.log('error:', response);
    }
  };

  const update = () => {
    fetchRecommendation(id!).then((res) => setData(res));
  };

  React.useEffect(() => {
    if (!id) {
      console.error('In SessionPage but no id?!', params);
      setLocation('/error');
    } else {
      update();
    }
  }, []);

  return !data ? (
    <Spinner animation='border' variant='primary' />
  ) : data.votingEnded ? (
    <ResultsView setData={setData} item={data} />
  ) : (
    <Votingview item={data} update={update} />
  );
};
export default SessionPage;
