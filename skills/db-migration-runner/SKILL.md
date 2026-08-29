# DB Migration Runner Skill

Load this skill for any task that changes the database schema: adding a model or field, changing a type, adding an index or constraint, or writing a data migration. Do not edit `prisma/schema.prisma` or run migrations from memory. The schema holds a person's private record of everything they've built — it is the backbone of the product and of the privacy promise — so schema changes get their own commit and their own care.

Read `.agents/rules/architecture.md` and `.agents/rules/security.md` alongside this skill.

## The Migration Workflow

```bash
# 1. Edit prisma/schema.prisma (see conventions below).

# 2. Generate a migration and apply it locally.
npx prisma migrate dev --name <short_snake_case_name>

# 3. Read the generated SQL in prisma/migrations/<timestamp>_<name>/migration.sql.
#    Confirm it does what you intended and nothing destructive by surprise.

# 4. Regenerate the client if needed (migrate dev usually does this).
npx prisma generate

# 5. Commit schema.prisma AND the migration folder together, in their own commit.
```

In production (Neon on Vercel), migrations are applied with `npx prisma migrate deploy` (not `migrate dev`). Never hand-edit a migration that has already been applied anywhere; write a new migration instead.

## The Vantea Data Model

These are the core entities. Keep them aligned with the PRD; do not add models the MVP does not need. **There is no payment, order, transaction, bank-connection, or account-aggregation model in Vantea — every value is a personal estimate the user typed.**

```prisma
model User {
  id           String   @id @default(cuid())
  name         String?
  email        String?  @unique              // optional — Vantea is guest-first
  passwordHash String?  @map("password_hash") // null for a guest session
  baseCurrency String   @default("USD") @map("base_currency")
  isGuest      Boolean  @default(true) @map("is_guest")

  items        Item[]
  snapshots    WorthSnapshot[]
  wishlist     WishlistItem[]
  goals        Goal[]
  milestones   Milestone[]

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Item {
  id           String    @id @default(cuid())
  userId       String    @map("user_id")
  name         String
  category     Category
  value        Decimal?  @db.Decimal(18, 2)   // personal estimate; optional (Skills/Places/People may be unvalued)
  currency     String?
  acquiredDate DateTime? @map("acquired_date")
  whyNote      String?   @map("why_note")      // why it mattered — raw material for the recap
  imageUrl     String?   @map("image_url")     // optional, deferred to a later version

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  @@index([userId, category])
  @@index([userId, acquiredDate])
  @@map("items")
}

model WorthSnapshot {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  totalValue Decimal  @db.Decimal(18, 2) @map("total_value")
  itemCount  Int      @map("item_count")
  currency   String
  capturedAt DateTime @default(now()) @map("captured_at")

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, capturedAt])
  @@map("worth_snapshots")
}

model WishlistItem {
  id             String         @id @default(cuid())
  userId         String         @map("user_id")
  name           String
  category       Category
  estimatedValue Decimal?       @db.Decimal(18, 2) @map("estimated_value")
  currency       String?
  priority       Priority       @default(SOMEDAY)
  status         WishlistStatus @default(WANTED)

  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt      DateTime       @default(now()) @map("created_at")

  @@index([userId, status])
  @@map("wishlist_items")
}

model Goal {
  id              String     @id @default(cuid())
  userId          String     @map("user_id")
  title           String
  targetValue     Decimal?   @db.Decimal(18, 2) @map("target_value")
  currentProgress Decimal?   @db.Decimal(18, 2) @map("current_progress")
  currency        String?
  status          GoalStatus @default(ACTIVE)

  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime   @default(now()) @map("created_at")
  completedAt     DateTime?  @map("completed_at")

  @@index([userId, status])
  @@map("goals")
}

model Milestone {
  id         String        @id @default(cuid())
  userId     String        @map("user_id")
  type       MilestoneType
  payload    Json?         // details for the card, e.g. the count or the new-high figure
  achievedAt DateTime      @default(now()) @map("achieved_at")

  user       User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, achievedAt])
  @@map("milestones")
}

enum Category {
  HOME_AND_LAND
  CARS_AND_VEHICLES
  TECH
  MONEY
  JEWELRY_AND_LUXURY
  BUSINESS
  COLLECTIONS
  SKILLS
  PLACES
  PEOPLE
  OTHER
}

enum Priority       { NOW SOON SOMEDAY }
enum WishlistStatus { WANTED ACQUIRED ARCHIVED }
enum GoalStatus     { ACTIVE COMPLETED ARCHIVED }
enum MilestoneType  { FIRST_THING TEN_THINGS FIRST_PROPERTY CATEGORY_FILLED NEW_HIGH ONE_YEAR }
```

