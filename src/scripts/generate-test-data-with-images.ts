// Complete Test Data Generator with Gemini AI Images + Cloudinary
// Generates users, listings with AI-generated images, and bids

import { MongoClient, ObjectId } from "npm:mongodb@^6.0.0";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

// Environment variables
const MONGODB_URL = Deno.env.get("MONGODB_URL") || "";
const DB_NAME = Deno.env.get("DB_NAME") || "assignment4a";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

// Configuration
const SCHOOLS = ["MIT", "Wellesley", "Harvard", "Boston University", "Northeastern"];
const SCHOOL_DOMAINS: Record<string, string> = {
  "MIT": "mit.edu",
  "Wellesley": "wellesley.edu",
  "Harvard": "harvard.edu",
  "Boston University": "bu.edu",
  "Northeastern": "northeastern.edu"
};

const CATEGORIES = [
  "Tops", "Bottoms", "Outerwear", "Dresses", "Activewear",
  "Formalwear", "Ethnicwear", "Occasionwear", "Footwear", "Accessories"
];

const CONDITIONS = ["new_with_tags", "pre_owned", "washed"];

const USERS_PER_SCHOOL = 5;
const LISTINGS_PER_SCHOOL = 20;
const IMAGES_PER_LISTING = 2;

// Initialize clients
let mongoClient: MongoClient | null = null;
let genAI: GoogleGenerativeAI | null = null;

async function getDb() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URL);
    await mongoClient.connect();
  }
  return mongoClient.db(DB_NAME);
}

function getGenAI() {
  if (!genAI) {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY required");
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

// Upload to Cloudinary
async function uploadToCloudinary(base64Image: string, folder: string): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary not configured");
    return base64Image;
  }

  let imageData = base64Image;
  if (!imageData.startsWith("data:")) {
    imageData = `data:image/png;base64,${imageData}`;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureString = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const formData = new FormData();
  formData.append("file", imageData);
  formData.append("folder", folder);
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("signature", signature);

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  try {
    const response = await fetch(url, { method: "POST", body: formData });
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return base64Image;
  }
}

// Generate image using Gemini
async function generateImage(prompt: string): Promise<string | null> {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const imagePrompt = `Generate a realistic product photo for a college marketplace listing: ${prompt}. 
The image should be high quality, well-lit, on a clean background suitable for an e-commerce listing.
Do not include any text, watermarks, or logos in the image.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
      generationConfig: {
        responseModalities: ["image", "text"],
      } as any,
    });

    const response = result.response;
    
    // Extract image from response
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if ((part as any).inlineData) {
          return (part as any).inlineData.data;
        }
      }
    }
    
    console.warn("No image generated for:", prompt.substring(0, 50));
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

// Generate users
async function generateUsers(): Promise<any[]> {
  console.log("\n Generating users...");
  
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const users: any[] = [];
  
  for (const school of SCHOOLS) {
    const domain = SCHOOL_DOMAINS[school];
    const prompt = `Generate ${USERS_PER_SCHOOL} realistic college student profiles for ${school}.
Return ONLY a JSON array with this structure:
[{"firstName": "Alex", "lastName": "Chen", "username": "alexchen"}]
Make usernames lowercase, unique, and realistic. Use diverse names.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
    const parsed = JSON.parse(jsonMatch[1].trim());
    
    for (const u of parsed) {
      users.push({
        userId: new ObjectId(),
        email: `${u.username}@${domain}`,
        username: u.username,
        displayName: `${u.firstName} ${u.lastName}`,
        school,
        verifiedAt: new Date(),
        createdAt: new Date()
      });
    }
    console.log(`   ${school}: ${parsed.length} users`);
  }
  
  return users;
}

