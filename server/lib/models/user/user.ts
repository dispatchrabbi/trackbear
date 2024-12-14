import winston from "winston";
import { addDays, addMinutes } from "date-fns";

import dbClient from "../../db.ts";
import type { PasswordResetLink, PendingEmailVerification, User } from "@prisma/client";

import { type RequestContext } from "../../request-context.ts";
import { AUDIT_EVENT, buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { CollisionError, RecordNotFoundError, ValidationError } from "../errors.ts";

import {
  USER_STATE, type UserState,
  USERNAME_REGEX, EMAIL_REGEX,
} from "./consts.ts";
import CONFIG from "server/config.ts";

import { pushTask } from "../../queue.ts";
import sendEmailverificationEmail from "../../tasks/send-emailverification-email.ts";
import sendPwresetEmail from "../../tasks/send-pwreset-email.ts";

import { traced } from "../../tracer.ts";
import { PASSWORD_RESET_LINK_STATE } from "../password-reset-link.ts";

export type { User };
export type UserData = {
  username: string;
  displayName: string;
  email: string;
  isEmailVerified: boolean;
};

type CreatePendingEmailVerificationOptions = {
  expiresAt?: Date;
  force: boolean;
};

type CreatePasswordResetLinkOptions = {
  expiresAt?: Date;
};

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
  static async getUserByUsername(username: string): Promise<User> {
    const user = await dbClient.user.findUnique({
      where: { username: username },
    });

    return user;
  }

  @traced
  static async createUser(/*data: UserData, reqCtx: RequestContext*/) {
    // TODO: when I get around to auth endpoints
    throw new Error('not yet implemented');
  }

  /**
   * Update a user's data
   * 
   * @param id the id of the user to update
   * @param data the values to update in the user
   * @param reqCtx a request context for audit purposes
   * @returns the updated user
   * 
   * @throws ValidationError if the username is not valid
   * @throws CollitionError if the username is already taken
   */
  @traced
  static async updateUser(id: number, data: Partial<UserData>, reqCtx: RequestContext): Promise<User> {
    const original = await this.getUser(id);

    if('username' in data) {
      // normalize the username to lowercase
      data.username = data.username.toLowerCase();

      // refuse the change the username if it doesn't conform to the regex
      if(!data.username.match(USERNAME_REGEX)) {
        throw new ValidationError('user', 'username', 'username must consist only of alphanumeric characters, dashes, and underscores, and must start with a letter');
      }

      // refuse to change the username to an existing username
      const existingUserWithThisUsername = await this.getUserByUsername(data.username);
      if(existingUserWithThisUsername) {
        throw new CollisionError('user', 'username', data.username);
      }
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
    await logAuditEvent(AUDIT_EVENT.USER_UPDATE, reqCtx.userId, updated.id, null, changes, reqCtx.sessionId);

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
      [USER_STATE.ACTIVE]: AUDIT_EVENT.USER_ACTIVATE,
      [USER_STATE.SUSPENDED]: AUDIT_EVENT.USER_SUSPEND,
      [USER_STATE.DELETED]: AUDIT_EVENT.USER_DELETE,
    }[state];

    await logAuditEvent(event, reqCtx.userId, updated.id, null, null, reqCtx.sessionId);

    return updated;
  }

  @traced
  static async sendEmailVerificationLink(userId: number, options: CreatePendingEmailVerificationOptions, reqCtx: RequestContext): Promise<PendingEmailVerification> {
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
    pushTask(sendEmailverificationEmail.makeTask(pending.uuid));

    winston.debug(`EMAIL: ${reqCtx.userId} requested a verification link for ${userId} and got ${pending.uuid}`);
    await logAuditEvent(AUDIT_EVENT.USER_REQUEST_EMAIL_VERIFICATION, reqCtx.userId, userId, null, { verificationUuid: pending.uuid }, reqCtx.sessionId);

    return pending;
  }

  @traced
  static async sendPasswordResetLink(userId: number, options: CreatePasswordResetLinkOptions, reqCtx: RequestContext): Promise<PasswordResetLink> {
    options = Object.assign({
      expiresAt: addMinutes(new Date(), CONFIG.PASSWORD_RESET_LINK_TIMEOUT_IN_MINUTES),
    }, options);

    const user = await this.getUser(userId);

    const resetLink = await dbClient.passwordResetLink.create({
      data: {
        userId: user.id,
        state: PASSWORD_RESET_LINK_STATE.ACTIVE,
        expiresAt: options.expiresAt,
      },
    });
    pushTask(sendPwresetEmail.makeTask(resetLink.uuid));

    winston.debug(`EMAIL: ${reqCtx.userId} requested a reset link for ${user.id} and got ${resetLink.uuid}`);
    await logAuditEvent(AUDIT_EVENT.USER_REQUEST_PASSWORD_RESET, reqCtx.userId, user.id, null, { resetLinkUuid: resetLink.uuid }, reqCtx.sessionId);

    return resetLink;
  }
}