import type { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

export default async function getRecommendation(req: Request<{ code: string }>, res: Response, prisma: PrismaClient) {
  const params = req.query.code as string;
  try {
    const entity = await prisma.groupRecommendation.findFirstOrThrow({
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
