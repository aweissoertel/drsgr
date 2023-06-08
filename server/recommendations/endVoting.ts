import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

export default async function endVoting(req: Request<{ id: string }>, res: Response, prisma: PrismaClient) {
  const params = req.query.id as string;
  // TODO:
  // - get userVotes
  // - generate various results
  // - update gR with results
  try {
    const entity = await prisma.groupRecommendation.update({
      where: {
        id: params,
      },
      data: {
        votingEnded: true,
      },
    });
    res.send(entity);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}
