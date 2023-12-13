import { Router } from "express";

import dbClient from '../lib/db.ts';
import { hash, verifyHash } from "../lib/hash.ts";
import { logIn, logOut } from "../lib/auth.ts";
import { USER_STATE } from "../lib/states.ts";
import { User } from "@prisma/client";

const loginRouter = Router();

loginRouter.post('/login', async (req, res, next) => {
  const { username, password } = req.body;
  // TODO: validation, etc.

  let user: User | null;
  try {
    user = await dbClient.user.findUnique({ where: { username }});
  } catch(err) { return next(err); }

  if(!user) {
    console.debug(`LOGIN: ${username} does not exist`);
    return res.status(400).send({ message: 'Incorrect username or password'});
  }

  if(user.state !== USER_STATE.ACTIVE) {
    console.debug(`LOGIN: ${username} attempted to log in but account state is ${user.state}`);
    return res.status(400).send({ message: 'Incorrect username or password'});
  }

  let verified: boolean;
  try {
    verified = await verifyHash(user.password, password, user.salt);
  } catch(err) { return next(err); }

  if(!verified) {
    console.debug(`LOGIN: ${username} had the incorrect password`);
    return res.status(400).send({ message: 'Incorrect username or password'});
  }

  logIn(req, user);
  console.debug(`LOGIN: ${username} successfully logged in`);

  const userResponse = {
    uuid: user.uuid,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
  };
  return res.status(200).send({
    message: 'Logged in',
    user: userResponse,
  });
});

loginRouter.post('/logout', (req, res) => {
  logOut(req);
  res.status(200).send({ message: 'Logged out' });
})

loginRouter.post('/signup', async (req, res, next) => {
  const { username, password, email } = req.body;
  // TODO: validation, username uniqueness check, etc.

  let hashedPassword: string, salt: string;
  try {
    ({ hashedPassword, salt } = await hash(password));
  } catch(err) { return next(err); }

  const userData = {
    email: email,
    username: username,
    displayName: username,
    password: hashedPassword,
    salt: salt,
    state: USER_STATE.ACTIVE,
  };

  try {
    const user = await dbClient.user.create({ data: userData });
    console.debug(`SIGNUP: ${username} just signed up`);

    // TODO: kick off email verification/confirmation afterward
    logIn(req, user);
    console.debug(`SIGNUP: ${username} successfully logged in`);
    res.status(201).send({ message: 'Sign-up successful' });
  } catch(err) {
    console.error(err);
    res.status(500).send({ message: 'Sign-up was unsuccessful' });
  }
});

export default loginRouter;
