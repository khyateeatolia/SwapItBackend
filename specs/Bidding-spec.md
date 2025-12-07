# Bidding Concept Specification

## Purpose

Manages the bidding process on item listings in the SwapIt marketplace, allowing
buyers to place bids and sellers to track all bids.

## Operational Principle

After a listing is created, buyers can place bids. Any bid at or above the
minimum ask is valid (bids do not need to exceed previous bids). The system
tracks all bids and the seller can accept any bid to complete the sale.

## State

```typescript
bid_logs: Set<Bid>

Bid = {
  bidId: ObjectId
  listingId: ObjectId
  bidder: ObjectId
  amount: number
  timestamp: Date
  withdrawn: boolean
}
```

## Actions

### placeBid(bidder: string, listingId: string, amount: number) → {bidId: string}

**Purpose:** Place a bid on a listing\
**Preconditions:**

- listingId exists and has status "Active"
- bidder is not the listing seller
- bidder is from the same school as the listing
- amount >= minAsk (if minAsk is set)
- amount is a positive number

**Postconditions:**

- Creates new bid with unique bidId
- Sets withdrawn to false
- Records timestamp
- Updates listing's currentHighBid if this is the highest amount

**Returns:** `{bidId: string}`

---

### getBids(listingId: string) → Bid[]

**Purpose:** Retrieve all bids for a listing\
**Preconditions:**

- listingId exists

**Postconditions:**

- None (read-only operation)
- Returns bids sorted by amount (highest first)
- Excludes withdrawn bids

**Returns:** Array of bid objects

---

### getBidHistory(listingId: string) → {bids: Bid[], maxBid: number, totalBids: number}

**Purpose:** Get full bid history with bidder names\
**Preconditions:**

- listingId exists

**Postconditions:**

- None (read-only operation)
- Returns bids with bidder usernames

**Returns:** Object with bids array, max bid amount, and total count

---

### getCurrentHigh(listingId: string) → Bid | null

**Purpose:** Get the current highest bid for a listing\
**Preconditions:**

- listingId exists

**Postconditions:**

- None (read-only operation)

**Returns:** Highest bid or null if no bids

---

## Data Invariants

1. All bids have unique bidIds
2. A bidder cannot bid on their own listing
3. Bids must meet minAsk if set (no minimum otherwise)
4. amount is always a positive number
5. Bids can only be placed on "Active" listings
6. Bidders can only bid on listings from their school
7. Bids are permanent once placed

## Dependencies

- MongoDB for persistent storage
- ObjectId generation for unique identifiers
- Reads listing data (sellerId, status, minAsk, school) but doesn't directly
  call ItemListing

## Notes

- **Progressive bidding is NOT enforced.** Any valid bid is accepted, even if
  lower than existing bids.
- **Bids cannot be withdrawn.** Only listings can be withdrawn by their sellers.
- Seller decides which bid to accept by calling `ItemListing.acceptBid`
