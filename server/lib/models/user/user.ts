import winston from "winston";
import { addDays, addMinutes } from "date-fns";

import dbClient from "../../db.ts";
import type { PasswordResetLink, PendingEmailVerification, User, UserAuth } from "@prisma/client";
import { hash, verifyHash } from "../../../lib/hash.ts";

import { type RequestContext } from "../../request-context.ts";
import { buildChangeRecord, logAuditEvent, UNKNOWN_ACTOR_ID } from '../../../lib/audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../../../lib/models/audit-events.ts';
import { PASSWORD_RESET_LINK_STATE } from "../password-reset-link.ts";
import { CollisionError, RecordNotFoundError, ValidationError } from "../errors.ts";

import {
  USER_STATE, type UserState,
  USERNAME_REGEX, EMAIL_REGEX,
} from "./consts.ts";
import CONFIG from "server/config.ts";

import { pushTask } from "../../queue.ts";
import sendSignupEmail from "server/lib/tasks/send-signup-email.ts";
import sendEmailVerificationEmail from "../../tasks/send-emailverification-email.ts";
import sendPasswordResetEmail from "../../tasks/send-pwreset-email.ts";
import sendPasswordChangeEmail from '../../tasks/send-pwchange-email.ts'

import { traced } from "../../tracer.ts";

