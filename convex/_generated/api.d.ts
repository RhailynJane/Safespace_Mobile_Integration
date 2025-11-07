/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as conversations from "../conversations.js";
import type * as crisis from "../crisis.js";
import type * as hello from "../hello.js";
import type * as help from "../help.js";
import type * as journal from "../journal.js";
import type * as moods from "../moods.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as presence from "../presence.js";
import type * as profiles from "../profiles.js";
import type * as resources from "../resources.js";
import type * as storage from "../storage.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  appointments: typeof appointments;
  auth: typeof auth;
  conversations: typeof conversations;
  crisis: typeof crisis;
  hello: typeof hello;
  help: typeof help;
  journal: typeof journal;
  moods: typeof moods;
  notifications: typeof notifications;
  posts: typeof posts;
  presence: typeof presence;
  profiles: typeof profiles;
  resources: typeof resources;
  storage: typeof storage;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
