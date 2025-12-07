#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { MongoClient, ObjectId } from "npm:mongodb@6.3";
import { GeminiTestDataGenerator } from "../utils/GeminiTestDataGenerator.ts";

const MONGODB_URL = Deno.env.get("MONGODB_URL");
const DB_NAME = Deno.env.get("DB_NAME") || "assignment4a";

if (!MONGODB_URL) {
    console.error(" MONGODB_URL environment variable is required");
    Deno.exit(1);
}

async function clearExistingData(db: any) {
    console.log("\n  Clearing existing test data...");

    await db.collection("users").deleteMany({});
    await db.collection("pending_verifications").deleteMany({});
    await db.collection("listings").deleteMany({});
    await db.collection("bid_logs").deleteMany({});
    await db.collection("threads").deleteMany({});

    console.log(" Cleared all collections\n");
}

async function populateDatabase() {
    const client = new MongoClient(MONGODB_URL!);

    try {
        console.log("🔌 Connecting to MongoDB...");
        await client.connect();
        console.log(" Connected to database:", DB_NAME);

        const db = client.db(DB_NAME);

        // Clear existing data
        await clearExistingData(db);

        // Generate data with Gemini
        const generator = new GeminiTestDataGenerator();
        const { users, listings, bids, messages } = await generator.generateAll();

        console.log("=".repeat(80));
        console.log("\n📥 Populating database...\n");

        // Insert users
        console.log("👥 Inserting users...");
        const userDocs = users.map((user, index) => ({
            _id: new ObjectId(),
            userId: new ObjectId(),
            ...user,
            avatarUrl: null,
            verifiedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
        }));

        await db.collection("users").insertMany(userDocs);
        console.log(` Inserted ${userDocs.length} users\n`);

        // Insert listings
        console.log("  Inserting listings...");
        const listingDocs = listings.map((listing, index) => {
            const seller = userDocs[Math.floor(Math.random() * userDocs.length)];
            const listingId = new ObjectId();
            const createdAt = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000); // Within last 2 weeks

            return {
                _id: new ObjectId(),
                listingId,
                sellerId: seller.userId,
                school: seller.school, // Add school from seller for feed filtering
                title: listing.title,
                description: listing.description,
                photos: [`photo_${index}_1.jpg`, `photo_${index}_2.jpg`],
                tags: listing.tags,
                minAsk: listing.minAsk,
                condition: listing.condition || ["new_with_tags", "pre_owned", "washed"][Math.floor(Math.random() * 3)],
                currentHighBid: null,
                currentHighBidder: null,
                status: "Active",
                createdAt,
                updatedAt: createdAt,
            };
        });

        await db.collection("listings").insertMany(listingDocs);
        console.log(` Inserted ${listingDocs.length} listings\n`);

        // Insert bids
        console.log(" Inserting bids...");
        const bidDocs = [];
        const bidUpdates: Map<number, { amount: number; bidderId: ObjectId }> = new Map();

        for (const bid of bids) {
            if (bid.listingIndex >= listingDocs.length || bid.userIndex >= userDocs.length) {
                continue; // Skip invalid indices
            }

            const listing = listingDocs[bid.listingIndex];
            const bidder = userDocs[bid.userIndex];

            // Don't let sellers bid on their own listings
            if (bidder.userId.equals(listing.sellerId)) {
                continue;
            }

            // Ensure bid meets minimum requirements
            const effectiveMinAsk = listing.minAsk || 1;
            const currentHigh = bidUpdates.get(bid.listingIndex)?.amount || 0;
            const requiredMin = Math.max(effectiveMinAsk, currentHigh + 1);

            if (bid.amount < requiredMin) {
                bid.amount = requiredMin + Math.floor(Math.random() * 10); // Add random increment
            }

            bidDocs.push({
                _id: new ObjectId(),
                listingId: listing.listingId,
                bidder: bidder.userId,
                amount: bid.amount,
                timestamp: new Date(listing.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
            });

            // Track highest bid per listing
            if (!bidUpdates.has(bid.listingIndex) || bid.amount > bidUpdates.get(bid.listingIndex)!.amount) {
                bidUpdates.set(bid.listingIndex, { amount: bid.amount, bidderId: bidder.userId });
            }
        }

        if (bidDocs.length > 0) {
            await db.collection("bid_logs").insertMany(bidDocs);
            console.log(` Inserted ${bidDocs.length} bids\n`);

            // Update listings with highest bids
            console.log("🔄 Updating listings with current high bids...");
            for (const [listingIndex, bidInfo] of bidUpdates.entries()) {
                await db.collection("listings").updateOne(
                    { listingId: listingDocs[listingIndex].listingId },
                    {
                        $set: {
                            currentHighBid: bidInfo.amount,
                            currentHighBidder: bidInfo.bidderId,
                            updatedAt: new Date(),
                        },
                    }
                );
            }
            console.log(` Updated ${bidUpdates.size} listings with high bids\n`);
        } else {
            console.log("  No valid bids to insert\n");
        }

        // Insert message threads
        console.log(" Inserting message threads...");
        const threadMap: Map<string, any> = new Map();

        for (const msg of messages) {
            if (msg.listingIndex >= listingDocs.length ||
                msg.senderIndex >= userDocs.length ||
                msg.receiverIndex >= userDocs.length) {
                continue;
            }

            const listing = listingDocs[msg.listingIndex];
            const sender = userDocs[msg.senderIndex];
            const receiver = userDocs[msg.receiverIndex];

            // Create unique thread key
            const participants = [sender.userId.toString(), receiver.userId.toString()].sort();
            const threadKey = `${listing.listingId}:${participants.join(":")}`;

            if (!threadMap.has(threadKey)) {
                // Create new thread
                threadMap.set(threadKey, {
                    _id: new ObjectId(),
                    threadId: new ObjectId(),
                    listingId: listing.listingId,
                    participants: [sender.userId, receiver.userId],
                    messages: [],
                    pickupComplete: false,
                    createdAt: new Date(listing.createdAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000),
                });
            }

            // Add message to thread
            const thread = threadMap.get(threadKey);
            thread.messages.push({
                sender: sender.userId,
                text: msg.text,
                timestamp: new Date(thread.createdAt.getTime() + thread.messages.length * 60 * 60 * 1000),
                attachments: [],
            });
        }

        const threadDocs = Array.from(threadMap.values());
        if (threadDocs.length > 0) {
            await db.collection("threads").insertMany(threadDocs);
            console.log(` Inserted ${threadDocs.length} message threads\n`);
        } else {
            console.log("  No message threads to insert\n");
        }

        // Mark some transactions as complete
        const completedCount = Math.floor(listingDocs.length * 0.1); // 10% completed
        console.log(` Marking ${completedCount} listings as sold...`);

        for (let i = 0; i < completedCount; i++) {
            const listing = listingDocs[i];
            if (listing.currentHighBidder) {
                await db.collection("listings").updateOne(
                    { listingId: listing.listingId },
                    { $set: { status: "Sold" } }
                );

                // Mark pickup complete for thread if exists
                await db.collection("threads").updateOne(
                    { listingId: listing.listingId },
                    { $set: { pickupComplete: true } }
                );
            }
        }
        console.log(` Marked ${completedCount} listings as sold\n`);

        // Print summary
        console.log("=".repeat(80));
        console.log("\n DATABASE POPULATION SUMMARY\n");
        console.log("=".repeat(80));
        console.log(`\n👥 Users: ${userDocs.length}`);
        console.log(`  Listings: ${listingDocs.length} (${completedCount} sold, ${listingDocs.length - completedCount} active)`);
        console.log(` Bids: ${bidDocs.length}`);
        console.log(` Message Threads: ${threadDocs.length}`);
        console.log(`📩 Total Messages: ${threadDocs.reduce((sum, t) => sum + t.messages.length, 0)}`);

        console.log("\n📈 Sample Statistics:");
        const schoolCounts = userDocs.reduce((acc: any, u) => {
            acc[u.school] = (acc[u.school] || 0) + 1;
            return acc;
        }, {});
        console.log("   Schools:", JSON.stringify(schoolCounts, null, 2));

        const tagCounts = listingDocs.reduce((acc: any, l) => {
            l.tags.forEach((tag: string) => {
                acc[tag] = (acc[tag] || 0) + 1;
            });
            return acc;
        }, {});
        console.log("   Top Tags:", Object.entries(tagCounts)
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, 5)
            .map(([tag, count]) => `${tag}: ${count}`)
            .join(", "));

        console.log("\n Database population complete!\n");

    } catch (error) {
        console.error("\n Error populating database:", error);
        throw error;
    } finally {
        await client.close();
        console.log("🔌 Connection closed.");
    }
}

// Run if executed directly
if (import.meta.main) {
    await populateDatabase();
}
