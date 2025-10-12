import { addDays, addMinutes, type Day } from 'date-fns';

import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

import { getDbClient } from 'server/lib/db.ts';
import type { PasswordResetLink, PendingEmailVerification, User, UserAuth, UserSettings as PrismaUserSettings, Prisma } from 'generated/prisma/client';
import { hash, verifyHash } from '../../hash.ts';

import { type RequestContext } from '../../request-context.ts';
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE, AUDIT_EVENT_SOURCE } from '../audit-event/consts.ts';
import { ValidationError } from '../errors.ts';

import {
  USER_STATE, type UserState,
  PASSWORD_RESET_LINK_STATE,
  USERNAME_REGEX, EMAIL_REGEX,
} from './consts.ts';
import CONFIG from 'server/config.ts';

import { pushTask } from '../../queue.ts';
import sendSignupEmail from 'server/lib/tasks/send-signup-email.ts';
import sendEmailVerificationEmail from '../../tasks/send-emailverification-email.ts';
import sendPasswordResetEmail from '../../tasks/send-pwreset-email.ts';
import sendPasswordChangeEmail from '../../tasks/send-pwchange-email.ts';

import { traced } from '../../metrics/tracer.ts';

export type { User };
export type UserSettings = Omit<PrismaUserSettings, 'lifetimeStartingBalance' | 'weekStartDay'> & {
  lifetimeStartingBalance: Record<string, number>;
  weekStartDay: Day;
};
export type FullUser = User & {
  userSettings: UserSettings;
};

export type SignUpUserData = {
  username: string;
  password: string;
  email: string;
};
export type CreateUserData = {
  username: string;
  password: string;
  email: string;
  displayName?: string;
  isEmailVerified?: boolean;
};
export type UpdateUserData = Partial<{
  username: string;
  email: string;
  displayName: string;
}>;

type GetUserOptions = Partial<{
  state: UserState;
}>;

type SendSignupEmailOptions = Partial<{
  force: boolean;
}>;

type SendEmailVerificationLinkOptions = Partial<{
  expiresAt: Date;
  force: boolean;
}>;

type SendPasswordResetLinkOptions = Partial<{
  expiresAt: Date;
}>;

export class UserModel {
  @traced
  static async getUsers(skip: number = 0, take: number = Infinity, search: string | null = null): Promise<User[]> {
    const db = getDbClient();
    const users = await db.user.findMany({
      where: this.buildSearchWhereClauses(search),
      orderBy: { createdAt: 'desc' },
      skip,
      take: take < Infinity ? take : undefined,
    });

    return users;
  }

  @traced
  static async getTotalUserCount(search: string | null = null): Promise<number> {
    const db = getDbClient();
    const total = await db.user.count({
      where: this.buildSearchWhereClauses(search),
    });

    return total;
  }

