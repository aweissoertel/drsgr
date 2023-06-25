import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

const MAX_VOTE_VALUE = 100;

export default async function endVoting(req: Request<{ id: string }>, res: Response, prisma: PrismaClient) {
  const params = req.query.id as string;
  // TODO:
  // - get userVotes
  // - generate various results
  // - update gR with results

  // check if not already closed?
  try {
    const entity = await prisma.groupRecommendation.update({
      where: {
        id: params,
      },
      data: {
        votingEnded: true,
      },
      include: {
        userVotes: true,
      },
    });

    const userVotes: Attributes[] = entity.userVotes.map((userVote) => userVote.preferences);
    if (userVotes.length === 0) {
      res.status(500).send('No votes for this code');
      return;
    }

    const multi = multiplicativeAggregation(userVotes);
    const average = averageAggregation(userVotes).normalizedResult;

    res.send({ multi, average });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}

interface AggregationResult {
  result: Attributes;
  normalizedResult: Attributes;
}

function multiplicativeAggregation(preferences: Attributes[]): AggregationResult {
  const normalizeFactor = MAX_VOTE_VALUE ** (preferences.length - 1);
  const result: Attributes = {
    nature: 1,
    architecture: 1,
    hiking: 1,
    wintersports: 1,
    beach: 1,
    culture: 1,
    culinary: 1,
    entertainment: 1,
    shopping: 1,
  };
  const normalizedResult = { ...result };

  preferences.forEach((preference) => {
    for (const [key, value] of Object.entries(preference)) {
      // PROBLEM: value of 0. Multiplies everything to 0.
      // setting value to 1 in case of 0, for now
      result[key as keyof Attributes] *= value > 0 ? value : 1;
    }
  });
  for (const [rKey, value] of Object.entries(result)) {
    normalizedResult[rKey as keyof Attributes] = value / normalizeFactor;
  }

  return { result, normalizedResult };
}

function averageAggregation(preferences: Attributes[]): AggregationResult {
  const normalizeFactor = preferences.length;
  const result: Attributes = {
    nature: 1,
    architecture: 1,
    hiking: 1,
    wintersports: 1,
    beach: 1,
    culture: 1,
    culinary: 1,
    entertainment: 1,
    shopping: 1,
  };
  const normalizedResult = { ...result };

  preferences.forEach((preference) => {
    for (const [key, value] of Object.entries(preference)) {
      result[key as keyof Attributes] += value;
    }
  });
  for (const [rKey, value] of Object.entries(result)) {
    normalizedResult[rKey as keyof Attributes] = value / normalizeFactor;
  }

  return { result, normalizedResult };
}
