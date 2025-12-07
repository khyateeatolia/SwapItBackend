# Bidding Concept Implementation

**Snapshot Date:** 2025-11-28 **Type:** Implementation

---

## Bidding State

```typescript
interface Bid {
  _id: ObjectId;
  listing: ObjectId;
  bidder: ObjectId;
  amount: number;
  timestamp: Date;
  status: "active" | "accepted" | "withdrawn";
}
```

## Key Actions

### placeBid

```typescript
async placeBid(listingId: string, bidderId: string, amount: number) {
  // Validate listing exists and is active
  const listing = await this.listings.findOne({ _id: new ObjectId(listingId) });
  if (!listing || listing.status !== 'Active') {
    throw new Error('Listing not available for bidding');
  }
  
  // Prevent seller from bidding on own item
  if (listing.seller.toString() === bidderId) {
    throw new Error('Cannot bid on your own listing');
  }
  
  // Insert bid
  await this.bids.insertOne({ ... });
}
```

## Interesting Moment

**Test Failure:** Initial implementation allowed sellers to bid on their own
items. Added validation after test exposed this bug.
