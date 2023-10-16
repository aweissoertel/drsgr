import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

export default class FinalVoter {
  constructor(private prisma: PrismaClient) {
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
}
