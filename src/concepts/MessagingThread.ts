import { ObjectId } from "npm:mongodb@^6.0.0";
import { getDb } from "../concept-server.ts";

export type Message = {
  sender: string;
  text: string;
  attachments?: string[];
  timestamp: Date;
};

export class MessagingThread {
  async startThread(params: { userId: string; listingId: string }) {
    const { userId, listingId } = params;
    if (!userId || !listingId) {
      throw new Error("userId and listingId are required");
    }

    const db = await getDb();

    // Get listing to find seller
    const listing = await db.collection("listings").findOne({
      listingId: new ObjectId(listingId),
    });

    if (!listing) {
      throw new Error("Listing not found");
    }

    // Get buyer's school
    const buyerUser = await db.collection("users").findOne({
      userId: new ObjectId(userId)
    });

    if (!buyerUser || !buyerUser.school) {
      throw new Error("Buyer must have a school affiliation");
    }

    // Verify buyer is from same school as listing
    if (listing.school !== buyerUser.school) {
      throw new Error(`Can only message about listings from your school (${buyerUser.school})`);
    }

    const sellerId = listing.sellerId.toString();
    const userIdObj = new ObjectId(userId);

    // Check if thread already exists
    const existingThread = await db.collection("threads").findOne({
      listingId: new ObjectId(listingId),
      participants: {
        $all: [userIdObj, new ObjectId(sellerId)],
        $size: 2,
      },
    });

    if (existingThread) {
      return { threadId: existingThread.threadId.toString() };
    }

    // Create new thread
    const threadId = new ObjectId();
    await db.collection("threads").insertOne({
      threadId,
      listingId: new ObjectId(listingId),
      participants: [userIdObj, new ObjectId(sellerId)],
      messages: [],
      pickupComplete: false,
      createdAt: new Date(),
    });

    return { threadId: threadId.toString() };
  }

  async postMessage(params: {
    threadId: string;
    userId: string;
    text: string;
    attachments?: string[];
  }) {
    const { threadId, userId, text, attachments } = params;
    if (!threadId || !userId || !text) {
      throw new Error("threadId, userId, and text are required");
    }

    const db = await getDb();

    // Verify user is participant
    const thread = await db.collection("threads").findOne({
      threadId: new ObjectId(threadId),
    });

    if (!thread) {
      throw new Error("Thread not found");
    }

    const userIdObj = new ObjectId(userId);
    const isParticipant = thread.participants.some(
      (p: ObjectId) => p.toString() === userIdObj.toString()
    );

    if (!isParticipant) {
      throw new Error("User is not a participant in this thread");
    }

    // Add message
    const message: Message = {
      sender: userId,
      text,
      attachments: attachments || [],
      timestamp: new Date(),
    };

    await db.collection("threads").updateOne(
      { threadId: new ObjectId(threadId) },
      { $push: { messages: message } }
    );

    return { success: true };
  }

  async markPickupComplete(params: { threadId: string; userId: string }) {
    const { threadId, userId } = params;
    if (!threadId || !userId) {
      throw new Error("threadId and userId are required");
    }

    const db = await getDb();

    // Verify user is participant and is the seller
    const thread = await db.collection("threads").findOne({
      threadId: new ObjectId(threadId),
    });

    if (!thread) {
      throw new Error("Thread not found");
    }

    const userIdObj = new ObjectId(userId);
    const isParticipant = thread.participants.some(
      (p: ObjectId) => p.toString() === userIdObj.toString()
    );

    if (!isParticipant) {
      throw new Error("User is not a participant in this thread");
    }

    // Get listing to verify seller
    const listing = await db.collection("listings").findOne({
      listingId: thread.listingId,
    });

    if (listing && listing.sellerId.toString() !== userId) {
      throw new Error("Only the seller can mark pickup as complete");
    }

    await db.collection("threads").updateOne(
      { threadId: new ObjectId(threadId) },
      { $set: { pickupComplete: true } }
    );

    return { success: true };
  }

  async getThreadsByListing(params: { listingId: string }) {
    const { listingId } = params;
    if (!listingId) {
      throw new Error("listingId is required");
    }

    const db = await getDb();
    const threads = await db.collection("threads")
      .find({ listingId: new ObjectId(listingId) })
      .sort({ createdAt: -1 })
      .toArray();

    return threads.map((t) => ({
      threadId: t.threadId.toString(),
      listingId: t.listingId.toString(),
      participants: t.participants.map((p: ObjectId) => p.toString()),
      messages: t.messages,
      pickupComplete: t.pickupComplete,
      createdAt: t.createdAt,
    }));
  }

  async getThreadsByUser(params: { userId: string }) {
    const { userId } = params;
    if (!userId) {
      throw new Error("userId is required");
    }

    const db = await getDb();
    const threads = await db.collection("threads")
      .find({ participants: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    return threads.map((t) => ({
      threadId: t.threadId.toString(),
      listingId: t.listingId.toString(),
      participants: t.participants.map((p: ObjectId) => p.toString()),
      messages: t.messages,
      pickupComplete: t.pickupComplete,
      createdAt: t.createdAt,
    }));
  }

  async getThread(params: { threadId: string }) {
    const { threadId } = params;
    if (!threadId) {
      throw new Error("threadId is required");
    }

    const db = await getDb();
    const thread = await db.collection("threads").findOne({
      threadId: new ObjectId(threadId),
    });

    if (!thread) {
      throw new Error("Thread not found");
    }

    return {
      threadId: thread.threadId.toString(),
      listingId: thread.listingId.toString(),
      participants: thread.participants.map((p: ObjectId) => p.toString()),
      messages: thread.messages,
      pickupComplete: thread.pickupComplete,
      createdAt: thread.createdAt,
    };
  }
}


