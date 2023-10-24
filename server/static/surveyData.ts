import { Prisma } from '@prisma/client';

export const userVotes: Prisma.UserVoteCreateWithoutRecommendationInput[] = [
  {
    name: 'Alice',
    budget: 500,
    preferences: {
      nature: 100,
      architecture: 50,
      hiking: 75,
      wintersports: 75,
      beach: 75,
      culture: 0,
      culinary: 50,
      entertainment: 25,
      shopping: 0,
    },
  },
  {
    name: 'Bob',
    budget: 490,
    preferences: {
      nature: 50,
      architecture: 50,
      hiking: 25,
      wintersports: 0,
      beach: 75,
      culture: 25,
      culinary: 50,
      entertainment: 100,
      shopping: 100,
    },
  },
];
