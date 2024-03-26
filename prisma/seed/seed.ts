import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

import { hash } from '../../server/lib/hash.ts';
import { USER_STATE } from "../../server/lib/models/user.ts";
import { WORK_STATE, WORK_PHASE } from "../../server/lib/models/work.ts";
import { TALLY_STATE, TALLY_MEASURE } from "../../server/lib/models/tally.ts";
import { TAG_STATE, TAG_DEFAULT_COLOR } from "../../server/lib/models/tag.ts";

type SeedUser = {
  username: string;
  password: string;

  tags: SeedTag[];
  works: SeedWork[];
  // tally: SeedTally[]; // for tallies without any works associated
};

type SeedTag = {
  name: string;
};

type SeedWork = {
  title: string;
  description: string;
  phase: string;

  // tallies CAN exist outside of works
  // but in this case we're simplifying for the sake of seeding
  tallies: SeedTally[];
};

type SeedTally = {
  date: string;
  measure: string;
  count: number;
  note: string;
  tags: string[];
};

const SEED_USERS: SeedUser[] = [
  {
    username: 'tagger1',
    password: 'tagger1',
    tags: [
      { name: 'short' },
      { name: 'red' },
      { name: 'january challenge' },
    ],
    works: [
      {
        title: 'Original Short Story',
        description: 'Defintely not a riff on Gift of the Magi',
        phase: WORK_PHASE.DRAFTING,
        tallies: [
          {
            date: '2024-01-01',
            measure: TALLY_MEASURE.WORD,
            count: 1010,
            note: '',
            tags: [ 'short', 'january challenge' ],
          },
          {
            date: '2024-01-02',
            measure: TALLY_MEASURE.WORD,
            count: 1020,
            note: '',
            tags: [ 'short', 'january challenge', 'red' ],
          },
          {
            date: '2024-01-03',
            measure: TALLY_MEASURE.WORD,
            count: 1030,
            note: 'Feeling good today!',
            tags: [ 'short', 'january challenge' ],
          },
          {
            date: '2024-01-04',
            measure: TALLY_MEASURE.WORD,
            count: 1040,
            note: '',
            tags: [ 'short', 'january challenge' ],
          },
        ],
      },
      {
        title: 'Novellarina',
        description: 'A book that becomes a dancer',
        phase: WORK_PHASE.REVISING,
        tallies: [
          {
            date: '2024-01-29',
            measure: TALLY_MEASURE.WORD,
            count: 1667,
            note: '',
            tags: [ 'short', 'january challenge' ],
          },
          {
            date: '2024-01-30',
            measure: TALLY_MEASURE.WORD,
            count: 16993,
            note: '',
            tags: [ 'january challenge' ],
          },
          {
            date: '2024-01-31',
            measure: TALLY_MEASURE.WORD,
            count: 2005,
            note: 'Editing starts tomorrow',
            tags: [ 'short', 'january challenge' ],
          },
          {
            date: '2024-02-01',
            measure: TALLY_MEASURE.TIME,
            count: 120,
            note: 'Well, I guess I didn\'t need those scenes...',
            tags: [ 'red', 'revision season' ],
          },
        ]
      },
    ],
  }
];

async function main() {
  // TODO: blow it all away first

  console.log('Seeding tag-and-tally users and models...');
  for(const user of SEED_USERS) {
    const { hashedPassword, salt } = await hash(user.password);

    // create the user
    const createdUser = await db.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        state: USER_STATE.ACTIVE,
        username: user.username,
        displayName: user.username,
        email: `${user.username}@example.com`,
        isEmailVerified: true,
        userAuth: {
          create: {
            password: hashedPassword,
            salt: salt,
          }
        }
      }
    });
    console.log(`Created user ${createdUser.username}`);

    // create the tags
    const createdTags = await db.tag.createMany({
      data: user.tags.map(tag => ({
        ownerId: createdUser.id,
        state: TAG_STATE.ACTIVE,
        name: tag.name,
        color: TAG_DEFAULT_COLOR,
      })),
    });
    console.log(`Created ${createdTags.count} tags`);

    // create the works and tallies
    for(const work of user.works) {
      const createdWork = await db.work.create({
        data: {
          ownerId: createdUser.id,
          state: WORK_STATE.ACTIVE,
          title: work.title,
          description: work.description,
          phase: work.phase,
        },
      });
      console.log(`Created work ${createdWork.title}`);

      for(const tally of work.tallies) {
        await db.tally.create({
          data: {
            ownerId: createdUser.id,
            state: TALLY_STATE.ACTIVE,

            date: tally.date,
            measure: tally.measure,
            count: tally.count,
            note: tally.note,

            tags: {
              connectOrCreate: tally.tags.map(tagName => ({
                where: {
                  ownerId_name: {
                    ownerId: createdUser.id,
                    name: tagName,
                  },
                },
                create: {
                  ownerId: createdUser.id,
                  state: TAG_STATE.ACTIVE,
                  name: tagName,
                  color: TAG_DEFAULT_COLOR,
                }
              })),
            }
          }
        });
      }

      console.log(`Created tallies for work ${createdWork.title}`);
    }
  }
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
