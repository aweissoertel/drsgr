import * as React from 'react';

import { Link } from 'wouter';

export default function ErrorPage() {
  return (
    <div id='error-page' style={{ textAlign: 'center' }}>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        Back to{' '}
        <Link href='/' className='active'>
          home
        </Link>
      </p>
    </div>
  );
}
