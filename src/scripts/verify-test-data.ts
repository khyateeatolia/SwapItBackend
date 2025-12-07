import { MongoClient } from "npm:mongodb";

const client = new MongoClient(Deno.env.get("MONGODB_URL") || "");
await client.connect();
const db = client.db("assignment4a");

const users = await db.collection("users").countDocuments();
const listings = await db.collection("listings").countDocuments();
const bids = await db.collection("bids").countDocuments();

console.log("=== DATABASE VERIFICATION ===");
console.log("Users:", users);
console.log("Listings:", listings);
console.log("Bids:", bids);

// Check listings by school
const schools = ["MIT", "Wellesley", "Harvard", "Boston University", "Northeastern"];
console.log("\n=== LISTINGS BY SCHOOL ===");
for (const school of schools) {
  const count = await db.collection("listings").countDocuments({ school });
  console.log(school + ":", count);
}

// Check sample listing for Cloudinary URLs
const sampleListing = await db.collection("listings").findOne({});
if (sampleListing) {
  console.log("\n=== SAMPLE LISTING ===");
  console.log("Title:", sampleListing.title);
  console.log("School:", sampleListing.school);
  console.log("Photos count:", sampleListing.photos?.length || 0);
  if (sampleListing.photos && sampleListing.photos.length > 0) {
    const photoUrl = sampleListing.photos[0] as string;
    console.log("First photo URL:", photoUrl.substring(0, 80) + "...");
    console.log("Is Cloudinary URL:", photoUrl.includes("cloudinary"));
  }
}

// Check categories distribution
console.log("\n=== CATEGORIES DISTRIBUTION ===");
const categories = await db.collection("listings").aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).toArray();
for (const cat of categories) {
  console.log(`${cat._id}: ${cat.count}`);
}

await client.close();
console.log("\n Database verification complete!");
