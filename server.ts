import express from 'express';
import ViteExpress from 'vite-express';

import hello from './server/hello';

const port = parseInt(process.env.PORT || '3000');
const app = express();

app.get('/hello', (_, res) => hello(res));

ViteExpress.listen(app, port, () => console.log(`Server is listening on port: ${port}`));