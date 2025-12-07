import { ObjectId } from "npm:mongodb@^6.0.0";
import { getDb } from "../concept-server.ts";

export class Feed {
  async getLatest(params: {
    school: string;
    n?: number;
    filters?: {
      tags?: string[];
      minPrice?: number;
      maxPrice?: number;
    };
  }) {
    const { school, n = 20, filters = {} } = params;

    if (!school) {
      throw new Error("school is required");
    }

    const db = await getDb();

    // Build aggregation pipeline
    const pipeline: unknown[] = [
      // Match only Active listings from the same school
      { $match: { status: "Active", school } },
    ];

    // Apply tag filter
    if (filters.tags && filters.tags.length > 0) {
      pipeline.push({
        $match: {
          tags: { $in: filters.tags },
        },
      });
    }

    // Join with bids to get current highest bid for price filtering
    pipeline.push({
      $lookup: {
        from: "bids",
        localField: "listingId",
        foreignField: "listingId",
        as: "bids",
      },
    });

    // Calculate current high bid
    pipeline.push({
      $addFields: {
        currentHighBid: {
          $cond: {
            if: { $gt: [{ $size: "$bids" }, 0] },
            then: { $max: "$bids.amount" },
            else: null,
          },
        },
      },
    });

    // Filter by price range (use currentHighBid if exists, otherwise minAsk)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceConditions: Record<string, unknown>[] = [];

      // Use currentHighBid if it exists, otherwise minAsk
      if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
        // Both min and max
        priceConditions.push({
          $or: [
            { $and: [{ currentHighBid: { $ne: null } }, { currentHighBid: { $gte: filters.minPrice, $lte: filters.maxPrice } }] },
            { $and: [{ currentHighBid: null }, { minAsk: { $ne: null } }, { minAsk: { $gte: filters.minPrice, $lte: filters.maxPrice } }] },
            { $and: [{ currentHighBid: null }, { minAsk: null }] }, // No price set, include all
          ],
        });
      } else if (filters.minPrice !== undefined) {
        // Only min
        priceConditions.push({
          $or: [
            { currentHighBid: { $gte: filters.minPrice } },
            { $and: [{ currentHighBid: null }, { minAsk: { $gte: filters.minPrice } }] },
            { $and: [{ currentHighBid: null }, { minAsk: null }] },
          ],
        });
      } else if (filters.maxPrice !== undefined) {
        // Only max
        priceConditions.push({
          $or: [
            { currentHighBid: { $lte: filters.maxPrice } },
            { $and: [{ currentHighBid: null }, { minAsk: { $lte: filters.maxPrice } }] },
            { $and: [{ currentHighBid: null }, { minAsk: null }] },
          ],
        });
      }

      if (priceConditions.length > 0) {
        pipeline.push({ $match: { $and: priceConditions } });
      }
    }

    // Clean up and project final fields - include photos (Cloudinary URLs are small)
    pipeline.push({
      $project: {
        listingId: 1,
        sellerId: 1,
        title: 1,
        description: 1,
        photos: 1, // Include Cloudinary URLs
        tags: 1,
        condition: 1,
        minAsk: 1,
        status: 1,
        createdAt: 1,
        currentHighestBid: "$currentHighBid",
      },
    });

    // Sort by createdAt DESC
    pipeline.push({ $sort: { createdAt: -1 } });

    // Limit results
    pipeline.push({ $limit: n });

    const listings = await db.collection("listings").aggregate(pipeline).toArray();

    return listings.map((l) => ({
      listingId: l.listingId.toString(),
      seller: l.sellerId ? l.sellerId.toString() : null,
      title: l.title,
      description: l.description,
      photos: l.photos || [], // Include Cloudinary URLs
      tags: l.tags,
      condition: l.condition,
      minAsk: l.minAsk,
      status: l.status,
      createdAt: l.createdAt,
      currentHighestBid: l.currentHighestBid,
    }));
  }

  async search(params: { school: string; query: string; n?: number }) {
    const { school, query, n = 20 } = params;

    if (!school) {
      throw new Error("school is required");
    }
    if (!query) {
      throw new Error("query is required");
    }

    const db = await getDb();
    const results = await db.collection("listings")
      .find({
        status: "Active",
        school,
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } },
          { condition: { $regex: query, $options: "i" } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(n)
      .toArray();

    return results.map((l: any) => ({
      listingId: l.listingId.toString(),
      seller: l.sellerId ? l.sellerId.toString() : null,
      school: l.school,
      title: l.title,
      description: l.description,
      photos: l.photos || [], // Include Cloudinary URLs
      tags: l.tags,
      condition: l.condition,
      minAsk: l.minAsk,
      status: l.status,
      createdAt: l.createdAt,
      currentHighestBid: l.currentHighestBid,
    }));
  }

  async getByTag(params: { school: string; tag: string; n?: number }) {
    const { school, tag, n = 20 } = params;

    if (!school) {
      throw new Error("school is required");
    }
    if (!tag) {
      throw new Error("tag is required");
    }

    return this.getLatest({ school, n, filters: { tags: [tag] } });
  }

  async getByPrice(params: {
    school: string;
    minPrice?: number;
    maxPrice?: number;
    n?: number;
  }) {
    const { school, minPrice, maxPrice, n = 20 } = params;

    if (!school) {
      throw new Error("school is required");
    }

    return this.getLatest({
      school,
      n,
      filters: { minPrice, maxPrice },
    });
  }
}
