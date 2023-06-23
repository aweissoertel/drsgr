import { PrismaClient } from '@prisma/client';
import express from 'express';
// eslint-disable-next-line import/default
import ViteExpress from 'vite-express';

import hello from './server/hello';
import createRecommendation from './server/recommendations/createRecommendation';
import deleteRecommendation from './server/recommendations/deleteRecommendation';
import endVoting from './server/recommendations/endVoting';
import getRecommendation from './server/recommendations/getRecommendation';
import createUserVote, { CreateUserVoteBody } from './server/userVotes/createUserVote';
import deleteUserVote from './server/userVotes/deleteUserVote';

const port = parseInt(process.env.PORT || '8080');
const app = express();
app.use(express.json());
const prisma = new PrismaClient();

app.get('/hello', (_, res) => hello(res));

///// recommendations /////
app.post('/recommendation', async (_, response) => await createRecommendation(response, prisma));
app.get<{ code: string }>('/recommendation', (request, response) => getRecommendation(request, response, prisma));
app.put<{ id: string }>('/recommendation', (request, response) => endVoting(request, response, prisma));
app.delete<{ id: string }>('/recommendation', (request, response) => deleteRecommendation(request, response, prisma));

///// userVotes /////
app.post<any, CreateUserVoteBody>('/userVote', async (request, response) => createUserVote(request, response, prisma));
app.delete<{ id: string }>('/userVote', (request, response) => deleteUserVote(request, response, prisma));

ViteExpress.listen(app, port, () => console.log(`Server is listening on port: ${port}`));
