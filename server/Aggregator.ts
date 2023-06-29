import { GroupRecommendation, Prisma, PrismaClient, RankResult } from '@prisma/client';
import type { Request, Response } from 'express';
import fetch from 'node-fetch';
import papa from 'papaparse';

import { entries, values } from './util/helpers';

const DEBUG_MODE = true;

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
  private _ready = false;

  /**
   * Country information. **CAUTION**: Only filled when `ready` is true!
   */
  public countries: Region[] = [];

  /**
   * The prisma instance for db communication
   */
  public prisma = new PrismaClient();

  /**
   * Maximum value that can be set in voting of attributes.
   * Needed for aggregation algorithms
   */
  private MAX_VOTE_VALUE = 100;

  constructor() {
    this.initCountries();
  }

  /**
   * Indicates whether setup initialization processing is complete
   */
  public get ready() {
    return this._ready;
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
        include: {
          aggregationResults: true,
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
    if (!this.ready) {
      return;
    }
    const params = req.query.id as string;

    try {
      const recommenation = await this.prisma.groupRecommendation.findUniqueOrThrow({
        where: {
          id: params,
        },
      });
      if (recommenation.votingEnded && !DEBUG_MODE) {
        res.status(405).send('Voting already closed!');
        return;
      }
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }

    type FullGR = Prisma.GroupRecommendationGetPayload<{ include: { userVotes: true } }>;
    let entity: FullGR;

    const updateQuery = {
      where: {
        id: params,
      },
      data: {
        votingEnded: true,
      },
      include: {
        userVotes: true,
      },
    };
    try {
      entity = await this.prisma.groupRecommendation.update(updateQuery);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
      return;
    }

    const userVotes: Attributes[] = entity.userVotes.map((userVote) => userVote.preferences);
    if (userVotes.length === 0) {
      res.status(500).send('No votes for this code');
      return;
    }

    const multi = this.multiplicativeAggregation(userVotes);
    const average = this.averageAggregation(userVotes).normalizedResult;
    const borda = this.bordaCountAggregation(this.rankPreferences(userVotes));
    const pleasure = this.mostPleasureAggregation(userVotes);

    const rankedCountriesMultiExact = this.getRankedCountriesFromPreferencesExact(multi.normalizedResult).slice(0, 10);
    const rankedCountriesAverageExact = this.getRankedCountriesFromPreferencesExact(average).slice(0, 10);
    const rankedCountriesBordaExact = this.getRankedCountriesFromPreferencesExact(borda.normalizedResult).slice(0, 10);
    const rankedCountriesPleasureExact = this.getRankedCountriesFromPreferencesExact(pleasure).slice(0, 10);

    const rankedCountriesMultiMinimum = this.getRankedCountriesFromPreferencesMinimum(multi.normalizedResult).slice(0, 10);
    const rankedCountriesAverageMinimum = this.getRankedCountriesFromPreferencesMinimum(average).slice(0, 10);
    const rankedCountriesBordaMinimum = this.getRankedCountriesFromPreferencesMinimum(borda.normalizedResult).slice(0, 10);
    const rankedCountriesPleasureMinimum = this.getRankedCountriesFromPreferencesMinimum(pleasure).slice(0, 10);

    const insertQuery = {
      where: {
        id: params,
      },
      data: {
        aggregationResults: {
          create: [
            {
              method: 'multiplicative',
              rankedCountries: rankedCountriesMultiExact,
            },
            {
              method: 'average',
              rankedCountries: rankedCountriesAverageExact,
            },
            {
              method: 'bordaCount',
              rankedCountries: rankedCountriesBordaExact,
            },
            {
              method: 'mostPleasure',
              rankedCountries: rankedCountriesPleasureExact,
            },
          ],
        },
      },
    };

    let gr: GroupRecommendation | undefined;
    try {
      if (!DEBUG_MODE) {
        gr = await this.prisma.groupRecommendation.update(insertQuery);
      }
    } catch (e) {
      console.log(e);
      res.status(500).send('DB failure on inserting aggregationResults');
      return;
    }

    res.send({
      rankedCountriesMultiExact,
      rankedCountriesMultiMinimum,
      multi,
      rankedCountriesAverageExact,
      rankedCountriesAverageMinimum,
      average,
      rankedCountriesBordaExact,
      rankedCountriesBordaMinimum,
      borda,
      rankedCountriesPleasureExact,
      rankedCountriesPleasureMinimum,
      pleasure,
      gr,
    });
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

  private mostPleasureAggregation(preferences: Attributes[]) {
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

  private async initCountries() {
    const countryScoresUrl = 'https://raw.githubusercontent.com/assalism/travel-data/main/regionmodel.csv';

    const processCountries = (data: any[]) => {
      this.countries = data.flatMap((raw: any) =>
        raw.u_name?.length > 0
          ? {
              name: raw.Region,
              parentRegion: raw.ParentRegion,
              u_name: raw.u_name,
              costPerWeek: raw.costPerWeek,
              attributes: this.getAttributesFromRawCountry(raw),
            }
          : [],
      );
      this._ready = true;
    };

    const stripBom = function (str: string) {
      if (str.charCodeAt(0) === 0xfeff) {
        return str.slice(1);
      }
      return str;
    };

    const stream = papa.parse(papa.NODE_STREAM_INPUT, { header: true });

    const dataStream = await fetch(countryScoresUrl);
    if (!dataStream.body) {
      console.log('Error while fetching countryScores csv file: ', dataStream);
      return;
    }
    dataStream.body.pipe(stream);

    const data: RawCountry[] = [];
    stream.on('data', (chunk) => {
      const input = Object.fromEntries(Object.entries(chunk).map(([k, v]) => [stripBom(k), v]));
      data.push(input as any);
    });

    stream.on('finish', () => {
      processCountries(data);
    });
  }

  private getAttributesFromRawCountry(raw: RawCountry): Attributes {
    return {
      nature: this.convertAttribute(raw.nature),
      architecture: this.convertAttribute(raw.architecture),
      hiking: this.convertAttribute(raw.hiking),
      wintersports: this.convertAttribute(raw.wintersports),
      beach: this.convertAttribute(raw.beach),
      culture: this.convertAttribute(raw.culture),
      culinary: this.convertAttribute(raw.culinary),
      entertainment: this.convertAttribute(raw.entertainment),
      shopping: this.convertAttribute(raw.shopping),
    };
  }

  private convertAttribute(value: string) {
    let numScore;
    switch (value) {
      case '--':
        numScore = 0;
        break;
      case '-':
        numScore = 25;
        break;
      case 'o':
        numScore = 50;
        break;
      case '+':
        numScore = 75;
        break;
      case '++':
        numScore = 100;
        break;
      default:
        numScore = 50;
    }
    return numScore;
  }

  private getRankedCountries(pref: Attributes, scoreFunction: (should: number, is: number) => number): RankResult[] {
    const countries: RankResult[] = this.countries.map((country) => {
      const attributeScore = this.getNewEmptyAttributes();
      let totalScore = 0;
      for (const [rKey, value] of entries(country.attributes)) {
        // const subScore = 100 - Math.abs(pref[rKey] - value);
        const subScore = scoreFunction(pref[rKey], value);
        attributeScore[rKey] = subScore;
        totalScore += subScore;
      }
      const result = {
        u_name: country.u_name,
        rank: 0,
        totalScore: totalScore / 9,
        attributeScore,
      };
      const debug = DEBUG_MODE
        ? {
            name: country.name, // for debug only
            countryAttributes: country.attributes, // for debug only
          }
        : undefined;
      return {
        ...result,
        ...debug,
      };
    });
    countries.sort((a, b) => b.totalScore - a.totalScore);
    countries.forEach((country, idx) => (country.rank = idx + 1));
    return countries;
  }

  private getRankedCountriesFromPreferencesExact(pref: Attributes): RankResult[] {
    const scoreFunction = (should: number, is: number) => {
      return 100 - Math.abs(should - is);
    };
    return this.getRankedCountries(pref, scoreFunction);
  }

  private getRankedCountriesFromPreferencesMinimum(pref: Attributes): RankResult[] {
    const scoreFunction = (should: number, is: number) => {
      const diff = is - should;
      return diff > 0 ? Math.min(25, diff) : diff * 10;
    };
    return this.getRankedCountries(pref, scoreFunction);
  }
}
