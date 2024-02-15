import { Router } from "express";
const v1Router = Router();

import pingRouter from './ping.ts';
v1Router.use('/ping', pingRouter);

import tagRouter from './tag.ts';
v1Router.use('/tag', tagRouter);

import tallyRouter from './tally.ts';
v1Router.use('/tally', tallyRouter);

import workRouter from './work.ts';
v1Router.use('/work', workRouter);

export default v1Router;
