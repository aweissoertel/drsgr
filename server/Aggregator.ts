import { GroupRecommendation, Prisma, PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';
import fetch from 'node-fetch';
import { NODE_STREAM_INPUT, parse as papaparse } from 'papaparse';
import { toDataURL as generateQR } from 'qrcode';

import { userVotes } from './static/surveyData';
import { entries, values } from './util/helpers';

const DEBUG_MODE = false;

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
   * Returns the static list of countries
   * @param res Response object
   * @returns
   */
  public getCountries(res: Response) {
    if (!this._ready) return;
    res.send(this.countries);
  }

  /**
   * Handles the creation of a new recommendation. Responds with this recommendation
   */
  public async createRecommendation(req: Request<CreateRReq>, res: Response) {
    const { surveyMode } = req.query as any;
    const isSurvey = surveyMode === 'true';
    // https://stackoverflow.com/a/12502559
    // generates alphanumeric code in the form of ABC123:
    // string of length 6 with random uppercase letters and digits
    // duplicates after 70 million generations
    const sessionCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const surveyUsers = isSurvey ? { userVotes: { createMany: { data: userVotes } } } : undefined;

    try {
      const entity = await this.prisma.groupRecommendation.create({
        data: {
          sessionCode,
          votingEnded: false,
          concluded: false,
          qrcode: '',
          budget: 500,
          stayDays: isSurvey ? 3 : 7,
          description: '',
          surveyMode: isSurvey,
          ...surveyUsers,
        },
      });
      const qrcode = await generateQR(`https://group-travel.fly.dev/session/${entity.id}`);
      const fullEntity = await this.prisma.groupRecommendation.update({
        where: {
          id: entity.id,
        },
        data: {
          qrcode,
        },
      });
      res.send(fullEntity);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }

  /**
   * Handles get request for a recommendation. Tries to find a recommendation by `code` *or* `id`.
   * Responds recommendation if found, 500 if not
   * @param req Request with recommenation (`code` **and** `full = 1`) *or* (`id` **and** `full = 0`)  as query parameter
   * @param res Response object
   */
  public async getRecommendation(req: Request<GetReqI>, res: Response) {
    const { code, id, full } = req.query as any;
    const wantFull = full === '1';
    if ((!code && full === '0') || (!id && wantFull)) {
      res.sendStatus(400);
      return;
    }

    try {
      const entity = await this.prisma.groupRecommendation.findFirstOrThrow({
        where: {
          sessionCode: !wantFull ? code : undefined,
          id: wantFull ? id : undefined,
        },
        include: {
          aggregationResultsAR: wantFull,
          aggregationResultsAP: wantFull,
          userVotes: wantFull,
          aggregatedInput: wantFull,
        },
      });
      res.send(entity);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }

  public async updateRecommendation(req: Request<{ id: string }, UpdateRecommendationBody>, res: Response) {
    const params = req.query.id as string;
    const { stayDays, description } = req.body;
    try {
      await this.prisma.groupRecommendation.update({
        where: {
          id: params,
        },
        data: {
          stayDays,
          description,
        },
      });
      res.sendStatus(200);
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
    if (!params) {
      res.sendStatus(400);
      return;
    }
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
    if (!params) {
      res.sendStatus(400);
      return;
    }

    try {
      const recommendation = await this.prisma.groupRecommendation.findUniqueOrThrow({
        where: {
          id: params,
        },
      });
      if (recommendation.votingEnded && !DEBUG_MODE) {
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

    const userVotes = entity.userVotes.map((userVote) => ({
      preferences: userVote.preferences,
      name: userVote.name,
      budget: userVote.budget,
    }));
    if (userVotes.length === 0) {
      res.status(500).send('No votes for this code');
      return;
    }

    //////////////////////////// Budget ////////////////////////////

    const minBudget = Math.min(...userVotes.map((vote) => vote.budget));
    const groupBudgetPerWeek = (minBudget / entity.stayDays) * 7;

    //////////////////////////// AGGREGATING PROFILES ////////////////////////////
    const onlyPref = userVotes.map((vote) => vote.preferences);
    const multi = this.multiplicativeAggregationAP(onlyPref);
    const average = this.averageAggregationAP(onlyPref).normalizedResult;
    const borda = this.bordaCountAggregationAP(this.rankPreferences(onlyPref));
    const pleasure = this.mostPleasureAggregationAP(onlyPref);

    const rankedCountriesMultiExact = this.getRankedCountriesFromPreferencesExact(multi.normalizedResult, groupBudgetPerWeek);
    const rankedCountriesAverageExact = this.getRankedCountriesFromPreferencesExact(average, groupBudgetPerWeek);
    const rankedCountriesBordaExact = this.getRankedCountriesFromPreferencesExact(borda.normalizedResult, groupBudgetPerWeek);
    const rankedCountriesPleasureExact = this.getRankedCountriesFromPreferencesExact(pleasure, groupBudgetPerWeek);

    // const rankedCountriesMultiMinimum = this.getRankedCountriesFromPreferencesMinimum(multi.normalizedResult);
    // const rankedCountriesAverageMinimum = this.getRankedCountriesFromPreferencesMinimum(average);
    // const rankedCountriesBordaMinimum = this.getRankedCountriesFromPreferencesMinimum(borda.normalizedResult);
    // const rankedCountriesPleasureMinimum = this.getRankedCountriesFromPreferencesMinimum(pleasure);

    //////////////////////////// AGGREGATING RECOMMENDATIONS ////////////////////////////
    const recsWithName: RecPerName[] = userVotes.map((vote) => ({
      recommendations: this.getRankedCountriesFromPreferencesExact(vote.preferences, groupBudgetPerWeek),
      name: vote.name,
    }));
    const recommendationsPerUserVote: RankResult[][] = recsWithName.map((rec) => rec.recommendations);

    const multiAR = this.multiplicativeAggregationAR(recommendationsPerUserVote);
    const averageAR = this.averageAggregationAR(recommendationsPerUserVote);
    const bordaAR = this.bordaCountAggregationAR(recommendationsPerUserVote);
    const pleasureAR = this.mostPleasureAggregationAR(recommendationsPerUserVote);
    const withoutMiseryAR = this.averageWithoutMiseryAggregationAR(recommendationsPerUserVote);

    //////////////////////////// UPDATE DB & SEND RESPONSE ////////////////////////////
    const finalVotes = (): Prisma.FinalVoteCreateManyRecommendationInputEnvelope => {
      if (!entity.surveyMode) {
        return { data: userVotes.map((vote) => ({ name: vote.name })) };
      } else {
        const users = userVotes.filter((vote) => vote.name !== 'Alice' && vote.name !== 'Bob');
        return {
          data: [
            {
              name: 'Alice',
              first: multiAR[0].u_name,
              second: multiAR[1].u_name,
              third: multiAR[2].u_name,
            },
            {
              name: 'Bob',
              first: averageAR[0].u_name,
              second: averageAR[1].u_name,
              third: averageAR[2].u_name,
            },
            ...users.map((vote) => ({ name: vote.name })),
          ],
        };
      }
    };

    const insertQuery: Prisma.GroupRecommendationUpdateArgs = {
      where: {
        id: params,
      },
      data: {
        budget: minBudget,
        aggregationResultsAP: {
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
        aggregationResultsAR: {
          create: [
            {
              method: 'multiplicative',
              rankedCountries: multiAR,
            },
            {
              method: 'average',
              rankedCountries: averageAR,
            },
            {
              method: 'bordaCount',
              rankedCountries: bordaAR,
            },
            {
              method: 'mostPleasure',
              rankedCountries: pleasureAR,
            },
            {
              method: 'withoutMisery',
              rankedCountries: withoutMiseryAR,
            },
          ],
        },
        aggregatedInput: {
          create: {
            multiAP: multi.normalizedResult,
            averageAP: average,
            bordaCountAP: borda.normalizedResult,
            mostPleasureAP: pleasure,
            recommendationsPerUserVote: recsWithName.map((rec) => ({ list: rec.recommendations, name: rec.name })),
          },
        },
        finalVotes: {
          createMany: finalVotes(),
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

    res.send(gr);
  }

  public async reopenVoting(req: Request<{ id: string }>, res: Response) {
    const params = req.query.id as string;
    if (!params) {
      res.sendStatus(400);
      return;
    }
    try {
      const updated = await this.prisma.groupRecommendation.update({
        where: {
          id: params,
        },
        data: {
          votingEnded: false,
          aggregationResultsAR: {
            deleteMany: {},
          },
          aggregationResultsAP: {
            deleteMany: {},
          },
          aggregatedInput: {
            delete: true,
          },
        },
        include: {
          finalVotes: true,
        },
      });
      await this.prisma.finalVote.deleteMany({
        where: {
          id: { in: updated.finalVotes.map((vote) => vote.id) },
        },
      });
      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }

  ////////////////////////////// AGGREGATION LOGIC - AGGREGATING PROFILES //////////////////////////////

  private multiplicativeAggregationAP(preferences: Attributes[]): AggregationResult {
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

  private averageAggregationAP(preferences: Attributes[]): AggregationResult {
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

  private bordaCountAggregationAP(preferences: RankedPreferences[]) {
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

  private mostPleasureAggregationAP(preferences: Attributes[]) {
    const result = this.getNewEmptyAttributes();

    preferences.forEach((preference) => {
      for (const [key, value] of entries(preference)) {
        result[key] = Math.max(result[key], value);
      }
    });

    return result;
  }

  ////////////////////////////// AGGREGATION LOGIC - AGGREGATING RECOMMENDATIONS //////////////////////////////

  private multiplicativeAggregationAR(recommendations: RankResult[][]): RankResult[] {
    const start: RankResult[] = this.countries.map((country) => ({
      u_name: country.u_name,
      totalScore: 1,
      rank: 0,
      rankReverse: 0,
      rankOverBudget: 0,
      overBudget: recommendations[0].find((rec) => rec.u_name === country.u_name)!.overBudget,
    }));
    const result = recommendations.reduce(
      (accumulator, current) =>
        accumulator.map((country) => {
          const score = country.totalScore * current.find((element) => element.u_name === country.u_name)!.rankReverse;
          return {
            ...country,
            totalScore: score,
          };
        }),
      start,
    );
    this.sortAndUpdateRanks(result);
    return result;
  }

  private averageAggregationAR(recommendations: RankResult[][]): RankResult[] {
    const start: RankResult[] = this.countries.map((country) => ({
      u_name: country.u_name,
      totalScore: 0,
      rank: 0,
      rankReverse: 0,
      rankOverBudget: 0,
      overBudget: recommendations[0].find((rec) => rec.u_name === country.u_name)!.overBudget,
    }));
    const result = recommendations.reduce(
      (accumulator, current) =>
        accumulator.map((country) => {
          const score = country.totalScore + current.find((element) => element.u_name === country.u_name)!.rankReverse;
          return {
            ...country,
            totalScore: score,
          };
        }),
      start,
    );
    result.forEach((res) => (res.totalScore /= recommendations.length));
    this.sortAndUpdateRanks(result);
    return result;
  }

  private bordaCountAggregationAR(recommendations: RankResult[][]): RankResult[] {
    const start: RankResult[] = this.countries.map((country) => ({
      u_name: country.u_name,
      totalScore: 0,
      rank: 0,
      rankReverse: 0,
      rankOverBudget: 0,
      overBudget: recommendations[0].find((rec) => rec.u_name === country.u_name)!.overBudget,
    }));
    const result = recommendations.reduce(
      (accumulator, current) =>
        accumulator.map((country) => {
          const score = country.totalScore + current.find((element) => element.u_name === country.u_name)!.rankReverse - 1;
          return {
            ...country,
            totalScore: score,
          };
        }),
      start,
    );
    this.sortAndUpdateRanks(result);
    return result;
  }

  private mostPleasureAggregationAR(recommendations: RankResult[][]): RankResult[] {
    const start: RankResult[] = this.countries.map((country) => ({
      u_name: country.u_name,
      totalScore: 0,
      rank: 0,
      rankReverse: 0,
      rankOverBudget: 0,
      overBudget: recommendations[0].find((rec) => rec.u_name === country.u_name)!.overBudget,
    }));
    const result = recommendations.reduce(
      (accumulator, current) =>
        accumulator.map((country) => {
          const score = Math.max(country.totalScore, current.find((element) => element.u_name === country.u_name)!.rankReverse);
          return {
            ...country,
            totalScore: score,
          };
        }),
      start,
    );
    this.sortAndUpdateRanks(result);
    return result;
  }

  private averageWithoutMiseryAggregationAR(recommendations: RankResult[][]): RankResult[] {
    /**
     * This value determines what is considered "misery". `0.4` means the lower 40% of a ranked list are considered misery
     * and are therefore excluded from recommendations
     */
    const miseryPercentage = 0.4;

    const start: RankResult[] = this.countries.map((country) => ({
      u_name: country.u_name,
      totalScore: 0,
      rank: 0,
      rankReverse: 0,
      rankOverBudget: 0,
      overBudget: recommendations[0].find((rec) => rec.u_name === country.u_name)!.overBudget,
    }));
    const threshold = Math.floor((1 - miseryPercentage) * this.countries.length);
    const result = recommendations.reduce(
      (accumulator, current) =>
        current.map((country, idx) => {
          const accumulatorScore = accumulator.find((element) => element.u_name === country.u_name)!.totalScore;
          if (idx > threshold || accumulatorScore === -1) {
            return {
              ...country,
              totalScore: -1,
            };
          }
          const score = country.rankReverse + accumulatorScore;
          return {
            ...country,
            totalScore: score,
          };
        }),
      start,
    );
    const filtered = result.filter((item) => item.totalScore > 0);
    filtered.forEach((res) => (res.totalScore /= recommendations.length));
    this.sortAndUpdateRanks(filtered);
    return filtered;
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

    const stream = papaparse(NODE_STREAM_INPUT, { header: true });

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

  private getRankedCountries(pref: Attributes, scoreFunction: (should: number, is: number) => number, budget: number): RankResult[] {
    const countries: RankResult[] = this.countries.map((country) => {
      const attributeScore = this.getNewEmptyAttributes();
      let totalScore = 0;
      for (const [rKey, value] of entries(country.attributes)) {
        const subScore = scoreFunction(pref[rKey], value);
        attributeScore[rKey] = subScore;
        totalScore += subScore;
      }
      const overBudget = country.costPerWeek > budget;
      if (!overBudget) {
        totalScore += 100;
      }
      const result = {
        u_name: country.u_name,
        rank: 0,
        rankReverse: 0,
        rankOverBudget: 0,
        totalScore: totalScore / 10,
        overBudget,
      };
      const debug = DEBUG_MODE
        ? {
            name: country.name, // for debug only
            attributeScore, // for debug only
            countryAttributes: country.attributes, // for debug only
          }
        : undefined;
      return {
        ...result,
        ...debug,
      };
    });
    this.sortAndUpdateRanks(countries);
    return countries;
  }

  private getRankedCountriesFromPreferencesExact(pref: Attributes, budget: number): RankResult[] {
    const scoreFunction = (should: number, is: number) => {
      return 100 - Math.abs(should - is);
    };
    return this.getRankedCountries(pref, scoreFunction, budget);
  }

  private getRankedCountriesFromPreferencesMinimum(pref: Attributes, budget: number): RankResult[] {
    const scoreFunction = (should: number, is: number) => {
      const diff = is - should;
      return diff > 0 ? Math.min(25, diff) : diff * 10;
    };
    return this.getRankedCountries(pref, scoreFunction, budget);
  }

  private sortAndUpdateRanks(list: RankResult[]) {
    list.sort((a, b) => (b.overBudget ? 0 : b.totalScore) - (a.overBudget ? 0 : a.totalScore));
    list.forEach((country, idx) => {
      country.rankOverBudget = idx + 1;
    });
    list.sort((a, b) => b.totalScore - a.totalScore);
    list.forEach((country, idx) => {
      country.rank = idx + 1;
      country.rankReverse = list.length - idx;
    });
  }
}
