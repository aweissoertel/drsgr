import express from 'express';
// eslint-disable-next-line import/default
import ViteExpress from 'vite-express';

import Aggregator from './server/Aggregator';
import hello from './server/hello';
import createUserVote, { CreateUserVoteBody } from './server/userVotes/createUserVote';
import deleteUserVote from './server/userVotes/deleteUserVote';

const port = parseInt(process.env.PORT || '8080');
const app = express();
app.use(express.json());
const aggregator = new Aggregator();

app.get('/hello', (_, res) => hello(res));

///// recommendations /////
app.post('/recommendation', async (_, response) => aggregator.createRecommendation(response));
app.get<{ code: string }>('/recommendation', async (request, response) => aggregator.getRecommendation(request, response));
app.put<{ id: string }>('/recommendation', async (request, response) => aggregator.endVoting(request, response));
app.delete<{ id: string }>('/recommendation', async (request, response) => aggregator.deleteRecommendation(request, response));

///// userVotes /////
app.post<any, CreateUserVoteBody>('/userVote', async (request, response) => createUserVote(request, response, aggregator.prisma));
app.delete<{ id: string }>('/userVote', (request, response) => deleteUserVote(request, response, aggregator.prisma));

ViteExpress.listen(app, port, () => console.log(`Server is listening on port: ${port}`));