  private static buildSearchWhereClauses(search: string | null = null) {
    if(search === null) {
      return undefined;
    }

    let searchWhereClauses: Prisma.UserWhereInput[] = [];
    if(search) {
      const isSearchNumeric = !isNaN(+search);

      searchWhereClauses = [
        { id: { equals: isSearchNumeric ? +search : -1 } },
        { uuid: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return {
      OR: searchWhereClauses,
    };
  }

  @traced
  static async getUser(id: number, options: GetUserOptions = {}): Promise<User | null> {
    const db = getDbClient();
    const user = await db.user.findUnique({
      where: {
        id,
        state: options.state ?? undefined,
      },
    });

    return user;
  }

  @traced
  static async getUserByUsername(username: string): Promise<User | null> {
    const db = getDbClient();
    const user = await db.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    return user;
  }

  @traced
  static async getUserByApiToken(apiToken: string): Promise<User | null> {
    const db = getDbClient();
    const now = new Date();
    const key = await db.apiKey.findUnique({
      where: {
        token: apiToken,
        owner: {
          state: USER_STATE.ACTIVE,
        },
        OR: [
          { expiresAt: { gte: now } },
          { expiresAt: null },
        ],
      },
      include: {
        owner: {},
      },
    });

    return key ? key.owner : null;
  }

  @traced
  static async validateUsername(username: string): Promise<string> {
    username = username.toLowerCase();
    if(!username.match(USERNAME_REGEX)) {
      throw new ValidationError('user', 'username', 'Usernames must be alphanumeric, start with a letter, and be 3-24 characters long.');
    } else if(await this.getUserByUsername(username)) {
      throw new ValidationError('user', 'username', 'A user with that username already exists.');
    }

    return username;
  }

  @traced
  static async getUserAuth(user: User): Promise<UserAuth | null> {
    const db = getDbClient();
    const userAuth = await db.userAuth.findUnique({
      where: { userId: user.id },
    });

    return userAuth;
  }

  @traced
  static async signUpUser(data: SignUpUserData, reqCtx: RequestContext) {
    data.username = await this.validateUsername(data.username);

    const created = await this.createUser({
      username: data.username,
      password: data.password,
      email: data.email,
      displayName: data.username,
      isEmailVerified: false,
    }, reqCtx);

    await logAuditEvent(AUDIT_EVENT_TYPE.USER_SIGNUP, created.id, created.id, null, null, reqCtx.sessionId);
    logger.debug(`SIGNUP: ${created.id} just signed up`);

    reqCtx = {
      ...reqCtx,
      userId: created.id,
    };
    await this.sendSignupEmail(created, { force: true }, reqCtx);
    await this.sendEmailVerificationLink(created, { force: true }, reqCtx);

    return created;
  }

  @traced
  static async createUser(data: CreateUserData, reqCtx: RequestContext) {
    // first, validate the username
    const username = await this.validateUsername(data.username);

    const userData = {
      state: USER_STATE.ACTIVE,
      username: username,
      displayName: data.displayName || data.username,
      email: data.email,
      isEmailVerified: data.isEmailVerified ?? false,
    };

    const userSettingsData = {
      lifetimeStartingBalance: {},
    };

    const { hashedPassword, salt } = await hash(data.password);
    const userAuthData = {
      password: hashedPassword,
      salt: salt,
    };

    const db = getDbClient();
    const created = await db.user.create({
      data: {
        ...userData,
        userSettings: { create: userSettingsData },
        userAuth: { create: userAuthData },
      },
    });

    await logAuditEvent(AUDIT_EVENT_TYPE.USER_CREATE, created.id, created.id, null, null, reqCtx.sessionId);

    return created;
  }

  @traced
  static async updateUser(user: User, data: UpdateUserData, reqCtx: RequestContext): Promise<User> {
    const original = user;

    if('username' in data) {
      data.username = await this.validateUsername(data.username!);
    }

    if('email' in data) {
      // refuse the change the email if it doesn't conform to the regex
      if(!data.email!.match(EMAIL_REGEX)) {
        throw new ValidationError('user', 'email', 'email must be a valid email address');
      }
    }

    const db = getDbClient();
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...data,
      },
    });

    const changes = buildChangeRecord(original, updated);
    await logAuditEvent(AUDIT_EVENT_TYPE.USER_UPDATE, reqCtx.userId, updated.id, null, changes, reqCtx.sessionId);

    return updated;
  }

