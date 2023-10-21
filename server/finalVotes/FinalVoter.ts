import type { FinalVote, PrismaClient, RankResult } from '@prisma/client';
import type { Request, Response } from 'express';

export default class FinalVoter {
  constructor(
    private prisma: PrismaClient,
    private countries: Region[],
  ) {
    // no-op
  }

  public async saveVote(req: Request<any, SaveVoteBody>, res: Response) {
    const { id, ...rest } = req.body;

    try {
      const vote = await this.prisma.finalVote.update({
        where: {
          id,
        },
        data: {
          ...rest,
        },
      });
      res.send(vote);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }

  public async getVotes(req: Request<IdReq>, res: Response) {
    const params = req.query.id as string;

    try {
      const votes = await this.prisma.finalVote.findMany({
        where: {
          recommendation: {
            id: params,
          },
        },
      });
      res.send(votes);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }

  public async concludeSession(req: Request<IdReq>, res: Response) {
    const params = req.query.id as string;

    try {
      await this.prisma.groupRecommendation.update({
        where: {
          id: params,
        },
        data: {
          concluded: true,
        },
      });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }

    let votes: FinalVote[] = [];
    try {
      votes = await this.prisma.finalVote.findMany({
        where: {
          recommendation: {
            id: params,
          },
        },
      });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }

    const preparedVotes = this.prepareFinalVotes(votes);

    const results = this.multiplicativeAggregationAR(preparedVotes);
    results.sort((a, b) => b.totalScore - a.totalScore);
    const winners = results.slice(0, 3);

    try {
      const updated = await this.prisma.groupRecommendation.update({
        where: {
          id: params,
        },
        data: {
          finalWinners: winners,
        },
      });
      res.send(updated);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }

  public async reopenSession(req: Request<IdReq>, res: Response) {
    const params = req.query.id as string;

    try {
      const updated = await this.prisma.groupRecommendation.update({
        where: {
          id: params,
        },
        data: {
          concluded: false,
          finalWinners: undefined,
        },
        include: {
          aggregationResultsAR: true,
          aggregationResultsAP: true,
          userVotes: true,
          aggregatedInput: true,
        },
      });
      res.send(updated);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }

  private prepareFinalVotes(votes: FinalVote[]): RankResult[][] {
    return votes.map((vote) =>
      [vote.first, vote.second, vote.third].flatMap((item, idx) =>
        item
          ? [
              {
                u_name: item,
                rank: idx + 1,
                rankReverse: 3 - idx,
                rankOverBudget: idx + 1,
                overBudget: false,
                totalScore: 0,
              },
            ]
          : [],
      ),
    );
  }

  private multiplicativeAggregationAR(recommendations: RankResult[][]): RankResult[] {
    const start: RankResult[] = this.countries.map((country) => ({
      u_name: country.u_name,
      totalScore: 1,
      rank: 0,
      rankReverse: 0,
      rankOverBudget: 0,
      overBudget: false,
    }));
    const result = recommendations.reduce(
      (accumulator, current) =>
        accumulator.map((country) => {
          const score = country.totalScore * (current.find((element) => element.u_name === country.u_name)?.rankReverse || 1);
          return {
            ...country,
            totalScore: score,
          };
        }),
      start,
    );
    return result;
  }
}