Notes on the model:

- **Values are `Decimal`, not `Float`.** They are personal estimates, but they get summed into "Your Worth," and floating-point drift on money-like figures is unacceptable. Use `Decimal(18, 2)`.
- **`value` and `estimatedValue` are optional.** The universal categories (Skills, Places, People) exist for the timeline and are not necessarily valued. Handle unvalued items gracefully everywhere.
- **`WorthSnapshot` is append-only.** Never update or delete a snapshot; the timeline is the history of what happened. Write one on every worth-changing item write (see `worth.ts`).
- **`whyNote` is precious.** It is what turns a line item into a memory and feeds the recap. Preserve it; never overwrite it silently.

## Milestone Idempotency

Most milestone types are **once-only** — `FIRST_THING`, `TEN_THINGS`, `FIRST_PROPERTY`, `CATEGORY_FILLED`, `ONE_YEAR` should each be awarded exactly once per user. The milestone engine in `lib/milestones.ts` checks before it inserts, inside a transaction, so a re-run never double-awards.

`NEW_HIGH` is the deliberate exception: a user can reach a new high many times, so it is not uniquely constrained and may appear more than once, each with its figure in `payload`. Do not add a blanket `@@unique([userId, type])` — it would break `NEW_HIGH`. Enforce once-only-ness for the other types in engine logic instead.

## Naming Conventions

- Models are `PascalCase` singular: `User`, `Item`, `WorthSnapshot`, `WishlistItem`, `Goal`, `Milestone`.
- Table names are `snake_case` plural via `@@map("...")`.
- Columns are `camelCase` in Prisma, mapped to `snake_case` with `@map("...")`.
- Enums are `PascalCase`; enum values are `SCREAMING_SNAKE_CASE`.

## Constraints and Indexes That Matter

- **`User.email` is unique but optional.** Guests have no email; accounts do. A unique constraint on a nullable column allows many NULLs in PostgreSQL, which is what guest-first needs.
- **Index by `userId` on everything.** Every query is scoped to a single user, so `(userId, ...)` composite indexes match the real access pattern: `(userId, category)` and `(userId, acquiredDate)` on items, `(userId, capturedAt)` on snapshots, `(userId, status)` on wishlist and goals.
- Use `onDelete: Cascade` on every child relation so deleting a user (or a guest) cleans up all their data. This is not just tidiness — it is how "delete my account" actually deletes everything.

## Migration Safety

- **Additive first.** Add a nullable column or a new table before you require it. Backfill data in a separate step. Only then tighten the constraint. A single migration that adds a required column to a populated table will fail.
- **Never edit an applied migration.** Write a new one.
- **Review the generated SQL every time.** `migrate dev` can generate a destructive step (a drop, a type change that loses data). Read it before committing — losing a user's collection is losing their memories.
- **Enums change carefully.** Adding an enum value (a new `Category` or `MilestoneType`) is safe; removing or renaming one needs a data migration for existing rows. Adding a category is an explicit product decision, not a casual change.
- Raw SQL is only allowed inside migration files.

## Seeding

Keep a `prisma/seed.ts` that creates a demo user with a realistic collection across several categories, a few snapshots spread over time (so the timeline renders), a couple of wishlist items and a goal, and one or two milestones. Seed data is how the reveal, worth, timeline, milestones, and warm empty states get exercised in development before real data exists. Use plausible estimates and dates; never seed anything that looks like real financial or bank data — there is none in this product.

## Common Mistakes

- Adding a `Payment`, `Order`, `Transaction`, `Account`, or `BankConnection` model. Vantea handles no money and connects to no bank — these do not belong.
- Storing a "market value," "live value," or anything the app would compute itself. Every value is the user's own estimate; the number never changes on its own.
- Using `Float` for values instead of `Decimal`.
- Making `value` required — it breaks unvalued categories (Skills, Places, People).
- Adding a blanket `@@unique([userId, type])` on `Milestone`, which breaks recurring `NEW_HIGH`.
- Updating or deleting `WorthSnapshot` rows — the timeline is append-only history.
- Forgetting `onDelete: Cascade`, which would leave orphaned data after "delete my account" and break the privacy promise.
- Adding a required column to a populated table in one step (backfill first).
- Editing a migration that's already been applied.