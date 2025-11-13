/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as appointments from "../appointments.js";
import type * as assessments from "../assessments.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as conversations from "../conversations.js";
import type * as crisis from "../crisis.js";
import type * as hello from "../hello.js";
import type * as help from "../help.js";
import type * as journal from "../journal.js";
import type * as migrations_syncSettingsToTable from "../migrations/syncSettingsToTable.js";
import type * as moods from "../moods.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as presence from "../presence.js";
import type * as profiles from "../profiles.js";
import type * as resources from "../resources.js";
import type * as settings from "../settings.js";
import type * as storage from "../storage.js";
import type * as supportWorkers from "../supportWorkers.js";
import type * as videoCallSessions from "../videoCallSessions.js";

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
  activities: typeof activities;
  appointments: typeof appointments;
  assessments: typeof assessments;
  auth: typeof auth;
  categories: typeof categories;
  conversations: typeof conversations;
  crisis: typeof crisis;
  hello: typeof hello;
  help: typeof help;
  journal: typeof journal;
  "migrations/syncSettingsToTable": typeof migrations_syncSettingsToTable;
  moods: typeof moods;
  notifications: typeof notifications;
  posts: typeof posts;
  presence: typeof presence;
  profiles: typeof profiles;
  resources: typeof resources;
  settings: typeof settings;
  storage: typeof storage;
  supportWorkers: typeof supportWorkers;
  videoCallSessions: typeof videoCallSessions;
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
