// Update listings with existing Cloudinary images
import { MongoClient } from "npm:mongodb@^6.0.0";

const MONGODB_URL = Deno.env.get("MONGODB_URL") || "";
const DB_NAME = "assignment4a";
const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

async function fetchCloudinaryImages(): Promise<string[]> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error(" Cloudinary credentials not configured");
    return [];
  }

  console.log(" Fetching images from Cloudinary...");
  
  const images: string[] = [];
  let nextCursor: string | null = null;
  
  do {
    const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image`);
    url.searchParams.set("type", "upload");
    url.searchParams.set("prefix", "campuscloset/listings");
    url.searchParams.set("max_results", "500");
    if (nextCursor) {
      url.searchParams.set("next_cursor", nextCursor);
    }
    
    const auth = btoa(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`);
    
    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Basic ${auth}`
      }
    });
    
    if (!response.ok) {
      console.error("Failed to fetch:", await response.text());
      break;
    }
    
    const data = await response.json();
    
    for (const resource of data.resources || []) {
      images.push(resource.secure_url);
    }
    
    nextCursor = data.next_cursor || null;
    console.log(`  Found ${images.length} images so far...`);
  } while (nextCursor);
  
  console.log(` Found ${images.length} total images in Cloudinary\n`);
  return images;
}

async function main() {
  console.log("🔄 Updating Listings with Cloudinary Images");
  console.log("==========================================\n");
  
  // Fetch all Cloudinary images
  const cloudinaryImages = await fetchCloudinaryImages();
  
  if (cloudinaryImages.length === 0) {
    console.log(" No images found. Exiting.");
    return;
  }
  
  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  
  // Get all listings
  const listings = await db.collection("listings").find({}).toArray();
  console.log(` Found ${listings.length} listings to update\n`);
  
  // Assign images to listings (2 per listing, cycling through available images)
  let imageIndex = 0;
  let updatedCount = 0;
  
  for (const listing of listings) {
    // Get 2 images for this listing
    const photo1 = cloudinaryImages[imageIndex % cloudinaryImages.length];
    const photo2 = cloudinaryImages[(imageIndex + 1) % cloudinaryImages.length];
    
    await db.collection("listings").updateOne(
      { _id: listing._id },
      { $set: { photos: [photo1, photo2] } }
    );
    
    imageIndex += 2;
    updatedCount++;
    
    if (updatedCount % 20 === 0) {
      console.log(`  Updated ${updatedCount}/${listings.length} listings...`);
    }
  }
  
  console.log(`\n Updated ${updatedCount} listings with Cloudinary images!`);
  
  // Verify a sample
  const sample = await db.collection("listings").findOne({});
  console.log("\n Sample listing photos:");
  console.log("  Photo 1:", sample?.photos?.[0]?.substring(0, 80) + "...");
  console.log("  Photo 2:", sample?.photos?.[1]?.substring(0, 80) + "...");
  
  await client.close();
}

main();
