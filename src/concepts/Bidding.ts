import { ObjectId } from "npm:mongodb@^6.0.0";
import { getDb } from "../concept-server.ts";

export class Bidding {
  async placeBid(params: {
    bidder: string;
    listingId: string;
    amount: number;
  }) {
    const { bidder, listingId, amount } = params;

    if (!bidder || !listingId || !amount) {
      throw new Error("bidder, listingId, and amount are required");
    }

    const db = await getDb();

    // Get listing
    const listing = await db.collection("listings").findOne({
      listingId: new ObjectId(listingId),
    });

    if (!listing) {
      throw new Error("Listing not found");
    }

    // Only allow bidding on Active listings
    if (listing.status !== "Active") {
      throw new Error("Cannot bid on inactive listings");
    }

    // Get bidder's school
    const bidderUser = await db.collection("users").findOne({
      userId: new ObjectId(bidder)
    });

    if (!bidderUser || !bidderUser.school) {
      throw new Error("Bidder must have a school affiliation");
    }

    // Verify bidder is from same school as listing
    if (listing.school !== bidderUser.school) {
      throw new Error(`Can only bid on listings from your school (${bidderUser.school})`);
    }

    // Prevent seller from bidding on own listing
    if (listing.sellerId && listing.sellerId.toString() === bidder) {
      throw new Error("Cannot bid on your own listing");
    }

    // If minAsk is set, bid must be at least minAsk
    if (listing.minAsk && amount < listing.minAsk) {
      throw new Error(`Bid must be at least minimum ask of $${listing.minAsk}`);
    }


    // Note: We no longer require bids to be higher than current high bid.
    // Any bid at or above minAsk is allowed.

    // Create bid
    const bidId = new ObjectId();
    await db.collection("bid_logs").insertOne({
      bidId,
      listingId: new ObjectId(listingId),
      bidder: new ObjectId(bidder),
      amount,
      timestamp: new Date(),
      withdrawn: false,
    });

    // Update listing with current highest bid
    await db.collection("listings").updateOne(
      { listingId: new ObjectId(listingId) },
      { $set: { currentHighestBid: amount, currentHighBidder: new ObjectId(bidder) } }
    );

    return { bidId: bidId.toString() };
  }

  async getBids(params: { listingId: string }) {
    const { listingId } = params;
    if (!listingId) {
      throw new Error("listingId is required");
    }

    const db = await getDb();
    const bids = await db.collection("bid_logs")
      .find({ listingId: new ObjectId(listingId), withdrawn: { $ne: true } })
      .sort({ amount: -1 }) // Sort by amount DESC to get highest first
      .toArray();

    return bids.map((b) => ({
      bidId: b.bidId?.toString() || b._id?.toString() || 'unknown',
      listingId: b.listingId?.toString() || 'unknown',
      bidder: b.bidder?.toString() || 'unknown',
      amount: b.amount,
      timestamp: b.timestamp,
    }));
  }

  async getBidHistory(params: { listingId: string }) {
    const { listingId } = params;
    if (!listingId) {
      throw new Error("listingId is required");
    }

    const db = await getDb();
    
    // Get all bids with bidder info
    const bids = await db.collection("bid_logs")
      .find({ listingId: new ObjectId(listingId), withdrawn: { $ne: true } })
      .sort({ timestamp: -1 }) // Sort by time, newest first
      .toArray();

    // Lookup usernames for each bidder
    const bidHistory = [];
    for (const bid of bids) {
      const user = await db.collection("users").findOne({ userId: bid.bidder });
      bidHistory.push({
        bidId: bid.bidId?.toString() || bid._id?.toString() || 'unknown',
        bidder: bid.bidder?.toString() || 'unknown',
        bidderName: user?.username || "Unknown",
        amount: bid.amount,
        timestamp: bid.timestamp,
      });
    }

    // Get the maximum bid
    const maxBid = bids.length > 0 
      ? Math.max(...bids.map(b => b.amount)) 
      : null;

    return {
      bids: bidHistory,
      maxBid: maxBid,
      totalBids: bids.length
    };
  }

  async getCurrentHigh(params: { listingId: string }) {
    const { listingId } = params;
    if (!listingId) {
      throw new Error("listingId is required");
    }

    const db = await getDb();
    // Get highest bid by amount (not latest)
    const highestBid = await db.collection("bid_logs")
      .findOne(
        { listingId: new ObjectId(listingId), withdrawn: { $ne: true } },
        { sort: { amount: -1 } } // Sort by amount descending
      );

    if (!highestBid) {
      return null;
    }

    return {
      bidId: highestBid.bidId?.toString() || highestBid._id?.toString() || 'unknown',
      bidder: highestBid.bidder?.toString() || 'unknown',
      amount: highestBid.amount,
      timestamp: highestBid.timestamp,
    };
  }
}


