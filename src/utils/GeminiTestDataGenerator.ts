import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash-exp";

interface UserData {
    email: string;
    username: string;
    displayName: string;
    school: string;
}

interface ListingData {
    title: string;
    description: string;
    tags: string[];
    minAsk: number;
    category: string;
    condition: string;
}

interface BidData {
    listingIndex: number;
    userIndex: number;
    amount: number;
}

interface MessageData {
    listingIndex: number;
    senderIndex: number;
    receiverIndex: number;
    text: string;
}

export class GeminiTestDataGenerator {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is required");
        }
        this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL });
    }

    async generateUsers(count: number): Promise<UserData[]> {
        const schools = ["MIT", "Wellesley", "Harvard", "Boston University", "Northeastern"];

        const prompt = `Generate ${count} diverse college student profiles for a campus secondhand marketplace app.

Requirements:
- Mix of different years (freshman, sophomore, junior, senior)
- Diverse names representing different backgrounds
- Realistic email addresses using school domains
- Creative but appropriate usernames
- Schools: ${schools.join(", ")}
- Distribute students across all schools

Return ONLY a valid JSON array with this exact structure:
[
  {
    "email": "student@mit.edu",
    "username": "studentname",
    "displayName": "Student Name",
    "school": "MIT"
  }
]

Generate exactly ${count} user objects. Use appropriate email domains:
- MIT: @mit.edu
- Wellesley: @wellesley.edu
- Harvard: @harvard.edu
- Boston University: @bu.edu
- Northeastern: @northeastern.edu`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from markdown code blocks if present
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
        const jsonText = jsonMatch[1].trim();

        return JSON.parse(jsonText);
    }

    async generateListings(count: number, users: UserData[]): Promise<ListingData[]> {
        const prompt = `Generate ${count} realistic secondhand item listings for a college marketplace.

Categories to include:
- Clothing (jackets, shoes, dresses, sweaters, etc.)
- Textbooks (various subjects and editions)
- Electronics (laptops, phones, headphones, calculators)
- Furniture (desks, chairs, lamps, shelves)
- Dorm essentials (bedding, storage, appliances)
- Sports equipment (bikes, yoga mats, weights)
- Musical instruments

Requirements:
- Realistic titles (brief, descriptive)
- Detailed descriptions mentioning condition, size/specs, reason for selling
- Appropriate tags from: Clothing, Textbooks, Electronics, Furniture, Dorm, Sports, Music, Other
- Realistic pricing ($5-$500 range, appropriate for item type)
- Mix of great deals and fair market prices

- Include a condition for each item: "new_with_tags", "pre_owned", or "washed"
- Distribution: about 20% new_with_tags, 60% pre_owned, 20% washed

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Item Title",
    "description": "Detailed description...",
    "tags": ["Category1", "Category2"],
    "minAsk": 25,
    "category": "Clothing",
    "condition": "pre_owned"
  }
]

Generate exactly ${count} listing objects.`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
        const jsonText = jsonMatch[1].trim();

        return JSON.parse(jsonText);
    }

    async generateBids(listingCount: number, userCount: number): Promise<BidData[]> {
        // Generate realistic bidding patterns
        const bidsPerListing = Math.floor(Math.random() * 3) + 1; // 1-3 bids per listing
        const listingsWithBids = Math.floor(listingCount * 0.6); // 60% of listings have bids

        const prompt = `Generate realistic bid data for a college marketplace.

Context:
- ${listingCount} total listings
- ${userCount} total users
- About ${listingsWithBids} listings should have bids
- Each listing with bids should have 1-3 bids
- Bids should be realistic increments (e.g., if minAsk is $20, bids might be $22, $25, $27)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "listingIndex": 0,
    "userIndex": 5,
    "amount": 25
  }
]

Where listingIndex is 0 to ${listingCount - 1} and userIndex is 0 to ${userCount - 1}.
Generate approximately ${listingsWithBids * 2} bid objects.`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
        const jsonText = jsonMatch[1].trim();

        return JSON.parse(jsonText);
    }

    async generateMessages(
        listingCount: number,
        userCount: number
    ): Promise<MessageData[]> {
        const conversationsCount = Math.floor(listingCount * 0.3); // 30% of listings have messages

        const prompt = `Generate realistic message conversations for a college marketplace.

Context:
- Buyers and sellers messaging about item pickup, condition, availability
- ${conversationsCount} conversations between different users
- Each conversation should have 2-4 messages back and forth
- Messages should be casual but polite college student style
- Topics: asking about condition, negotiating price, arranging pickup, asking questions

Return ONLY a valid JSON array with this exact structure:
[
  {
    "listingIndex": 0,
    "senderIndex": 1,
    "receiverIndex": 2,
    "text": "Hey! Is this still available?"
  }
]

Where listingIndex is 0 to ${listingCount - 1}, senderIndex and receiverIndex are 0 to ${userCount - 1}.
Generate approximately ${conversationsCount * 3} message objects representing realistic conversations.`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
        const jsonText = jsonMatch[1].trim();

        return JSON.parse(jsonText);
    }

    async generateAll() {
        console.log("🤖 Generating test data with Gemini AI...\n");

        console.log(" Generating 20 diverse user profiles...");
        const users = await this.generateUsers(20);
        console.log(` Generated ${users.length} users\n`);

        console.log("  Generating 50 realistic item listings...");
        const listings = await this.generateListings(50, users);
        console.log(` Generated ${listings.length} listings\n`);

        console.log(" Generating bid activity...");
        const bids = await this.generateBids(50, 20);
        console.log(` Generated ${bids.length} bids\n`);

        console.log(" Generating message conversations...");
        const messages = await this.generateMessages(50, 20);
        console.log(` Generated ${messages.length} messages\n`);

        return { users, listings, bids, messages };
    }
}

// Allow running directly for testing
if (import.meta.main) {
    const generator = new GeminiTestDataGenerator();
    const data = await generator.generateAll();

    console.log("\n Sample Data Preview:\n");
    console.log("Users:", data.users.slice(0, 3));
    console.log("\nListings:", data.listings.slice(0, 3));
    console.log("\nBids:", data.bids.slice(0, 5));
    console.log("\nMessages:", data.messages.slice(0, 5));
}
