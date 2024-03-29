import * as React from 'react';

import { Alert, Button, Form, Stack } from 'react-bootstrap';
import { FaArrowRightLong } from 'react-icons/fa6';
import { useLocation } from 'wouter';

const Root = () => {
  const [input, setInput] = React.useState('');
  const [showError, setShowError] = React.useState(false);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [, setLocation] = useLocation();

  const handleGetButton = async () => {
    const response = await fetch(`/recommendation?code=${input}&full=0`, { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      setLocation(`/session/${data.id}`);
    } else {
      console.log('id not found:', input);
      setShowError(true);
    }
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    const response = await fetch('/recommendation?surveyMode=false', { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      setLocation(`/session/${data.id}`);
    } else {
      console.log('error on creation of recommendation', input);
      setLocation('error');
    }
  };

  const handleCreateSess = async () => {
    const response = await fetch('/recommendation?surveyMode=true', { method: 'POST' });
    const data = await response.json();
    console.log('Survey Sess created. Id:');
    console.log(data.sessionCode);
  };

  const isAdminMode = window.localStorage.getItem('admin') === 'survey';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
      <h1 style={{ flex: '0 1 auto' }}>Welcome to the Destination Group Recommender System!</h1>
      <div style={{ flex: '1 1 auto', display: 'grid', justifyContent: 'center' }}>
        <Stack gap={2} className='mx-auto my-auto'>
          <Button disabled={createLoading} variant='success' onClick={() => handleCreate()}>
            {createLoading ? 'Loading...' : 'Create a new session '}
            {!createLoading && <FaArrowRightLong />}
          </Button>
          <h4>or</h4>
          <Stack direction='horizontal' gap={3}>
            <Form.Control
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 6))}
              className='me-auto'
              placeholder='Go to session id...'
            />
            <Button style={{ width: 100 }} onClick={handleGetButton}>
              Go <FaArrowRightLong />
            </Button>
          </Stack>
          {showError && (
            <Alert className='mt-3' variant='danger' onClose={() => setShowError(false)} dismissible>
              This session id was not found
            </Alert>
          )}
        </Stack>
      </div>
      {isAdminMode && <Button onClick={() => handleCreateSess()}>Create Survey Sess</Button>}
    </div>
  );
};
export default Root;
