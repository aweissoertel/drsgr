import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

export default async function deleteUserVote(req: Request<{ id: string }>, res: Response, prisma: PrismaClient) {
  const params = req.query.id as string;
  try {
    await prisma.userVote.delete({
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
