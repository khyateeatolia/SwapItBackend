// Phase 1: Generate all data and save to local JSON file
// Run this first - it can take a while due to AI image generation
// Output: data/generated-test-data.json

import { ObjectId } from "npm:mongodb@^6.0.0";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

// Environment variables
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

const USERS_PER_SCHOOL = 5;
const LISTINGS_PER_SCHOOL = 20;
const IMAGES_PER_LISTING = 2;

// Output file path
const OUTPUT_FILE = "./data/generated-test-data.json";

let genAI: GoogleGenerativeAI | null = null;

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
    console.warn("Cloudinary not configured - using placeholder");
    return `https://picsum.photos/seed/${Date.now()}/400/400`;
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
    console.log(`        Uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return `https://picsum.photos/seed/${Date.now()}/400/400`;
  }
}

// Generate image using Gemini - using fastest model with gray background
async function generateImage(prompt: string): Promise<string | null> {
  try {
    const genAI = getGenAI();
    // Using gemini-2.0-flash-exp for fast image generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const imagePrompt = `Generate a realistic product photo for a college marketplace listing: ${prompt}. 
IMPORTANT: The background MUST be a solid light gray color (hex #EAEAEA). 
Do NOT use white background. The item should be photographed on a clean, solid gray (#EAEAEA) background.
The image should be high quality, well-lit, professional e-commerce style product photo.
Do not include any text, watermarks, or logos in the image.
The gray background should be uniform and consistent throughout the image.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
      generationConfig: {
        responseModalities: ["image", "text"],
      } as any,
    });

    const response = result.response;
    
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
      const id = new ObjectId();
      users.push({
        _id: id.toString(),
        userId: id.toString(),
        email: `${u.username}@${domain}`,
        username: u.username,
        displayName: `${u.firstName} ${u.lastName}`,
        school,
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
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
          const cloudinaryUrl = await uploadToCloudinary(imageBase64, "swapit/listings");
          if (cloudinaryUrl.startsWith("http")) {
            photos.push(cloudinaryUrl);
          }
        }
        
        // Delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
      }
      
      // Use placeholder if no images generated
      if (photos.length === 0) {
        photos.push(`https://picsum.photos/seed/${Date.now()}/400/400`);
        photos.push(`https://picsum.photos/seed/${Date.now() + 1}/400/400`);
      }
      
      const listingId = new ObjectId();
      const listing = {
        _id: listingId.toString(),
        listingId: listingId.toString(),
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
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      listings.push(listing);
      console.log(`     Listing ${i + 1}/${listingData.length}: ${item.title} (${photos.length} images)`);
      
      // Save progress after each listing
      await saveProgressToFile({ users, listings, bids: [] });
    }
  }
  
  return listings;
}

// Generate bids
function generateBids(users: any[], listings: any[]): any[] {
  console.log("\n Generating bids...");
  
  const bids: any[] = [];
  const listingsWithBids = listings.filter(() => Math.random() < 0.6);
  
  for (const listing of listingsWithBids) {
    const schoolUsers = users.filter(u => u.school === listing.school && u.userId !== listing.sellerId);
    if (schoolUsers.length === 0) continue;
    
    const numBids = Math.floor(Math.random() * 3) + 1;
    let currentBid = listing.minAsk;
    
    for (let i = 0; i < numBids; i++) {
      const bidder = schoolUsers[Math.floor(Math.random() * schoolUsers.length)];
      currentBid += Math.floor(Math.random() * 10) + 1;
      
      const bidId = new ObjectId();
      bids.push({
        _id: bidId.toString(),
        bidId: bidId.toString(),
        listingId: listing.listingId,
        bidder: bidder.userId,
        amount: currentBid,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        withdrawn: false
      });
    }
    
    listing.currentHighestBid = currentBid;
  }
  
  console.log(`   Generated ${bids.length} bids on ${listingsWithBids.length} listings`);
  return bids;
}

// Save to file
async function saveProgressToFile(data: { users: any[], listings: any[], bids: any[] }) {
  try {
    // Ensure data directory exists
    await Deno.mkdir("./data", { recursive: true });
    await Deno.writeTextFile(OUTPUT_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving to file:", error);
  }
}

// Main execution
async function main() {
  console.log(" Phase 1: Generate Data and Save to File");
  console.log("============================================\n");
  console.log(`Output file: ${OUTPUT_FILE}\n`);
  
  if (!GEMINI_API_KEY) {
    console.error(" GEMINI_API_KEY is required");
    Deno.exit(1);
  }
  
  if (!CLOUDINARY_CLOUD_NAME) {
    console.warn("  Cloudinary not configured - images will use placeholders\n");
  }
  
  try {
    // Step 1: Generate users
    const users = await generateUsers();
    await saveProgressToFile({ users, listings: [], bids: [] });
    console.log(`\n Saved ${users.length} users to file`);
    
    // Step 2: Generate listings with images (saved incrementally)
    const listings = await generateListings(users);
    await saveProgressToFile({ users, listings, bids: [] });
    console.log(`\n Saved ${listings.length} listings to file`);
    
    // Step 3: Generate bids
    const bids = generateBids(users, listings);
    await saveProgressToFile({ users, listings, bids });
    console.log(`\n Saved ${bids.length} bids to file`);
    
    // Summary
    console.log("\n============================================");
    console.log(" Phase 1 Complete - Data Saved to File!");
    console.log("============================================");
    console.log(` Output: ${OUTPUT_FILE}`);
    console.log(` Summary:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Listings: ${listings.length}`);
    console.log(`   Bids: ${bids.length}`);
    console.log(`   Total Images: ~${listings.reduce((sum, l) => sum + l.photos.length, 0)}`);
    console.log(`\n Next: Run 'deno task populate-from-file' to insert into database`);
    
  } catch (error) {
    console.error(" Error:", error);
  }
}

// Run
main();
