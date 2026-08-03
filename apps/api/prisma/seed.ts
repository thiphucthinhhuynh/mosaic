import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

// Obviously not a real bcrypt hash (those look like `$2b$10$...`) — auth
// isn't implemented until Milestone 2, so there's nothing real to hash yet.
const PLACEHOLDER_PASSWORD_HASH = 'placeholder-hash::not-a-real-credential';

const users = [
  { username: 'ada_lovelace', email: 'ada@example.com', profilePic: null },
  { username: 'grace_hopper', email: 'grace@example.com', profilePic: null },
  {
    username: 'linus_t',
    email: 'linus@example.com',
    profilePic: 'https://example.com/avatars/linus.png',
  },
];

async function main() {
  for (const user of users) {
    // upsert keyed on username makes this safe to re-run — a second `prisma
    // db seed` updates nothing rather than failing on the unique constraint.
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: { ...user, passwordHash: PLACEHOLDER_PASSWORD_HASH },
    });
  }
  console.log(`Seeded ${users.length} users.`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
