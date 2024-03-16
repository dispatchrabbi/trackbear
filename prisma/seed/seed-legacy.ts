import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

import { hash } from '../../server/lib/hash.ts';
import { USER_STATE } from "../../server/lib/models/user.ts";

type SeedUser = {
  username: string;
  password: string;
  projects?: SeedProject[],
};

type SeedProject = {
  title: string;
  type: string;
  goal: number | null;
  startDate: string | null;
  endDate: string | null;
  updates?: {
    date: string;
    value: number;
  }[]
};

const SEED_USERS: SeedUser[] = [
  {
    username: 'beartest1',
    password: 'beartest1',
    projects: [
      {
        title: 'March Short Stories',
        type: 'words',
        goal: null,
        startDate: null,
        endDate: '2024-03-31',
        updates: [
          { date: "2024-03-01", value: 1667 },
          { date: "2024-03-02", value: 1667 },
          { date: "2024-03-02", value: 1668 },
          { date: "2024-03-04", value: 1667 },
          { date: "2024-03-05", value: 1667 },
          { date: "2024-03-06", value: 1669 },
        ],
      },
      {
        title: 'January Challenge',
        type: 'words',
        goal: 50000,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        updates: [
          { date: "2024-01-01", value: 1234 },
          { date: "2024-01-02", value: 2345 },
          { date: "2024-01-03", value: 3456 },
          { date: "2024-01-04", value: 1234 },
          { date: "2024-01-05", value: 2345 },
          { date: "2024-01-06", value: 3456 },
          { date: "2024-01-07", value: 500 },
          { date: "2024-01-07", value: 734 },
          { date: "2024-01-08", value: 2345 },
          { date: "2024-01-09", value: 3456 },
          { date: "2024-01-13", value: 1234 },
          { date: "2024-01-14", value: 2345 },
          { date: "2024-01-15", value: 3456 },
          { date: "2024-01-16", value: 1234 },
          { date: "2024-01-25", value: 12345 },
          { date: "2024-01-26", value: 23 },
        ]
      }
    ]
  },
  {
    username: 'beartest2',
    password: 'beartest2',
    projects: [
      {
        title: 'Audit Test',
        type: 'pages',
        goal: 100,
        startDate: '2023-12-01',
        endDate: '2023-01-31',
        updates: [
          { date: "2023-12-19", value: 4 },
          { date: "2023-12-15", value: 2 },
          { date: "2023-12-11", value: 2 },
          { date: "2023-12-21", value: 13 },
          { date: "2023-12-22", value: 7 },
        ]
      },
      {
        title: 'Double Time',
        type: 'time',
        goal: 20,
        startDate: null,
        endDate: null,
        updates: [
          { date: "2023-12-20", value: 5 },
          { date: "2023-12-21", value: 90 },
          { date: "2023-12-22", value: 300 },
        ]
      }
    ]
  },
  // TODO: leaderboards
  // {
  //   username: 'leaderboard1',
  //   password: 'leaderboard1',
  // },
  // {
  //   username: 'leaderboard2',
  //   password: 'leaderboard2',
  // },
];

async function user2create(user) {
  const { hashedPassword, salt } = await hash(user.password);

  return {
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
  };
}

export async function main() {
  for(const seedUser of SEED_USERS) {
    const user = await db.user.upsert({
      where: { username: seedUser.username },
      update: {},
      create: await user2create(seedUser),
    });
    console.log(`${seedUser.username}: `, user);
  }
}
