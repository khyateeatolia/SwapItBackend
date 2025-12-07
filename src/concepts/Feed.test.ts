import { assertEquals, assertExists, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ObjectId } from "npm:mongodb@^6.0.0";
import { Feed } from "./Feed.ts";
import { ItemListing } from "./ItemListing.ts";
import { Bidding } from "./Bidding.ts";
import { getDb } from "../concept-server.ts";

const feed = new Feed();
const itemListing = new ItemListing();
const bidding = new Bidding();

// Helper to create a test user
async function createTestUser() {
  const db = await getDb();
  const userId = new ObjectId();
  await db.collection("users").insertOne({
    userId,
    email: `test${Date.now()}@example.com`,
    username: `user${Date.now()}`,
    displayName: `User ${Date.now()}`,
    school: "MIT",
    avatarUrl: null,
    verifiedAt: new Date(),
  });
  return userId.toString();
}

// Operational Principle: Create listings, filter by tag, filter by price, get latest
Deno.test("Feed - Operational Principle: Complete feed filtering", async () => {
  const seller = await createTestUser();
  const bidder = await createTestUser();

  // Create multiple listings
  const { listingId: listing1 } = await itemListing.createListing({
    seller,
    title: "T-Shirt",
    description: "Blue t-shirt",
    photos: ["photo1.jpg"],
    tags: ["Tops"],
    minAsk: 15,
  });

  const { listingId: listing2 } = await itemListing.createListing({
    seller,
    title: "Jeans",
    description: "Blue jeans",
    photos: ["photo2.jpg"],
    tags: ["Bottoms"],
    minAsk: 30,
  });

  const { listingId: listing3 } = await itemListing.createListing({
    seller,
    title: "Sweater",
    description: "Warm sweater",
    photos: ["photo3.jpg"],
    tags: ["Tops", "Outerwear"],
    minAsk: 25,
  });

  // Place bid on listing 1
  await bidding.placeBid({ bidder, listingId: listing1, amount: 20 });

  // Step 1: Get latest (should return all active listings)
  const latest = await feed.getLatest({ school: "MIT", n: 10 });
  assertExists(latest.find((l: any) => l.listingId === listing1));
  assertExists(latest.find((l: any) => l.listingId === listing2));
  assertExists(latest.find((l: any) => l.listingId === listing3));
  console.log("✓ Latest listings retrieved");

  // Step 2: Filter by tag
  const topsOnly = await feed.getByTag({ school: "MIT", tag: "Tops", n: 10 });
  assertEquals(topsOnly.every((l: any) => l.tags.includes("Tops")), true);
  console.log("✓ Filtered by tag");

  // Step 3: Filter by price
  const priceFiltered = await feed.getByPrice({ school: "MIT", minPrice: 20, maxPrice: 30, n: 10 });
  priceFiltered.forEach((l: any) => {
    assert(l.minAsk === null || (l.minAsk >= 20 && l.minAsk <= 30));
  });
  console.log("✓ Filtered by price range");

  // Step 4: Combined filters
  const combined = await feed.getLatest({
    school: "MIT",
    n: 10,
    filters: { tags: ["Tops"], minPrice: 20, maxPrice: 30 }
  });
  assertEquals(combined.every((l: any) => l.tags.some((t: any) => ["Tops"].includes(t))), true);
  console.log("✓ Combined filters work");

  console.log(" Operational principle test PASSED");
});

// Variant 1: Only Active listings returned
Deno.test("Feed - Variant 1: Sold listings excluded", async () => {
  const seller = await createTestUser();

  const { listingId: active } = await itemListing.createListing({
    seller,
    title: "Active Item",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  const { listingId: sold } = await itemListing.createListing({
    seller,
    title: "Sold Item",
    description: "Test",
    photos: ["photo2.jpg"],
    tags: [],
  });

  await itemListing.setStatus({ listingId: sold, status: "Sold" });

  const latest = await feed.getLatest({ school: "MIT", n: 10 });
  assertExists(latest.find((l: any) => l.listingId === active));
  assertEquals(latest.find((l: any) => l.listingId === sold), undefined);
  console.log(" Variant 1 PASSED: Sold listings excluded");
});

// Variant 2: Results sorted by createdAt DESC
Deno.test("Feed - Variant 2: Results sorted by newest first", async () => {
  const seller = await createTestUser();

  const { listingId: older } = await itemListing.createListing({
    seller,
    title: "Older",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  // Small delay to ensure different timestamps
  await new Promise((resolve) => setTimeout(resolve, 10));

  const { listingId: newer } = await itemListing.createListing({
    seller,
    title: "Newer",
    description: "Test",
    photos: ["photo2.jpg"],
    tags: [],
  });

  const latest = await feed.getLatest({ school: "MIT", n: 10 });
  const newerIndex = latest.findIndex((l: any) => l.listingId === newer);
  const olderIndex = latest.findIndex((l: any) => l.listingId === older);
  assertEquals(newerIndex < olderIndex, true);
  console.log(" Variant 2 PASSED: Results sorted correctly");
});

// Variant 3: Tag filter works
Deno.test("Feed - Variant 3: Tag filter returns only matching items", async () => {
  const seller = await createTestUser();

  await itemListing.createListing({
    seller,
    title: "Shoes",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: ["Shoes"],
  });

  await itemListing.createListing({
    seller,
    title: "Hat",
    description: "Test",
    photos: ["photo2.jpg"],
    tags: ["Accessories"],
  });

  const shoesOnly = await feed.getByTag({ school: "MIT", tag: "Shoes", n: 10 });
  assertEquals(shoesOnly.every((l: any) => l.tags.includes("Shoes")), true);
  assertEquals(shoesOnly.every((l) => !l.tags.includes("Accessories")), true);
  console.log(" Variant 3 PASSED: Tag filter works");
});

// Variant 4: Price filter includes items with bids
Deno.test("Feed - Variant 4: Price filter considers current highest bid", async () => {
  const seller = await createTestUser();
  const bidder = await createTestUser();

  const { listingId } = await itemListing.createListing({
    seller,
    title: "Item",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
    minAsk: 10,
  });

  await bidding.placeBid({ bidder, listingId, amount: 25 });

  const filtered = await feed.getByPrice({ school: "MIT", minPrice: 20, maxPrice: 30, n: 10 });
  assertExists(filtered.find((l: any) => l.listingId === listingId && l.currentHighestBid === 25));
  console.log(" Variant 4 PASSED: Price filter uses current bid");
});

// Variant 5: Limit n works
Deno.test("Feed - Variant 5: Limit parameter works", async () => {
  const seller = await createTestUser();

  // Create 5 listings
  for (let i = 0; i < 5; i++) {
    await itemListing.createListing({
      seller,
      title: `Item ${i}`,
      description: "Test",
      photos: ["photo1.jpg"],
      tags: [],
    });
  }

  const limited = await feed.getLatest({ school: "MIT", n: 3 });
  assertEquals(limited.length <= 3, true);
  console.log(" Variant 5 PASSED: Limit parameter works");
});


