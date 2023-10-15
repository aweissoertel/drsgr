import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

export interface CreateUserVoteBody {
  recommendationId: string;
  name: string;
  preferences: Attributes;
  budget: number;
}

export default async function createUserVote(req: Request<any, CreateUserVoteBody>, res: Response, prisma: PrismaClient) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { parentId, id, ...rest } = req.body;
  try {
    const entity = await prisma.userVote.create({
      data: {
        ...rest,
        recommendation: {
          connect: {
            id: parentId,
          },
        },
      },
    });
    res.send(entity);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}
