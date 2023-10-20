import { UserVote } from '@prisma/client';
import express from 'express';
import ViteExpress from 'vite-express';

import Aggregator, { UpdateRecommendationBody } from './server/Aggregator';
import FinalVoter from './server/finalVotes/FinalVoter';
import createUserVote, { CreateUserVoteBody } from './server/userVotes/createUserVote';
import deleteUserVote from './server/userVotes/deleteUserVote';
import updateUserVote from './server/userVotes/updateUserVote';

const port = parseInt(process.env.PORT || '8080');
const app = express();
app.use(express.json());

const aggregator = new Aggregator();
// bell of shame: 🔔
let countries: Region[] = [];
let finalVoter: FinalVoter;
new Promise((resolve) => setTimeout(resolve, 5000)).then(() => {
  countries = aggregator.countries;
  finalVoter = new FinalVoter(aggregator.prisma, countries);
  console.log('application ready');
});

///// static /////
app.get('/countries', (_, response) => aggregator.getCountries(response));

///// recommendations /////
app.post('/recommendation', (_, response) => aggregator.createRecommendation(response));
app.get<{ code: string; full: string; id: string }>('/recommendation', (request, response) =>
  aggregator.getRecommendation(request, response),
);
app.put<IdReq>('/recommendation', (request, response) => aggregator.endVoting(request, response));
app.put<IdReq>('/recommendationreset', (request, response) => aggregator.reopenVoting(request, response));
app.put<IdReq, UpdateRecommendationBody>('/recommendationValues', (request, response) =>
  aggregator.updateRecommendation(request, response),
);
app.delete<IdReq>('/recommendation', (request, response) => aggregator.deleteRecommendation(request, response));

///// userVotes /////
app.post<any, CreateUserVoteBody>('/userVote', (request, response) => createUserVote(request, response, aggregator.prisma));
app.delete<IdReq>('/userVote', (request, response) => deleteUserVote(request, response, aggregator.prisma));
app.put<IdReq, UserVote>('/userVote', (request, response) => updateUserVote(request, response, aggregator.prisma));

///// finalVotes /////
app.get<IdReq>('/finalVotes', (request, response) => finalVoter.getVotes(request, response));
app.put<any, SaveVoteBody>('/finalVote', (request, response) => finalVoter.saveVote(request, response));
app.post<IdReq>('/concludeSession', (request, response) => finalVoter.concludeSession(request, response));
app.post<IdReq>('/reopenSession', (request, response) => finalVoter.reopenSession(request, response));

ViteExpress.listen(app, port, () => console.log(`Server is listening on port: ${port}`));
