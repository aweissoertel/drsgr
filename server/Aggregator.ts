import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

import { entries, values } from './util/helpers';

interface AggregationResult {
  result: Attributes;
  normalizedResult: Attributes;
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

export default class Aggregator {
  public countries = [];

  /**
   * The prisma instance for db communication
   */
  public prisma = new PrismaClient();

  /**
   * Maximum value that can be set in voting of attributes.
   * Needed for aggregation algorythms
   */
  private MAX_VOTE_VALUE = 100;

  constructor() {
    // noop
  }

  ////////////////////////////// ENDPOINTS //////////////////////////////

  /**
   * Handles the creation of a new recommendation. Responds with this recommendation
   */
  public async createRecommendation(res: Response) {
    // https://stackoverflow.com/a/12502559
    // generates alphanumeric code in the form of ABC123:
    // string of length 6 with random uppercase letters and digits
    // duplicates after 70 million generations
    const sessionCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    // TODO: make sure this is really unique

    try {
      const entity = await this.prisma.groupRecommendation.create({
        data: {
          sessionCode,
          votingEnded: false,
        },
      });
      res.send(entity);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }

  /**
   * Handles get request for a recommendation. Tries to find a recommendation by **code**, *not* id.
   * Responds whole recommendation if found, 500 if not
   * @param req Request with recommenation `code` as query parameter
   * @param res Response object
   */
  public async getRecommendation(req: Request<{ code: string }>, res: Response) {
    const params = req.query.code as string;
    try {
      const entity = await this.prisma.groupRecommendation.findFirstOrThrow({
        where: {
          sessionCode: params,
        },
      });
      res.send(entity);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }

  /**
   * Handles deletion of recommendation
   * @param req Request with recommenation `id` as query parameter
   * @param res Response object
   */
  public async deleteRecommendation(req: Request<{ id: string }>, res: Response) {
    const params = req.query.id as string;
    try {
      await this.prisma.groupRecommendation.delete({
        where: {
          id: params,
        },
      });
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }

  /**
   * Handles end of voting for a recommendation
   * @param req Request with recommenation `id` as query parameter
   * @param res Response object
   */
  public async endVoting(req: Request<{ id: string }>, res: Response) {
    const params = req.query.id as string;
    // TODO:
    // - update gR with results

    // check if not already closed?
    try {
      const entity = await this.prisma.groupRecommendation.update({
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

      const multi = this.multiplicativeAggregation(userVotes);
      const average = this.averageAggregation(userVotes).normalizedResult;
      const borda = this.bordaCountAggregation(this.rankPreferences(userVotes));
      const pleasure = this.mostPleasure(userVotes);

      res.send({ multi, average, borda, pleasure });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }

  ////////////////////////////// AGGREGATION LOGIC //////////////////////////////

  private multiplicativeAggregation(preferences: Attributes[]): AggregationResult {
    const normalizeFactor = this.MAX_VOTE_VALUE ** (preferences.length - 1);
    const result = this.getNewEmptyAttributes(1);
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

  private averageAggregation(preferences: Attributes[]): AggregationResult {
    const normalizeFactor = preferences.length;
    const result = this.getNewEmptyAttributes();
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

  private bordaCountAggregation(preferences: RankedPreferences[]) {
    // 4 because that is the highest rank a preference can obtain with 5 distinct vote options
    const normalizeFactor = preferences.length * 4;
    const result = this.getNewEmptyAttributes();
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

  private mostPleasure(preferences: Attributes[]) {
    const result = this.getNewEmptyAttributes();

    preferences.forEach((preference) => {
      for (const [key, value] of entries(preference)) {
        result[key] = Math.max(result[key], value);
      }
    });

    return result;
  }

  ////////////////////////////// HELPERS //////////////////////////////

  /**
   * This function assigns ranks to preferences as a preperation for the Borda Count algorithm.
   * The ranks are assigned lowest to highest preference, starting from 0 and giving the same rank for same preference
   * @param preferences {Attributes[]} The preferences to rank
   * @returns
   */
  private rankPreferences(preferences: Attributes[]) {
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

  private getNewEmptyAttributes(fill = 0): Attributes {
    return {
      nature: fill,
      architecture: fill,
      hiking: fill,
      wintersports: fill,
      beach: fill,
      culture: fill,
      culinary: fill,
      entertainment: fill,
      shopping: fill,
    };
  }
}
