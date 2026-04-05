const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      profile: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });
  
  for (const user of users) {
    const friendsCount = await prisma.friendship.count({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: user.id },
          { addresseeId: user.id },
        ],
      },
    });
    console.log(`User: ${user.profile?.username}, Friends: ${friendsCount}, Followers: ${user._count.followers}, Following: ${user._count.following}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
