import test from "node:test";
import assert from "node:assert/strict";
import { loginBody } from "../src/creator_login.js";

test("login boundary accepts six digits and rejects malformed codes", () => {
  assert.equal(loginBody.safeParse({ phone: "+15551234567", code: "123456", subscriberId: "sub_1" }).success, true);
  assert.equal(loginBody.safeParse({ phone: "+15551234567", code: "12345", subscriberId: "sub_1" }).success, false);
});
