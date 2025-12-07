import { assertEquals, assertExists, assertRejects, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ObjectId } from "npm:mongodb@^6.0.0";
import { Bidding } from "./Bidding.ts";
import { ItemListing } from "./ItemListing.ts";
import { getDb } from "../concept-server.ts";

const bidding = new Bidding();
const itemListing = new ItemListing();

// Helper to create a test user with school affiliation
async function createTestUser(school = "MIT") {
  const db = await getDb();
  const userId = new ObjectId();
  await db.collection("users").insertOne({
    userId,
    email: `test${Date.now()}@${school.toLowerCase().replace(/\s/g, '')}.edu`,
    username: `user${Date.now()}`,
    displayName: `User ${Date.now()}`,
    school,
    avatarUrl: null,
    verifiedAt: new Date(),
  });
  return userId.toString();
}

// Operational Principle: Place bid, get bids, get current high, get bid history
Deno.test("Bidding - Operational Principle: Complete bidding flow", async () => {
  const seller = await createTestUser("MIT");
  const bidder = await createTestUser("MIT");

  // Create listing
  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test Item",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
    minAsk: 10,
  });

  // Step 1: Place bid
  const { bidId } = await bidding.placeBid({
    bidder,
    listingId,
    amount: 15,
  });
  assertExists(bidId);
  console.log("✓ Bid placed:", bidId);

  // Step 2: Get current high bid
  const currentHigh = await bidding.getCurrentHigh({ listingId });
  assert(currentHigh !== null, "currentHigh should not be null");
  assertEquals(currentHigh.amount, 15);
  console.log("✓ Current highest bid retrieved");

  // Step 3: Get all bids
  const bids = await bidding.getBids({ listingId });
  assertEquals(bids.length, 1);
  assertEquals(bids[0].amount, 15);
  console.log("✓ All bids retrieved");

  // Step 4: Place another bid (non-progressive - any amount >= minAsk allowed)
  const bidder2 = await createTestUser("MIT");
  const { bidId: bidId2 } = await bidding.placeBid({
    bidder: bidder2,
    listingId,
    amount: 12, // Lower than current high, but >= minAsk - should work!
  });
  assertExists(bidId2);
  console.log("✓ Second bid placed (non-progressive bidding works)");

  // Step 5: Get bid history
  const history = await bidding.getBidHistory({ listingId });
  assertEquals(history.totalBids, 2);
  console.log("✓ Bid history retrieved");

  console.log(" Operational principle test PASSED");
});

// Variant 1: Bid must meet minimum ask
Deno.test("Bidding - Variant 1: Bid below minAsk rejected", async () => {
  const seller = await createTestUser("MIT");
  const bidder = await createTestUser("MIT");

  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
    minAsk: 25,
  });

  await assertRejects(
    async () => {
      await bidding.placeBid({ bidder, listingId, amount: 20 });
    },
    Error,
    "at least"
  );
  console.log(" Variant 1 PASSED: Bid below minAsk rejected");
});

// Variant 2: Cannot bid on own listing
Deno.test("Bidding - Variant 2: Seller cannot bid on own listing", async () => {
  const seller = await createTestUser("MIT");

  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  await assertRejects(
    async () => {
      await bidding.placeBid({ bidder: seller, listingId, amount: 10 });
    },
    Error,
    "own listing"
  );
  console.log(" Variant 2 PASSED: Seller cannot bid on own listing");
});

// Variant 3: Cannot bid on inactive listing
Deno.test("Bidding - Variant 3: Cannot bid on sold listing", async () => {
  const seller = await createTestUser("MIT");
  const bidder = await createTestUser("MIT");

  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  await itemListing.setStatus({ listingId, status: "Sold" });

  await assertRejects(
    async () => {
      await bidding.placeBid({ bidder, listingId, amount: 10 });
    },
    Error,
    "inactive"
  );
  console.log(" Variant 3 PASSED: Cannot bid on inactive listing");
});

// Variant 4: Bidder must be from same school
Deno.test("Bidding - Variant 4: Cross-school bidding rejected", async () => {
  const seller = await createTestUser("MIT");
  const bidder = await createTestUser("Harvard"); // Different school

  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  await assertRejects(
    async () => {
      await bidding.placeBid({ bidder, listingId, amount: 10 });
    },
    Error,
    "your school"
  );
  console.log(" Variant 4 PASSED: Cross-school bidding rejected");
});

// Variant 5: Bids sorted by amount DESC
Deno.test("Bidding - Variant 5: Bids returned in descending order", async () => {
  const seller = await createTestUser("MIT");
  const bidder1 = await createTestUser("MIT");
  const bidder2 = await createTestUser("MIT");
  const bidder3 = await createTestUser("MIT");

  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  await bidding.placeBid({ bidder: bidder1, listingId, amount: 10 });
  await bidding.placeBid({ bidder: bidder2, listingId, amount: 30 });
  await bidding.placeBid({ bidder: bidder3, listingId, amount: 20 });

  const bids = await bidding.getBids({ listingId });
  assertEquals(bids[0].amount, 30);
  assertEquals(bids[1].amount, 20);
  assertEquals(bids[2].amount, 10);
  console.log(" Variant 5 PASSED: Bids sorted correctly");
});
