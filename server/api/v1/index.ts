import { Router } from "express";
const v1Router = Router();

import boardRouter from "./board.ts";
v1Router.use('/board', boardRouter);

import goalRouter from './goal.ts';
v1Router.use('/goal', goalRouter);

import meRouter from './me.ts';
v1Router.use('/me', meRouter);

import pingRouter from './ping.ts';
v1Router.use('/ping', pingRouter);

import profileRouter from './profile.ts';
v1Router.use('/profile', profileRouter);

import statsRouter from './stats.ts';
v1Router.use('/stats', statsRouter);

import tagRouter from './tag.ts';
v1Router.use('/tag', tagRouter);

import tallyRouter from './tally.ts';
v1Router.use('/tally', tallyRouter);

import workRouter from './work.ts';
v1Router.use('/work', workRouter);

export default v1Router;
