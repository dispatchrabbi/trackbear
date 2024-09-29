import { USER_STATE } from "./user.ts";
import dbClient from "../db.ts";

import { pick } from "../obj.ts";

export type PublicProfile = {
  username: string;
  displayName: string;
  avatar: string;
};

export async function getUserProfile(username): Promise<PublicProfile> {
  // first, get the active user with that username along with user settings
  const user = await dbClient.user.findUnique({
    where: {
      username: username,
      state: USER_STATE.ACTIVE,
    },
    include: {
      userSettings: true,
    }
  });

  if(user === null) {
    // no active user with that username found
    return null;
  } else if(user.userSettings.enablePublicProfile !== true) {
    // the user doesn't have public profile enabled
    return null;
  }

  // currently, we're just going to return username, display name, and avatar
  return {
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
  };
}