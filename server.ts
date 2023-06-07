import { PrismaClient } from '@prisma/client';
import express from 'express';
import ViteExpress from 'vite-express';

import hello from './server/hello';
import createRecommendation from './server/recommendations/createRecommendation';
import deleteRecommendation from './server/recommendations/deleteRecommendation';
import endVoting from './server/recommendations/endVoting';
import getRecommendation from './server/recommendations/getRecommendation';

const port = parseInt(process.env.PORT || '8080');
const app = express();
const prisma = new PrismaClient();

app.get('/hello', (_, res) => hello(res));

///// recommendations /////
app.post('/recommendation', async (_, response) => createRecommendation(response, prisma));
app.get<{ code: string }>('/recommendation', (request, response) => getRecommendation(request, response, prisma));
app.put('/recommendation', (request, response) => endVoting(request, response));
app.delete('/recommendation', (request, response) => deleteRecommendation(request, response));

ViteExpress.listen(app, port, () => console.log(`Server is listening on port: ${port}`));
