import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

export interface CreateUserVoteBody {
  recommendationId: string;
  name: string;
  preferences: Attributes;
}

export default async function createUserVote(
  req: Request<any, CreateUserVoteBody>,
  res: Response,
  prisma: PrismaClient,
) {
  try {
    const entity = await prisma.userVote.create({
      data: {
        ...req.body,
      },
    });
    res.send(entity);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}