// Generate listings with images
async function generateListings(users: any[]): Promise<any[]> {
  console.log("\n Generating listings with AI images...");
  
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const listings: any[] = [];
  
  for (const school of SCHOOLS) {
    const schoolUsers = users.filter(u => u.school === school);
    
    // Generate listing metadata for this school
    const metadataPrompt = `Generate ${LISTINGS_PER_SCHOOL} realistic secondhand clothing listings for a college marketplace.
Use ONLY these categories: ${CATEGORIES.join(", ")}
Use ONLY these conditions: new_with_tags, pre_owned, washed

Return ONLY a JSON array:
[{
  "title": "Blue Denim Jacket",
  "description": "Lightly worn Levi's denim jacket, size M. Great condition.",
  "category": "Outerwear",
  "condition": "pre_owned",
  "minAsk": 45
}]

Make titles short (2-4 words). Descriptions should be 10-25 words.
Prices should range from $10-$150 based on item type.
Distribute evenly across all 10 categories.`;

    const result = await model.generateContent(metadataPrompt);
    const text = result.response.text();
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
    const listingData = JSON.parse(jsonMatch[1].trim());
    
    console.log(`\n   ${school}: Generating ${listingData.length} listings with images...`);
    
    for (let i = 0; i < listingData.length; i++) {
      const item = listingData[i];
      const seller = schoolUsers[i % schoolUsers.length];
      
      // Generate images
      const photos: string[] = [];
      for (let imgIdx = 0; imgIdx < IMAGES_PER_LISTING; imgIdx++) {
        const angle = imgIdx === 0 ? "front view" : "detail/side view";
        const imgPrompt = `${item.title}, ${item.category}, ${angle}, college student fashion`;
        
        console.log(`      Generating image ${imgIdx + 1}/${IMAGES_PER_LISTING} for: ${item.title}`);
        const imageBase64 = await generateImage(imgPrompt);
        
        if (imageBase64) {
          const cloudinaryUrl = await uploadToCloudinary(imageBase64, "campuscloset/listings");
          if (cloudinaryUrl.startsWith("http")) {
            photos.push(cloudinaryUrl);
            console.log(`        Uploaded to Cloudinary`);
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }
      
      // Use placeholder if no images generated
      if (photos.length === 0) {
        photos.push(`https://picsum.photos/seed/${Date.now()}/400/400`);
        photos.push(`https://picsum.photos/seed/${Date.now() + 1}/400/400`);
      }
      
      const listing = {
        listingId: new ObjectId(),
        sellerId: seller.userId,
        school,
        title: item.title,
        description: item.description,
        photos,
        tags: [item.category],
        condition: item.condition,
        minAsk: item.minAsk,
        status: "Active",
        currentHighestBid: null,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        updatedAt: new Date()
      };
      
      listings.push(listing);
      console.log(`     Listing ${i + 1}/${listingData.length}: ${item.title} (${photos.length} images)`);
    }
  }
  
  return listings;
}

// Generate bids
async function generateBids(users: any[], listings: any[]): Promise<any[]> {
  console.log("\n Generating bids...");
  
  const bids: any[] = [];
  const listingsWithBids = listings.filter(() => Math.random() < 0.6); // 60% of listings get bids
  
  for (const listing of listingsWithBids) {
    const schoolUsers = users.filter(u => u.school === listing.school && !u.userId.equals(listing.sellerId));
    if (schoolUsers.length === 0) continue;
    
    const numBids = Math.floor(Math.random() * 3) + 1; // 1-3 bids
    let currentBid = listing.minAsk;
    
    for (let i = 0; i < numBids; i++) {
      const bidder = schoolUsers[Math.floor(Math.random() * schoolUsers.length)];
      currentBid += Math.floor(Math.random() * 10) + 1; // Increment by $1-$10
      
      bids.push({
        bidId: new ObjectId(),
        listingId: listing.listingId,
        bidder: bidder.userId,
        amount: currentBid,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        withdrawn: false
      });
    }
    
    // Update listing with highest bid
    listing.currentHighestBid = currentBid;
  }
  
  console.log(`   Generated ${bids.length} bids on ${listingsWithBids.length} listings`);
  return bids;
}

// Main execution
async function main() {
  console.log(" Starting Test Data Generation with AI Images");
  console.log("================================================\n");
  
  if (!GEMINI_API_KEY) {
    console.error(" GEMINI_API_KEY is required");
    Deno.exit(1);
  }
  
  if (!CLOUDINARY_CLOUD_NAME) {
    console.warn("  Cloudinary not configured - images will use placeholders");
  }
  
  try {
    const db = await getDb();
    
    // Step 1: Clear existing data
    console.log("  Clearing existing data...");
    await db.collection("users").deleteMany({});
    await db.collection("listings").deleteMany({});
    await db.collection("bids").deleteMany({});
    await db.collection("bid_logs").deleteMany({});
    await db.collection("threads").deleteMany({});
    await db.collection("pending_verifications").deleteMany({});
    console.log("   Cleared all collections\n");
    
    // Step 2: Generate users
    const users = await generateUsers();
    await db.collection("users").insertMany(users);
    console.log(`\n Inserted ${users.length} users`);
    
    // Step 3: Generate listings with images
    const listings = await generateListings(users);
    await db.collection("listings").insertMany(listings);
    console.log(`\n Inserted ${listings.length} listings`);
    
    // Step 4: Generate bids
    const bids = await generateBids(users, listings);
    await db.collection("bid_logs").insertMany(bids);
    console.log(`\n Inserted ${bids.length} bids`);
    
    // Summary
    console.log("\n================================================");
    console.log(" Test Data Generation Complete!");
    console.log("================================================");
    console.log(` Summary:`);
    console.log(`   Users: ${users.length} (${USERS_PER_SCHOOL} per school)`);
    console.log(`   Listings: ${listings.length} (${LISTINGS_PER_SCHOOL} per school)`);
    console.log(`   Images: ~${listings.length * IMAGES_PER_LISTING} (${IMAGES_PER_LISTING} per listing)`);
    console.log(`   Bids: ${bids.length}`);
    console.log(`   Schools: ${SCHOOLS.join(", ")}`);
    
  } catch (error) {
    console.error(" Error:", error);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

// Run
main();
