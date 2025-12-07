import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ObjectId } from "npm:mongodb@^6.0.0";
import { ItemListing } from "./ItemListing.ts";
import { getDb } from "../concept-server.ts";

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

// Operational Principle: Create listing, update it, change status, retrieve by user
Deno.test("ItemListing - Operational Principle: Complete listing lifecycle", async () => {
  const seller = await createTestUser();

  // Step 1: Create listing
  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test Dress",
    description: "A beautiful dress",
    photos: ["photo1.jpg"],
    tags: ["Tops"],
    minAsk: 25,
  });
  assertExists(listingId);
  console.log("✓ Listing created:", listingId);

  // Step 2: Update listing
  await itemListing.updateListing({
    listingId,
    fields: { title: "Updated Dress" },
  });
  const listing = await itemListing.getListing({ listingId });
  assertEquals(listing.title, "Updated Dress");
  console.log("✓ Listing updated");

  // Step 3: Change status
  await itemListing.setStatus({ listingId, status: "Sold" });
  const soldListing = await itemListing.getListing({ listingId });
  assertEquals(soldListing.status, "Sold");
  console.log("✓ Status changed to Sold");

  // Step 4: Retrieve by user (returns { listings: [...] })
  const result = await itemListing.getListingsByUser({ userId: seller });
  const foundListing = result.listings.find((l) => l.listingId === listingId);
  assertExists(foundListing);
  console.log("✓ Listing retrieved by user");

  console.log(" Operational principle test PASSED");
});

// Variant 1: Missing required fields
Deno.test("ItemListing - Variant 1: Missing required fields rejected", async () => {
  const seller = await createTestUser();
  await assertRejects(
    async () => {
      await itemListing.createListing({
        seller,
        title: "",
        description: "Test",
        photos: ["photo1.jpg"],
        tags: [],
      });
    },
    Error
  );
  console.log(" Variant 1 PASSED: Missing fields rejected");
});

// Variant 2: At least one photo required
Deno.test("ItemListing - Variant 2: Empty photos array rejected", async () => {
  const seller = await createTestUser();
  await assertRejects(
    async () => {
      await itemListing.createListing({
        seller,
        title: "Test",
        description: "Test",
        photos: [],
        tags: [],
      });
    },
    Error,
    "At least one photo is required"
  );
  console.log(" Variant 2 PASSED: Empty photos rejected");
});

// Variant 3: Invalid status rejected
Deno.test("ItemListing - Variant 3: Invalid status rejected", async () => {
  const seller = await createTestUser();
  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  await assertRejects(
    async () => {
      await itemListing.setStatus({ listingId, status: "InvalidStatus" as any });
    },
    Error,
    "Invalid status"
  );
  console.log(" Variant 3 PASSED: Invalid status rejected");
});

// Variant 4: Listing not found error
Deno.test("ItemListing - Variant 4: Non-existent listing returns error", async () => {
  const fakeId = new ObjectId().toString();
  await assertRejects(
    async () => {
      await itemListing.getListing({ listingId: fakeId });
    },
    Error,
    "Listing not found"
  );
  console.log(" Variant 4 PASSED: Non-existent listing handled");
});

// Variant 5: Optional minAsk field
Deno.test("ItemListing - Variant 5: Listing can be created without minAsk", async () => {
  const seller = await createTestUser();
  const { listingId } = await itemListing.createListing({
    seller,
    title: "Test",
    description: "Test",
    photos: ["photo1.jpg"],
    tags: [],
  });

  const listing = await itemListing.getListing({ listingId });
  assertEquals(listing.minAsk, null);
  console.log(" Variant 5 PASSED: Optional minAsk works");
});
