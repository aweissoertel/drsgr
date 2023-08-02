import type { PrismaClient, UserVote } from '@prisma/client';
import type { Request, Response } from 'express';

export default async function updateUserVote(req: Request<{ id: string }, UserVote>, res: Response, prisma: PrismaClient) {
  const id = req.query.id as string;
  const { id: bodyId, ...rest } = req.body;
  if (id !== bodyId) {
    res.sendStatus(500);
    return;
  }
  try {
    const entity = await prisma.userVote.update({
      where: {
        id,
      },
      data: rest,
    });
    res.send(entity);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
}
