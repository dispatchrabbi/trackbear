import { PrismaClient } from "@prisma/client";

const dbClient = new PrismaClient();

export default dbClient;

export async function testDatabaseConnection() {
  await dbClient.$queryRaw`SELECT 1 + 1 AS two;`;
}