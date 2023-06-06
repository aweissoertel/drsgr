import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ... you will write your Prisma Client queries here
  /*await prisma.groupRecommendation.create({
    data: {
      sessionCode: 'ABC123',
      votingEnded: false,
      userVotes: {
        create: {
          name: 'Alex',
          preferences: {
            nature: 1,
            architecture: 0,
            hiking: 2,
            wintersports: 3,
            beach: 2,
            culture: 0,
            culinary: 0,
            entertainment: 1,
            shopping: 0,
          },
        },
      },
    },
  });*/

  const allRecs = await prisma.groupRecommendation.findMany({
    include: {
      userVotes: true,
    },
  });
  console.dir(allRecs, { depth: null });
}

export default function push() {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
