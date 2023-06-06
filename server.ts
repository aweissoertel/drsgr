import express from 'express';
import ViteExpress from 'vite-express';

import push from './server/dbTest';
import hello from './server/hello';

const port = parseInt(process.env.PORT || '8080');
const app = express();

app.get('/hello', (_, res) => hello(res));

ViteExpress.listen(app, port, () => console.log(`Server is listening on port: ${port}`));

push();
