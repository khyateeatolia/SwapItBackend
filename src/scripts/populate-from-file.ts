// Phase 2: Populate database from local JSON file
// Run this after generate-to-file.ts completes
// Input: data/generated-test-data.json

import { MongoClient, ObjectId } from "npm:mongodb@^6.0.0";

// Environment variables
const MONGODB_URL = Deno.env.get("MONGODB_URL") || "";
const DB_NAME = Deno.env.get("DB_NAME") || "assignment4a";

// Input file path
const INPUT_FILE = "./data/generated-test-data.json";

async function main() {
  console.log(" Phase 2: Populate Database from File");
  console.log("========================================\n");
  console.log(`Input file: ${INPUT_FILE}\n`);
  
  if (!MONGODB_URL) {
    console.error(" MONGODB_URL is required");
    Deno.exit(1);
  }
  
  // Read data file
  let data: { users: any[], listings: any[], bids: any[] };
  try {
    const fileContent = await Deno.readTextFile(INPUT_FILE);
    data = JSON.parse(fileContent);
    console.log(` Loaded data from file:`);
    console.log(`   Users: ${data.users.length}`);
    console.log(`   Listings: ${data.listings.length}`);
    console.log(`   Bids: ${data.bids.length}\n`);
  } catch (error) {
    console.error(` Failed to read ${INPUT_FILE}:`, error);
    console.log("\n Run 'deno task generate-to-file' first to generate data");
    Deno.exit(1);
  }
  
  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log(" Connected to MongoDB\n");
    
    const db = client.db(DB_NAME);
    
    // Step 1: Clear existing data
    console.log("  Clearing existing data...");
    await db.collection("users").deleteMany({});
    await db.collection("listings").deleteMany({});
    await db.collection("bids").deleteMany({});
    await db.collection("bid_logs").deleteMany({});
    await db.collection("threads").deleteMany({});
    await db.collection("pending_verifications").deleteMany({});
    console.log("   Cleared all collections\n");
    
    // Step 2: Convert string IDs back to ObjectIds and insert users
    console.log(" Inserting users...");
    const usersToInsert = data.users.map(u => ({
      ...u,
      _id: new ObjectId(u._id),
      userId: new ObjectId(u.userId),
      verifiedAt: new Date(u.verifiedAt),
      createdAt: new Date(u.createdAt)
    }));
    await db.collection("users").insertMany(usersToInsert);
    console.log(`   Inserted ${usersToInsert.length} users\n`);
    
    // Step 3: Insert listings
    console.log(" Inserting listings...");
    const listingsToInsert = data.listings.map(l => ({
      ...l,
      _id: new ObjectId(l._id),
      listingId: new ObjectId(l.listingId),
      sellerId: new ObjectId(l.sellerId),
      createdAt: new Date(l.createdAt),
      updatedAt: new Date(l.updatedAt)
    }));
    await db.collection("listings").insertMany(listingsToInsert);
    console.log(`   Inserted ${listingsToInsert.length} listings\n`);
    
    // Step 4: Insert bids
    console.log(" Inserting bids...");
    if (data.bids.length > 0) {
      const bidsToInsert = data.bids.map(b => ({
        ...b,
        _id: new ObjectId(b._id),
        bidId: new ObjectId(b.bidId),
        listingId: new ObjectId(b.listingId),
        bidder: new ObjectId(b.bidder),
        timestamp: new Date(b.timestamp)
      }));
      await db.collection("bid_logs").insertMany(bidsToInsert);
      console.log(`   Inserted ${bidsToInsert.length} bids\n`);
    } else {
      console.log("    No bids to insert\n");
    }
    
    // Summary
    console.log("========================================");
    console.log(" Phase 2 Complete - Database Populated!");
    console.log("========================================");
    console.log(` Database: ${DB_NAME}`);
    console.log(`   Users: ${usersToInsert.length}`);
    console.log(`   Listings: ${listingsToInsert.length}`);
    console.log(`   Bids: ${data.bids.length}`);
    
    // Verify counts
    const userCount = await db.collection("users").countDocuments();
    const listingCount = await db.collection("listings").countDocuments();
    const bidCount = await db.collection("bid_logs").countDocuments();
    
    console.log(`\n Verification:`);
    console.log(`   Users in DB: ${userCount}`);
    console.log(`   Listings in DB: ${listingCount}`);
    console.log(`   Bids in DB: ${bidCount}`);
    
  } catch (error) {
    console.error(" Error:", error);
  } finally {
    await client.close();
    console.log("\n Disconnected from MongoDB");
  }
}

// Run
main();
