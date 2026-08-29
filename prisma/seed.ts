import { PrismaClient, Category, Priority, WishlistStatus, GoalStatus, MilestoneType } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Seed scripts run outside the app's request lifecycle, so instantiating a
// client directly here (rather than importing lib/db.ts) is the standard
// Prisma convention and does not risk exhausting a serverless connection pool.
const prisma = new PrismaClient();

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  await prisma.milestone.deleteMany({ where: { user: { email: 'demo@vantea.app' } } });
  await prisma.goal.deleteMany({ where: { user: { email: 'demo@vantea.app' } } });
  await prisma.wishlistItem.deleteMany({ where: { user: { email: 'demo@vantea.app' } } });
  await prisma.worthSnapshot.deleteMany({ where: { user: { email: 'demo@vantea.app' } } });
  await prisma.item.deleteMany({ where: { user: { email: 'demo@vantea.app' } } });
  await prisma.user.deleteMany({ where: { email: 'demo@vantea.app' } });

  const passwordHash = await bcrypt.hash('demo-password-123', 10);

  const user = await prisma.user.create({
    data: {
      name: 'Demo Builder',
      email: 'demo@vantea.app',
      passwordHash,
      baseCurrency: 'NGN',
      isGuest: false,
    },
  });

  // Items span all 11 categories (so the seeded data can exercise the
  // CATEGORY_FILLED milestone) and include unvalued Skills/Places/People
  // entries, per the product's "not everything needs a monetary value" rule.
  await prisma.item.createMany({
    data: [
      {
        userId: user.id,
        name: 'Building Websites',
        category: Category.SKILLS,
        whyNote: 'Learned this from scratch so I could freelance.',
        acquiredDate: daysAgo(1080),
        createdAt: daysAgo(1080),
      },
      {
        userId: user.id,
        name: 'Lagos',
        category: Category.PLACES,
        whyNote: 'The city where I built everything I have.',
        acquiredDate: daysAgo(1000),
        createdAt: daysAgo(1000),
      },
      {
        userId: user.id,
        name: 'A mentor who believed in me early',
        category: Category.PEOPLE,
        whyNote: 'Pushed me to start freelancing before I felt ready.',
        acquiredDate: daysAgo(950),
        createdAt: daysAgo(950),
      },
      {
        userId: user.id,
        name: 'Freelance design business',
        category: Category.BUSINESS,
        value: '2000000.00',
        currency: 'NGN',
        whyNote: 'Started this from nothing.',
        acquiredDate: daysAgo(540),
        createdAt: daysAgo(540),
      },
      {
        userId: user.id,
        name: 'Savings account',
        category: Category.MONEY,
        value: '5000000.00',
        currency: 'NGN',
        acquiredDate: daysAgo(500),
        createdAt: daysAgo(500),
      },
      {
        userId: user.id,
        name: '2-bedroom apartment',
        category: Category.HOME_AND_LAND,
        value: '45000000.00',
        currency: 'NGN',
        whyNote: 'Years of saving finally paid off.',
        acquiredDate: daysAgo(365),
        createdAt: daysAgo(365),
      },
      {
        userId: user.id,
        name: 'Toyota Camry',
        category: Category.CARS_AND_VEHICLES,
        value: '16000000.00',
        currency: 'NGN',
        whyNote: 'The first car I bought myself.',
        acquiredDate: daysAgo(300),
        createdAt: daysAgo(300),
      },
      {
        userId: user.id,
        name: "Grandma's recipe book",
        category: Category.OTHER,
        whyNote: 'A piece of family history I keep close.',
        acquiredDate: daysAgo(240),
        createdAt: daysAgo(240),
      },
      {
        userId: user.id,
        name: 'Vinyl record collection',
        category: Category.COLLECTIONS,
        value: '300000.00',
        currency: 'NGN',
        acquiredDate: daysAgo(150),
        createdAt: daysAgo(150),
      },
      {
        userId: user.id,
        name: 'Gold necklace',
        category: Category.JEWELRY_AND_LUXURY,
        value: '850000.00',
        currency: 'NGN',
        acquiredDate: daysAgo(120),
        createdAt: daysAgo(120),
      },
      {
        userId: user.id,
        name: 'MacBook Pro',
        category: Category.TECH,
        value: '3500000.00',
        currency: 'NGN',
        whyNote: 'Needed it for my design business.',
        acquiredDate: daysAgo(90),
        createdAt: daysAgo(90),
      },
      {
        userId: user.id,
        name: 'iPad Pro',
        category: Category.TECH,
        value: '1200.00',
        currency: 'USD',
        whyNote: 'Bought while on a trip — kept the receipt in dollars.',
        acquiredDate: daysAgo(45),
        createdAt: daysAgo(45),
      },
    ],
  });

  // Worth snapshots — append-only history, one series per currency, growing
  // over time to give the timeline real shape.
  await prisma.worthSnapshot.createMany({
    data: [
      { userId: user.id, totalValue: '2000000.00', itemCount: 4, currency: 'NGN', capturedAt: daysAgo(540) },
      { userId: user.id, totalValue: '7000000.00', itemCount: 5, currency: 'NGN', capturedAt: daysAgo(500) },
      { userId: user.id, totalValue: '52000000.00', itemCount: 6, currency: 'NGN', capturedAt: daysAgo(365) },
      { userId: user.id, totalValue: '68000000.00', itemCount: 7, currency: 'NGN', capturedAt: daysAgo(300) },
      { userId: user.id, totalValue: '68300000.00', itemCount: 9, currency: 'NGN', capturedAt: daysAgo(150) },
      { userId: user.id, totalValue: '69150000.00', itemCount: 10, currency: 'NGN', capturedAt: daysAgo(120) },
      { userId: user.id, totalValue: '72650000.00', itemCount: 11, currency: 'NGN', capturedAt: daysAgo(90) },
      { userId: user.id, totalValue: '1200.00', itemCount: 1, currency: 'USD', capturedAt: daysAgo(45) },
    ],
  });

  await prisma.wishlistItem.createMany({
    data: [
      {
        userId: user.id,
        name: 'Tesla Model 3',
        category: Category.CARS_AND_VEHICLES,
        estimatedValue: '35000000.00',
        currency: 'NGN',
        priority: Priority.SOMEDAY,
        status: WishlistStatus.WANTED,
      },
      {
        userId: user.id,
        name: 'A place by the beach',
        category: Category.HOME_AND_LAND,
        estimatedValue: '120000000.00',
        currency: 'NGN',
        priority: Priority.SOMEDAY,
        status: WishlistStatus.WANTED,
      },
      {
        userId: user.id,
        name: 'A proper camera',
        category: Category.TECH,
        estimatedValue: '800000.00',
        currency: 'NGN',
        priority: Priority.SOON,
        status: WishlistStatus.WANTED,
      },
    ],
  });

  await prisma.goal.createMany({
    data: [
      {
        userId: user.id,
        title: 'Save toward a rental property',
        targetValue: '10000000.00',
        currentProgress: '4500000.00',
        currency: 'NGN',
        status: GoalStatus.ACTIVE,
      },
      {
        userId: user.id,
        title: 'Build a starter emergency fund',
        targetValue: '2000000.00',
        currentProgress: '2000000.00',
        currency: 'NGN',
        status: GoalStatus.COMPLETED,
        completedAt: daysAgo(500),
      },
    ],
  });

  await prisma.milestone.createMany({
    data: [
      { userId: user.id, type: MilestoneType.FIRST_THING, achievedAt: daysAgo(1080) },
      { userId: user.id, type: MilestoneType.ONE_YEAR, achievedAt: daysAgo(715) },
      { userId: user.id, type: MilestoneType.FIRST_PROPERTY, achievedAt: daysAgo(365) },
      { userId: user.id, type: MilestoneType.TEN_THINGS, achievedAt: daysAgo(120) },
      { userId: user.id, type: MilestoneType.NEW_HIGH, payload: { value: '69150000.00', currency: 'NGN' }, achievedAt: daysAgo(120) },
      { userId: user.id, type: MilestoneType.NEW_HIGH, payload: { value: '72650000.00', currency: 'NGN' }, achievedAt: daysAgo(90) },
      { userId: user.id, type: MilestoneType.CATEGORY_FILLED, achievedAt: daysAgo(45) },
    ],
  });

  console.log(`Seeded demo user ${user.email} (${user.id}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
