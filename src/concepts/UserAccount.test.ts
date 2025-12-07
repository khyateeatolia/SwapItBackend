import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { UserAccount } from "./UserAccount.ts";

const userAccount = new UserAccount();

// Operational Principle: A user can request verification, confirm it, and then be looked up
Deno.test("UserAccount - Operational Principle: Complete verification flow", async () => {
  const email = `test${Date.now()}@example.com`;

  // Step 1: Request verification
  const { token } = await userAccount.requestVerification({ email });
  assertExists(token);
  console.log("✓ Verification token generated");

  // Step 2: Confirm verification with password
  const username = `user${Date.now()}`;
  const password = "TestPassword123";
  const { userId } = await userAccount.confirmVerification({ token, username, password });
  assertExists(userId);
  console.log("✓ User created with userId:", userId);

  // Step 3: Lookup user
  const profile = await userAccount.lookupUser({ userId });
  assertEquals(profile.email, email);
  assertEquals(profile.username, username);
  console.log("✓ User profile retrieved successfully");

  console.log(" Operational principle test PASSED");
});

// Variant 1: Email format validation
Deno.test("UserAccount - Variant 1: Invalid email format rejected", async () => {
  await assertRejects(
    async () => {
      await userAccount.requestVerification({ email: "invalid-email" });
    },
    Error,
    "Invalid email format"
  );
  console.log(" Variant 1 PASSED: Invalid email rejected");
});

// Variant 2: Username uniqueness
Deno.test("UserAccount - Variant 2: Duplicate username rejected", async () => {
  const email1 = `test${Date.now()}@example.com`;
  const email2 = `test${Date.now() + 1}@example.com`;
  const username = `uniqueuser${Date.now()}`;

  const { token: token1 } = await userAccount.requestVerification({ email: email1 });
  await userAccount.confirmVerification({ token: token1, username, password: "Password123" });

  const { token: token2 } = await userAccount.requestVerification({ email: email2 });
  await assertRejects(
    async () => {
      await userAccount.confirmVerification({ token: token2, username, password: "Password123" });
    },
    Error,
    "Username already taken"
  );
  console.log(" Variant 2 PASSED: Duplicate username rejected");
});

// Variant 3: Invalid token rejection
Deno.test("UserAccount - Variant 3: Invalid verification token rejected", async () => {
  await assertRejects(
    async () => {
      await userAccount.confirmVerification({ token: "invalid-token", username: "testuser", password: "Password123" });
    },
    Error,
    "Invalid verification token"
  );
  console.log(" Variant 3 PASSED: Invalid token rejected");
});

// Variant 4: View profile returns listings
Deno.test("UserAccount - Variant 4: Profile includes listings array", async () => {
  const email = `test${Date.now()}@example.com`;
  const { token } = await userAccount.requestVerification({ email });
  const username = `user${Date.now()}`;
  const { userId } = await userAccount.confirmVerification({ token, username, password: "Password123" });

  const profile = await userAccount.viewProfile({ userId });
  assertExists(profile.listings);
  assertEquals(Array.isArray(profile.listings), true);
  console.log(" Variant 4 PASSED: Profile includes listings array");
});

// Variant 5: Missing required parameters
Deno.test("UserAccount - Variant 5: Missing email parameter rejected", async () => {
  await assertRejects(
    async () => {
      await userAccount.requestVerification({ email: "" });
    },
    Error
  );
  console.log(" Variant 5 PASSED: Missing parameters rejected");
});


