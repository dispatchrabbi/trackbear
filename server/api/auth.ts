import { Router } from "express";

import dbClient from '../lib/db.ts';
import { hash, verifyHash } from "../lib/hash.ts";
import { logIn, logOut } from "../lib/auth.ts";

const loginRouter = Router();

loginRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // TODO: validation, etc.

  const user = await dbClient.user.findUnique({ where: { username }});
  if(!user) {
    console.debug(`${username} does not exist!`);
    return res.status(400).send({ message: 'Incorrect username or password '});
  }

  const verified = await verifyHash(user.password, password, user.salt);
  if(!verified) {
    console.debug(`${username} had the incorrect password!`);
    return res.status(400).send({ message: 'Incorrect username or password '});
  }

  logIn(req, user);
  console.debug(`Login: ${username}`);

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

loginRouter.post('/signup', async (req, res) => {
  const { username, password, email } = req.body;
  // TODO: validation, username uniqueness check, etc.

  const { hashedPassword, salt } = await hash(password);
  const userData = {
    email: email,
    username: username,
    displayName: username,
    password: hashedPassword,
    salt: salt,
    state: 'active',
  };

  try {
    const user = await dbClient.user.create({ data: userData });
    console.debug(`New sign-up: ${username}`);

    // TODO: kick off email verification/confirmation afterward
    logIn(req, user);
    res.status(201).send({ message: 'Sign-up successful' });
  } catch(err) {
    console.error(err);
    res.status(500).send({ message: 'Sign-up was unsuccessful' });
  }
});

export default loginRouter;
