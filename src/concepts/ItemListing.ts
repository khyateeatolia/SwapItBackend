import { ObjectId } from "npm:mongodb@^6.0.0";
import { getDb } from "../concept-server.ts";
import { uploadMultipleToCloudinary } from "../utils/cloudinary.ts";

export type ListingStatus = "Active" | "Sold" | "Withdrawn";

export class ItemListing {
  async createListing(params: {
    seller: string;
    title: string;
    description: string;
    photos: string[];
    tags: string[];
    minAsk?: number;
    condition?: 'new_with_tags' | 'pre_owned' | 'washed';
  }) {
    const { seller, title, description, photos, tags, minAsk, condition } = params;

    if (!seller || !title || !description) {
      throw new Error("seller, title, and description are required");
    }

    if (!Array.isArray(photos) || photos.length === 0) {
      throw new Error("At least one photo is required");
    }

    if (photos.length > 10) {
      throw new Error("Maximum 10 photos allowed");
    }

    // Validate description word count (max 100 words)
    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount > 100) {
      throw new Error("Description must be 100 words or less");
    }

    if (!Array.isArray(tags)) {
      throw new Error("tags must be an array");
    }

    const db = await getDb();

    // Get seller's school
    const sellerUser = await db.collection("users").findOne({
      userId: new ObjectId(seller)
    });

    if (!sellerUser || !sellerUser.school) {
      throw new Error("Seller must have a school affiliation");
    }

    // Upload photos to Cloudinary
    console.log(` Uploading ${photos.length} photos to Cloudinary...`);
    const cloudinaryUrls = await uploadMultipleToCloudinary(photos, "campuscloset/listings");
    console.log(` Uploaded ${cloudinaryUrls.length} photos`);

    const listingId = new ObjectId();

    await db.collection("listings").insertOne({
      listingId,
      sellerId: new ObjectId(seller),
      school: sellerUser.school,
      title,
      description,
      photos: cloudinaryUrls,
      tags,
      condition: condition || 'pre_owned',
      minAsk: minAsk || null,
      status: "Active",
      createdAt: new Date(),
      updatedAt: new Date(),
      currentHighestBid: null,
    });

    return { listingId: listingId.toString() };
  }

  async updateListing(params: {
    listingId: string;
    fields: Partial<{
      title: string;
      description: string;
      photos: string[];
      tags: string[];
      minAsk: number;
    }>;
  }) {
    const { listingId, fields } = params;
    if (!listingId) {
      throw new Error("listingId is required");
    }

    const db = await getDb();
    const updateResult = await db.collection("listings").updateOne(
      { listingId: new ObjectId(listingId) },
      { $set: fields }
    );

    if (updateResult.matchedCount === 0) {
      throw new Error("Listing not found");
    }

    return { success: true };
  }

  async setStatus(params: { listingId: string; status: ListingStatus }) {
    const { listingId, status } = params;
    if (!listingId || !status) {
      throw new Error("listingId and status are required");
    }

    if (!["Active", "Sold", "Withdrawn"].includes(status)) {
      throw new Error("Invalid status");
    }

    const db = await getDb();
    const updateResult = await db.collection("listings").updateOne(
      { listingId: new ObjectId(listingId) },
      { $set: { status } }
    );

    if (updateResult.matchedCount === 0) {
      throw new Error("Listing not found");
    }

    return { success: true };
  }

  async acceptBid(params: { listingId: string; bidId: string }) {
    const { listingId, bidId } = params;
    if (!listingId || !bidId) {
      throw new Error("listingId and bidId are required");
    }

    const db = await getDb();

    // Get the bid
    const bid = await db.collection("bids").findOne({
      bidId: new ObjectId(bidId),
      listingId: new ObjectId(listingId),
    });

    if (!bid) {
      throw new Error("Bid not found");
    }

    // Update listing with accepted bid
    await db.collection("listings").updateOne(
      { listingId: new ObjectId(listingId) },
      {
        $set: {
          status: "Sold",
          currentHighestBid: bid.amount,
        },
      }
    );

    return { success: true };
  }

  async getListingsByUser(params: { userId: string }) {
    const { userId } = params;
    if (!userId) {
      throw new Error("userId is required");
    }

    const db = await getDb();
    const listings = await db.collection("listings")
      .find({ sellerId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      listings: listings.map((l) => ({
        listingId: l.listingId.toString(),
        seller: l.sellerId ? l.sellerId.toString() : null,
        school: l.school,
        title: l.title,
        description: l.description,
        photos: l.photos,
        tags: l.tags,
        minAsk: l.minAsk,
        status: l.status,
      })),
    };
  }

  async getListing(params: { listingId: string }) {
    const { listingId } = params;
    if (!listingId) {
      throw new Error("listingId is required");
    }

    const db = await getDb();
    const listing = await db.collection("listings").findOne({
      listingId: new ObjectId(listingId),
    });

    if (!listing) {
      throw new Error("Listing not found");
    }

    return {
      listingId: listing.listingId.toString(),
      seller: listing.sellerId ? listing.sellerId.toString() : null,
      school: listing.school,
      title: listing.title,
      description: listing.description,
      photos: listing.photos,
      tags: listing.tags,
      minAsk: listing.minAsk,
      condition: listing.condition,
      status: listing.status,
      createdAt: listing.createdAt,
      currentHighestBid: listing.currentHighestBid,
    };
  }
}
