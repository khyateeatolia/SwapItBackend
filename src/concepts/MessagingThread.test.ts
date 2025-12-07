import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ObjectId } from "npm:mongodb@^6.0.0";
import { MessagingThread } from "./MessagingThread.ts";
import { ItemListing } from "./ItemListing.ts";
import { getDb } from "../concept-server.ts";

const messagingThread = new MessagingThread();
const itemListing = new ItemListing();

// Helper to create a test user
async function createTestUser() {
  const db = await getDb();
  const userId = new ObjectId();
  await db.collection("users").insertOne({
    userId,
    email: `test${Date.now()}@example.com`,
    username: `user${Date.now()}`,
    displayName: `User ${Date.now()}`,
    avatarUrl: null,
    verifiedAt: new Date(),
  });
  return userId.toString();
}

// Operational Principle: Start thread, post message, retrieve thread, mark pickup complete
Deno.test("MessagingThread - Operational Principle: Complete messaging flow", async () => {
  const seller = await createTestUser();
  const buyer = await createTestUser();

  // Create listing
  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test Item",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  // Step 1: Start thread
  const { threadId } = await messagingThread.startThread({
    userId: buyer,
    listingId,
  });
  assertExists(threadId);
  console.log("✓ Thread started:", threadId);

  // Step 2: Post message
  await messagingThread.postMessage({
    threadId,
    userId: buyer,
    text: "Hello, I'm interested!",
  });
  console.log("✓ Message posted");

  // Step 3: Post message from seller
  await messagingThread.postMessage({
    threadId,
    userId: seller,
    text: "Great! When can you pick it up?",
  });

  // Step 4: Get thread
  const thread = await messagingThread.getThread({ threadId });
  assertEquals(thread.messages.length, 2);
  assertEquals(thread.participants.length, 2);
  console.log("✓ Thread retrieved with messages");

  // Step 5: Mark pickup complete
  await messagingThread.markPickupComplete({ threadId, userId: seller });
  const completedThread = await messagingThread.getThread({ threadId });
  assertEquals(completedThread.pickupComplete, true);
  console.log("✓ Pickup marked complete");

  console.log(" Operational principle test PASSED");
});

// Variant 1: Cannot start duplicate thread
Deno.test("MessagingThread - Variant 1: Duplicate thread returns existing", async () => {
  const seller = await createTestUser();
  const buyer = await createTestUser();

  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  const { threadId: threadId1 } = await messagingThread.startThread({
    userId: buyer,
    listingId,
  });

  const { threadId: threadId2 } = await messagingThread.startThread({
    userId: buyer,
    listingId,
  });

  assertEquals(threadId1, threadId2);
  console.log(" Variant 1 PASSED: Duplicate thread returns existing");
});

// Variant 2: Only participants can post messages
Deno.test("MessagingThread - Variant 2: Non-participant cannot post", async () => {
  const seller = await createTestUser();
  const buyer = await createTestUser();
  const outsider = await createTestUser();

  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  const { threadId } = await messagingThread.startThread({
    userId: buyer,
    listingId,
  });

  await assertRejects(
    async () => {
      await messagingThread.postMessage({
        threadId,
        userId: outsider,
        text: "Hello",
      });
    },
    Error,
    "not a participant"
  );
  console.log(" Variant 2 PASSED: Non-participant rejected");
});

// Variant 3: Only seller can mark pickup complete
Deno.test("MessagingThread - Variant 3: Only seller can mark pickup complete", async () => {
  const seller = await createTestUser();
  const buyer = await createTestUser();

  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  const { threadId } = await messagingThread.startThread({
    userId: buyer,
    listingId,
  });

  await assertRejects(
    async () => {
      await messagingThread.markPickupComplete({ threadId, userId: buyer });
    },
    Error,
    "Only the seller"
  );
  console.log(" Variant 3 PASSED: Only seller can mark complete");
});

// Variant 4: Get threads by user
Deno.test("MessagingThread - Variant 4: Retrieve threads by user", async () => {
  const seller = await createTestUser();
  const buyer = await createTestUser();

  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  const { threadId } = await messagingThread.startThread({
    userId: buyer,
    listingId,
  });

  const buyerThreads = await messagingThread.getThreadsByUser({ userId: buyer });
  const found = buyerThreads.find((t) => t.threadId === threadId);
  assertExists(found);
  console.log(" Variant 4 PASSED: Threads retrieved by user");
});

// Variant 5: Get threads by listing
Deno.test("MessagingThread - Variant 5: Retrieve threads by listing", async () => {
  const seller = await createTestUser();
  const buyer1 = await createTestUser();
  const buyer2 = await createTestUser();

  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  const { threadId: threadId1 } = await messagingThread.startThread({
    userId: buyer1,
    listingId,
  });
  const { threadId: threadId2 } = await messagingThread.startThread({
    userId: buyer2,
    listingId,
  });

  const listingThreads = await messagingThread.getThreadsByListing({ listingId });
  assertEquals(listingThreads.length, 2);
  console.log(" Variant 5 PASSED: Threads retrieved by listing");
});


