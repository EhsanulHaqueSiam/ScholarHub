/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminHelpers from "../adminHelpers.js";
import type * as aggregation from "../aggregation.js";
import type * as aggregationHelpers from "../aggregationHelpers.js";
import type * as classification from "../classification.js";
import type * as collections from "../collections.js";
import type * as comparison from "../comparison.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as directory from "../directory.js";
import type * as enrichPublish from "../enrichPublish.js";
import type * as http from "../http.js";
import type * as maintenance from "../maintenance.js";
import type * as monitoring from "../monitoring.js";
import type * as prestige from "../prestige.js";
import type * as related from "../related.js";
import type * as scheduler from "../scheduler.js";
import type * as scholarshipSummary from "../scholarshipSummary.js";
import type * as scraping from "../scraping.js";
import type * as seed from "../seed.js";
import type * as seed_collections from "../seed_collections.js";
import type * as seo from "../seo.js";
import type * as shortlist from "../shortlist.js";
import type * as sources from "../sources.js";
import type * as tagging from "../tagging.js";
import type * as tags from "../tags.js";
import type * as triggers from "../triggers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminHelpers: typeof adminHelpers;
  aggregation: typeof aggregation;
  aggregationHelpers: typeof aggregationHelpers;
  classification: typeof classification;
  collections: typeof collections;
  comparison: typeof comparison;
  crons: typeof crons;
  dashboard: typeof dashboard;
  directory: typeof directory;
  enrichPublish: typeof enrichPublish;
  http: typeof http;
  maintenance: typeof maintenance;
  monitoring: typeof monitoring;
  prestige: typeof prestige;
  related: typeof related;
  scheduler: typeof scheduler;
  scholarshipSummary: typeof scholarshipSummary;
  scraping: typeof scraping;
  seed: typeof seed;
  seed_collections: typeof seed_collections;
  seo: typeof seo;
  shortlist: typeof shortlist;
  sources: typeof sources;
  tagging: typeof tagging;
  tags: typeof tags;
  triggers: typeof triggers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
