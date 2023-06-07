import { PrismaClient } from '@prisma/client';
import type { Response } from 'express';

export default async function createRecommendation(res: Response, prisma: PrismaClient) {
  // https://stackoverflow.com/a/12502559
  // generates alphanumeric code in the form of ABC123:
  // string of length 6 with random uppercase letters and digits
  // duplicates after 70 million generations
  const sessionCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  // TODO: make sure this is really unique

  try {
    const entity = await prisma.groupRecommendation.create({
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
