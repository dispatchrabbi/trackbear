import type { Express } from "express";
import { PrismaClient } from "@prisma/client";

function attach(app: Express): void {
  const prisma = new PrismaClient();
  app.set('db', prisma);
}

export default {
  attach,
};
