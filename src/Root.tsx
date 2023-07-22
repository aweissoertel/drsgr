import * as React from 'react';

import { Button, Form, Stack } from 'react-bootstrap';

const Root = () => {
  const [input, setInput] = React.useState('');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ flex: '0 1 auto' }}>Welcome to the Destination Group Recommender System!</h1>
      <div style={{ flex: '1 1 auto', display: 'grid', justifyContent: 'center' }}>
        <Stack gap={2} className='mx-auto my-auto'>
          <Button variant='success'>Create a new session</Button>
          <h4>or</h4>
          <Stack direction='horizontal' gap={3}>
            <Form.Control
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 6))}
              className='me-auto'
              placeholder='Go to existing id...'
            />
            <Button>Go!</Button>
          </Stack>
        </Stack>
      </div>
    </div>
  );
};
export default Root;
