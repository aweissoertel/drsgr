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
    const borda = bordaCountAggregation(rankPreferences(userVotes));

    res.send({ multi, average, borda });
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
    for (const [key, value] of entries(preference)) {
      // PROBLEM: value of 0. Multiplies everything to 0.
      // setting value to 1 in case of 0, for now
      result[key] *= value > 0 ? value : 1;
    }
  });
  for (const [rKey, value] of entries(result)) {
    normalizedResult[rKey] = value / normalizeFactor;
  }

  return { result, normalizedResult };
}

function averageAggregation(preferences: Attributes[]): AggregationResult {
  const normalizeFactor = preferences.length;
  const result: Attributes = {
    nature: 0,
    architecture: 0,
    hiking: 0,
    wintersports: 0,
    beach: 0,
    culture: 0,
    culinary: 0,
    entertainment: 0,
    shopping: 0,
  };
  const normalizedResult = { ...result };

  preferences.forEach((preference) => {
    for (const [key, value] of entries(preference)) {
      result[key] += value;
    }
  });
  for (const [rKey, value] of entries(result)) {
    normalizedResult[rKey] = value / normalizeFactor;
  }

  return { result, normalizedResult };
}

interface RankedPreferences {
  nature: RankDetails;
  architecture: RankDetails;
  hiking: RankDetails;
  wintersports: RankDetails;
  beach: RankDetails;
  culture: RankDetails;
  culinary: RankDetails;
  entertainment: RankDetails;
  shopping: RankDetails;
}

interface RankDetails {
  preference: number;
  rating: number;
}

/**
 * This function assigns ranks to preferences as a preperation for the Borda Count algorithm.
 * The ranks are assigned lowest to highest preference, starting from 0 and giving the same rank for same preference
 * @param preferences {Attributes[]} The preferences to rank
 * @returns
 */
function rankPreferences(preferences: Attributes[]) {
  const result = preferences.map((item) => {
    const ranking = {} as RankedPreferences;
    for (const [rKey, value] of entries(item)) {
      ranking[rKey] = { preference: value, rating: -1 };
    }

    let currentPreference = 0; // assumes MAX_VOTE_VALUE = 100 and increments of 25
    let preferenceUsed = false;
    let currentRating = 0;
    while (values(ranking).some((attribute) => attribute.rating === -1)) {
      for (const [rKey, value] of entries(ranking)) {
        if (value.preference === currentPreference) {
          ranking[rKey].rating = currentRating;
          preferenceUsed = true;
        }
      }
      currentPreference += 25;
      if (preferenceUsed) {
        currentRating++;
        preferenceUsed = false;
      }
    }

    return ranking;
  });

  return result;
}

function bordaCountAggregation(preferences: RankedPreferences[]) {
  // 4 because that is the highest rank a preference can obtain with 5 distinct vote options
  const normalizeFactor = preferences.length * 4;
  const result: Attributes = {
    nature: 0,
    architecture: 0,
    hiking: 0,
    wintersports: 0,
    beach: 0,
    culture: 0,
    culinary: 0,
    entertainment: 0,
    shopping: 0,
  };
  const normalizedResult = { ...result };

  preferences.forEach((preference) => {
    for (const [key, value] of entries(preference)) {
      result[key] += value.rating;
    }
  });
  for (const [rKey, value] of entries(result)) {
    // use rule of three to bring highest achievable borda count to 100
    normalizedResult[rKey] = (value * 100) / normalizeFactor;
  }

  return { result, normalizedResult };
}

type Entry<T> = { [K in keyof T]: [K, T[K]] }[keyof T];
function entries<T extends object>(object: T): ReadonlyArray<Entry<T>> {
  return Object.entries(object) as unknown as ReadonlyArray<Entry<T>>;
}

type Value<T> = { [K in keyof T]: T[K] }[keyof T];
function values<T extends object>(object: T): ReadonlyArray<Value<T>> {
  return Object.values(object) as unknown as ReadonlyArray<Value<T>>;
}
