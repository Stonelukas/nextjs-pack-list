import { test as base } from "@playwright/test";

import {
  signedInAuth,
  type MockAuthState,
} from "../../src/test/mocks/runtime";

export interface AuthFixtureOptions {
  authState: MockAuthState;
}

export const test = base.extend<AuthFixtureOptions>({
  authState: [signedInAuth(), { option: true }],
});
