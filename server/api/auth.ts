import { Router } from "express";
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import dbClient from '../lib/db.ts';
import { hash, verifyHash } from "../lib/hash.ts";

// configure passport on how to verify a username and password for login
passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const user = await dbClient.user.findUnique({ where: { username }});
  if(!user) {
    console.debug(`${username} does not exist!`);
    return cb(null, false, { message: 'Incorrect username or password '});
  }

  const verified = await verifyHash(user.password, password, user.salt);
  if(!verified) {
    console.debug(`${username} had the incorrect password!`);
    return cb(null, false, { message: 'Incorrect username or password '});
  }

  console.debug(`${username} has just logged in!`);
  return cb(null, user);
}));

// this extends the Express.User type so it has an `id` property
// declare global {
//   /* eslint-disable-next-line @typescript-eslint/no-namespace */
//   namespace Express {
//     interface User {
//       id: number
//     }
//   }
// }

// configure passport session integration
passport.serializeUser<number>(function(u, cb) {
  process.nextTick(function() {
    const user = u as { id: number };
    cb(null, user.id);
  });
});

passport.deserializeUser(function(id: number, cb) {
  process.nextTick(async function() {
    const user = await dbClient.user.findUnique({ where: { id } });
    cb(null, user); // it's okay to pass a null user
  });
})

const loginRouter = Router();

loginRouter.post('/login', passport.authenticate('local', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/login',
  failureMessage: true,
}));

loginRouter.post('/logout', (req, res, next) => {
  req.logOut(function(err) {
    if(err) { return next(err); }
    res.redirect('/');
  });
})

loginRouter.post('/signup', async (req, res, next) => {
  const { username, password, email } = req.body;
  // TODO: validation, username uniqueness check, etc.

  const { hashedPassword, salt } = await hash(password);

  const user = await dbClient.user.create({
    data: {
      email: email,
      username: username,
      displayName: username,
      password: hashedPassword,
      salt: salt,
      state: 'active',
    },
  });

  // TODO: kick off email verification/confirmation afterward
  req.logIn({ id: user.id }, function(err) {
    if(err) { return next(err); }
    console.debug(`${username} has just signed up!`);
    res.redirect('/');
  });
});

export default loginRouter;