  @traced
  static async setUserState(user: User, state: UserState, reqCtx: RequestContext): Promise<User> {
    const original = user;

    const db = getDbClient();
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        state,
      },
    });

    const event = {
      [USER_STATE.ACTIVE]: AUDIT_EVENT_TYPE.USER_ACTIVATE,
      [USER_STATE.SUSPENDED]: AUDIT_EVENT_TYPE.USER_SUSPEND,
      [USER_STATE.DELETED]: AUDIT_EVENT_TYPE.USER_DELETE,
    }[state];

    const changes = buildChangeRecord(original, updated);
    await logAuditEvent(event, reqCtx.userId, updated.id, null, changes, reqCtx.sessionId);

    return updated;
  }

  /**
   * Marks a user's email address as verified via verification link.
   *
   * @param verificationUuid The UUID contained in the email verification link
   * @param reqCtx The request context
   * @returns Whether the verification succeeded
   */
  @traced
  static async verifyEmail(verificationUuid: string, reqCtx: RequestContext): Promise<boolean> {
    const db = getDbClient();
    const verification = await db.pendingEmailVerification.findUnique({
      where: {
        uuid: verificationUuid,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    // we didn't find a verification
    if(!verification) {
      return false;
    }

    // the verification isn't for the current email
    const isVerificationValid = verification.newEmail === verification.user.email;
    if(!isVerificationValid) {
      return false;
    }

    // mark the user as verified and delete all existing pending email verifications
    await db.user.update({
      data: {
        isEmailVerified: true,
        pendingEmailVerifications: { deleteMany: [] },
      },
      where: {
        id: verification.user.id,
      },
    });

    logger.debug(`VERIFY: ${verification.user.id} just verified their email`);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.USER_VERIFY_EMAIL,
      reqCtx.userId, verification.user.id, null,
      { method: AUDIT_EVENT_SOURCE.LINK, verificationUuid: verification.uuid, email: verification.newEmail },
      reqCtx.sessionId,
    );

    return true;
  }

  /**
   * Marks a user's email address as verified by fiat (e.g., via the admin console or script)
   *
   * @param verificationUuid The UUID contained in the email verification link
   * @param reqCtx The request context
   * @returns Whether the verification succeeded
   */
  @traced
  static async verifyEmailByFiat(user: User, source: typeof AUDIT_EVENT_SOURCE.SCRIPT, reqCtx: RequestContext): Promise<boolean> {
    // mark the user as verified and delete all existing pending email verifications
    const db = getDbClient();
    await db.user.update({
      data: {
        isEmailVerified: true,
        pendingEmailVerifications: { deleteMany: [] },
      },
      where: {
        id: user.id,
      },
    });

    logger.debug(`VERIFY: ${user.id} just had their email verified via ${source}`);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.USER_VERIFY_EMAIL,
      reqCtx.userId, user.id, null,
      { method: source, email: user.email },
      reqCtx.sessionId,
    );

    return true;
  }

  /**
   * Resets a user's password as set via password reset link.
   *
   * @param passwordResetUuid The UUID contained in the password reset link
   * @param newPassword The user's new password
   * @param reqCtx The request context
   * @returns Whether the reset succeeded
   */
  @traced
  static async resetPassword(passwordResetUuid: string, newPassword: string, reqCtx: RequestContext): Promise<boolean> {
    // first make sure the link is valid
    const db = getDbClient();
    const resetLink = await db.passwordResetLink.findUnique({
      where: {
        uuid: passwordResetUuid,
        expiresAt: { gt: new Date() },
        state: PASSWORD_RESET_LINK_STATE.ACTIVE,
      },
      include: {
        user: true,
      },
    });

    if(!resetLink) {
      return false;
    }

    // then change the password
    await this.setPassword(resetLink.user, newPassword, reqCtx);

    // lastly, mark this link as used
    await db.passwordResetLink.update({
      data: {
        state: PASSWORD_RESET_LINK_STATE.USED,
      },
      where: {
        uuid: resetLink.uuid,
      },
    });

    logger.debug(`PASSWORD: ${resetLink.userId} has reset their password using link ${resetLink.uuid}`);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.USER_PASSWORD_RESET,
      resetLink.user.id, resetLink.user.id, null,
      { method: 'link', resetLinkUuid: resetLink.uuid },
      reqCtx.sessionId,
    );

    await this.sendPasswordChangedEmail(resetLink.user, reqCtx);

    return true;
  }

  @traced
  static async checkPassword(user: User, password: string): Promise<boolean> {
    const userAuth = await this.getUserAuth(user);
    if(!userAuth) {
      return false;
    }

    const matches = await verifyHash(password, userAuth.password, userAuth.salt);
    return matches;
  }

  @traced
  static async setPassword(user: User, newPassword: string, reqCtx: RequestContext): Promise<void> {
    const { hashedPassword, salt } = await hash(newPassword);

    const db = getDbClient();
    await db.userAuth.update({
      data: {
        password: hashedPassword,
        salt: salt,
      },
      where: { userId: user.id },
    });

    logger.debug(`PASSWORD: ${user.id} has changed their password`);
    await logAuditEvent(AUDIT_EVENT_TYPE.USER_PASSWORD_CHANGE, reqCtx.userId, user.id, null, null, reqCtx.sessionId);
  }

  @traced
  static async sendSignupEmail(user: User, options: SendSignupEmailOptions, reqCtx: RequestContext): Promise<boolean> {
    options = Object.assign({
      force: false,
    }, options);

    if(user.state !== USER_STATE.ACTIVE && !options.force) {
      return false;
    }

    pushTask(sendSignupEmail.makeTask(user.id));
    logger.debug(`EMAIL: ${reqCtx.userId} queued a task to send a sign-up email for ${user.id}`);

    return true;
  }

  @traced
  static async sendPasswordChangedEmail(user: User, reqCtx: RequestContext): Promise<boolean> {
    pushTask(sendPasswordChangeEmail.makeTask(user.id));
    logger.debug(`EMAIL: ${reqCtx.userId} queued a task to send a password change email for ${user.id}`);

    return true;
  }

  @traced
  static async sendEmailVerificationLink(user: User, options: SendEmailVerificationLinkOptions, reqCtx: RequestContext): Promise<PendingEmailVerification | null> {
    options = Object.assign({
      expiresAt: addDays(new Date(), CONFIG.EMAIL_VERIFICATION_TIMEOUT_IN_DAYS),
      force: false,
    }, options);

    if(user.isEmailVerified && !options.force) {
      return null;
    }

    const db = getDbClient();
    const pending = await db.pendingEmailVerification.create({
      data: {
        userId: user.id,
        newEmail: user.email,
        expiresAt: options.expiresAt!,
      },
    });
    pushTask(sendEmailVerificationEmail.makeTask(pending.uuid));

    logger.debug(`EMAIL: ${reqCtx.userId} requested a verification link for ${user.id} and got ${pending.uuid}`);
    await logAuditEvent(AUDIT_EVENT_TYPE.USER_REQUEST_EMAIL_VERIFICATION, reqCtx.userId, user.id, null, { verificationUuid: pending.uuid }, reqCtx.sessionId);

    return pending;
  }

  @traced
  static async sendPasswordResetLink(user: User, options: SendPasswordResetLinkOptions, reqCtx: RequestContext): Promise<PasswordResetLink | null> {
    options = Object.assign({
      expiresAt: addMinutes(new Date(), CONFIG.PASSWORD_RESET_LINK_TIMEOUT_IN_MINUTES),
    }, options);

    if(user.state !== USER_STATE.ACTIVE) {
      return null;
    }

    const db = getDbClient();
    const resetLink = await db.passwordResetLink.create({
      data: {
        userId: user.id,
        state: PASSWORD_RESET_LINK_STATE.ACTIVE,
        expiresAt: options.expiresAt!,
      },
    });
    pushTask(sendPasswordResetEmail.makeTask(resetLink.uuid));

    logger.debug(`EMAIL: A reset link was requested for ${user.id} and got ${resetLink.uuid}`);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.USER_REQUEST_PASSWORD_RESET,
      reqCtx.userId, user.id, null,
      { resetLinkUuid: resetLink.uuid },
      reqCtx.sessionId,
    );

    return resetLink;
  }
}
