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

    res.send(multi);
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
      result[key as keyof Attributes] *= value;
    }
  });
  for (const [rKey, value] of Object.entries(result)) {
    normalizedResult[rKey as keyof Attributes] = value / normalizeFactor;
  }

  return { result, normalizedResult };
}
