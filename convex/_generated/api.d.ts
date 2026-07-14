/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as lib_deletion from "../lib/deletion.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_import_limits from "../lib/import_limits.js";
import type * as lib_legacy_import from "../lib/legacy_import.js";
import type * as lib_official_templates from "../lib/official_templates.js";
import type * as lib_preferences from "../lib/preferences.js";
import type * as lib_template_stats from "../lib/template_stats.js";
import type * as lib_validation from "../lib/validation.js";
import type * as lists from "../lists.js";
import type * as migrations from "../migrations.js";
import type * as moderation from "../moderation.js";
import type * as settings from "../settings.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/authorization": typeof lib_authorization;
  "lib/deletion": typeof lib_deletion;
  "lib/errors": typeof lib_errors;
  "lib/import_limits": typeof lib_import_limits;
  "lib/legacy_import": typeof lib_legacy_import;
  "lib/official_templates": typeof lib_official_templates;
  "lib/preferences": typeof lib_preferences;
  "lib/template_stats": typeof lib_template_stats;
  "lib/validation": typeof lib_validation;
  lists: typeof lists;
  migrations: typeof migrations;
  moderation: typeof moderation;
  settings: typeof settings;
  templates: typeof templates;
  users: typeof users;
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