export type { User };
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
  static async getUsers(): Promise<User[]> {
    const users = await dbClient.user.findMany({
      orderBy: { username: 'asc' },
    });

    return users;
  }

  @traced
  static async getUser(id: number): Promise<User> {
    const user = await dbClient.user.findUnique({
      where: { id }
    });

    if(!user) {
      throw new RecordNotFoundError('user', id);
    }

    return user;
  }

  @traced
  static async getUserAuth(userId: number): Promise<UserAuth> {
    const userAuth = await dbClient.userAuth.findUnique({
      where: { userId },
    });
    if(!userAuth) {
      throw new RecordNotFoundError('userAuth', userId);
    }


    return userAuth;
  }

  @traced
  static async getUserByUsername(username: string): Promise<User> {
    const user = await dbClient.user.findUnique({
      where: { username: username },
    });

    if(!user) {
      throw new RecordNotFoundError('user', username, 'username');
    }

    return user;
  }

  /**
   * Validates a potential username by checking if it exists and
   * conforms to username requirements.
   * 
   * @param username the username to validate
   * @returns the validated username (which may have changed)
   * 
   * @throws ValidationError if the username is not valid
   * @throws CollisionError if the username is already taken
   */
  @traced
  static async validateUsername(username: string): Promise<string> {
    // normalize the username to lowercase
    username = username.toLowerCase();

    // refuse the change the username if it doesn't conform to the regex
    if(!username.match(USERNAME_REGEX)) {
      throw new ValidationError('user', 'username', 'username must consist only of alphanumeric characters, dashes, and underscores, and must start with a letter');
    }

    // refuse to change the username to an existing username
    let user;
    try {
      user = await this.getUserByUsername(username);
    } catch(err) {
      if(!(err instanceof RecordNotFoundError)) {
        throw err;
      } // else let's keep going
    }

    // the username already exists
    if(user) {
      throw new CollisionError('user', 'username', username);
    }
    
    return username;
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
    winston.debug(`SIGNUP: ${created.id} just signed up`);

    reqCtx = {
      ...reqCtx,
      userId: created.id,
    };
    await this.sendSignupEmail(created.id, { force: true }, reqCtx);
    await this.sendEmailVerificationLink(created.id, { force: true }, reqCtx);

    return created;
  }

  @traced
  static async createUser(data: CreateUserData, reqCtx: RequestContext) {
    const userData = {
      state: USER_STATE.ACTIVE,
      username: data.username,
      displayName: data.displayName ?? data.username,
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

    const created = await dbClient.user.create({
      data: {
        ...userData,
        userSettings: { create: userSettingsData },
        userAuth: { create: userAuthData },
      },
    });

    await logAuditEvent(AUDIT_EVENT_TYPE.USER_SIGNUP, created.id, created.id, null, null, reqCtx.sessionId);

    return created;
  }

  @traced
  static async updateUser(id: number, data: UpdateUserData, reqCtx: RequestContext): Promise<User> {
    const original = await this.getUser(id);

    if('username' in data) {
      data.username = await this.validateUsername(data.username);
    }

    if('email' in data) {
      // refuse the change the email if it doesn't conform to the regex
      if(!data.email.match(EMAIL_REGEX)) {
        throw new ValidationError('user', 'email', 'email must be a valid email address');
      }
    }

    const updated = await dbClient.user.update({
      where: { id },
      data: {
        ...data
      },
    });

    const changes = buildChangeRecord(original, updated);
    await logAuditEvent(AUDIT_EVENT_TYPE.USER_UPDATE, reqCtx.userId, updated.id, null, changes, reqCtx.sessionId);

    return updated;
  }

  @traced
  static async updateUserState(id: number, state: UserState, reqCtx: RequestContext): Promise<User> {
    const updated = await dbClient.user.update({
      where: { id },
      data: {
        state
      },
    });

    const event = {
      [USER_STATE.ACTIVE]: AUDIT_EVENT_TYPE.USER_ACTIVATE,
      [USER_STATE.SUSPENDED]: AUDIT_EVENT_TYPE.USER_SUSPEND,
      [USER_STATE.DELETED]: AUDIT_EVENT_TYPE.USER_DELETE,
    }[state];

    await logAuditEvent(event, reqCtx.userId, updated.id, null, null, reqCtx.sessionId);

    return updated;
  }

  @traced
  static async verifyUserEmail(verificationUuid: string, reqCtx: RequestContext) {
    const verification = await dbClient.pendingEmailVerification.findUnique({
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
    await dbClient.user.update({
      data: {
        isEmailVerified: true,
        pendingEmailVerifications: { deleteMany: [] },
      },
      where: {
        id: verification.user.id,
      }
    });

    winston.debug(`VERIFY: ${verification.user.id} just verified their email`);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.USER_VERIFY_EMAIL,
      reqCtx.userId, verification.user.id, null,
      { verificationUuid: verification.uuid, email: verification.newEmail },
      reqCtx.sessionId
    );

    return true;
  }

  @traced
  static async resetPassword(passwordResetUuid: string, newPassword: string, reqCtx: RequestContext) {
    // first make sure the link is valid
    const resetLink = await dbClient.passwordResetLink.findUnique({
      where: {
        uuid: passwordResetUuid,
        expiresAt: { gt: new Date() },
        state: PASSWORD_RESET_LINK_STATE.ACTIVE,
      },
    });

    if(!resetLink) {
      throw new RecordNotFoundError('passwordResetLink', passwordResetUuid, 'uuid');
    }

    // then change the password
    await this.setUserPassword(resetLink.userId, newPassword, reqCtx);

    // lastly, mark this link as used
    await dbClient.passwordResetLink.update({
      data: {
        state: PASSWORD_RESET_LINK_STATE.USED,
      },
      where: {
        uuid: resetLink.uuid
      },
    });

    winston.debug(`PASSWORD: ${resetLink.userId} has reset their password using link ${resetLink.uuid}`);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.USER_PASSWORD_RESET,
      resetLink.userId, resetLink.userId, null,
      { resetLinkUuid: resetLink.uuid },
      reqCtx.sessionId
    );

    await this.sendPasswordChangedEmail(resetLink.userId, reqCtx);
  }

  @traced
  static async checkUserPassword(userId: number, password: string) {
    const userAuth = await this.getUserAuth(userId);
    
    const matches = await verifyHash(userAuth.password, password, userAuth.salt);
    return matches;
  }

  @traced
  static async setUserPassword(userId: number, newPassword: string, reqCtx: RequestContext) {
    const { hashedPassword, salt } = await hash(newPassword);
    await dbClient.userAuth.update({
      data: {
        password: hashedPassword,
        salt: salt,
      },
      where: { userId }
    });

    winston.debug(`PASSWORD: ${userId} has changed their password`);
    await logAuditEvent(AUDIT_EVENT_TYPE.USER_PASSWORD_CHANGE, reqCtx.userId, userId, null, null, reqCtx.sessionId);

    await this.sendPasswordChangedEmail(userId, reqCtx);
  }

  @traced
  static async sendSignupEmail(userId: number, options: SendSignupEmailOptions, reqCtx: RequestContext): Promise<boolean> {
    options = Object.assign({
      force: false,
    }, options);

    const user = await this.getUser(userId);
    if(user.state !== USER_STATE.ACTIVE && !options.force) {
      return false;
    }

    pushTask(sendSignupEmail.makeTask(user.id));
    winston.debug(`EMAIL: ${reqCtx.userId} queued a task to send a sign-up email for ${user.id}`);

    return true;
  }
  
  @traced
  static async sendPasswordChangedEmail(userId: number, reqCtx: RequestContext): Promise<boolean> {
    pushTask(sendPasswordChangeEmail.makeTask(userId));
    winston.debug(`EMAIL: ${reqCtx.userId} queued a task to send a password change email for ${userId}`);

    return true;
  }

  @traced
  static async sendEmailVerificationLink(userId: number, options: SendEmailVerificationLinkOptions, reqCtx: RequestContext): Promise<PendingEmailVerification> {
    options = Object.assign({
      expiresAt: addDays(new Date(), CONFIG.EMAIL_VERIFICATION_TIMEOUT_IN_DAYS),
      force: false,
    }, options);
    
    const user = await this.getUser(userId);

    if(user.isEmailVerified && !options.force) {
      return null;
    }

    const pending = await dbClient.pendingEmailVerification.create({
      data: {
        userId: user.id,
        newEmail: user.email,
        expiresAt: options.expiresAt,
      },
    });
    pushTask(sendEmailVerificationEmail.makeTask(pending.uuid));

    winston.debug(`EMAIL: ${reqCtx.userId} requested a verification link for ${userId} and got ${pending.uuid}`);
    await logAuditEvent(AUDIT_EVENT_TYPE.USER_REQUEST_EMAIL_VERIFICATION, reqCtx.userId, userId, null, { verificationUuid: pending.uuid }, reqCtx.sessionId);

    return pending;
  }

  @traced
  static async sendPasswordResetLink(username: string, options: SendPasswordResetLinkOptions, reqCtx: RequestContext): Promise<PasswordResetLink> {
    options = Object.assign({
      expiresAt: addMinutes(new Date(), CONFIG.PASSWORD_RESET_LINK_TIMEOUT_IN_MINUTES),
    }, options);

    let user;
    try {
      user = await this.getUserByUsername(username);
    } catch(err) {
      if(err instanceof RecordNotFoundError) {
        winston.warn(`PWRESET: Attempted reset for nonexistent username ${username}`);
        return null;
      } else {
        throw err;
      }
    }

    const resetLink = await dbClient.passwordResetLink.create({
      data: {
        userId: user.id,
        state: PASSWORD_RESET_LINK_STATE.ACTIVE,
        expiresAt: options.expiresAt,
      },
    });
    pushTask(sendPasswordResetEmail.makeTask(resetLink.uuid));

    winston.debug(`EMAIL: A reset link was requested for ${user.id} and got ${resetLink.uuid}`);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.USER_REQUEST_PASSWORD_RESET,
      UNKNOWN_ACTOR_ID, user.id, null,
      { resetLinkUuid: resetLink.uuid },
      reqCtx.sessionId
    );

    return resetLink;
  }
}