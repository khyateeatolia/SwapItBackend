# Bidding Concept - Design Changes

## Changes from Assignment 2

### 1. Non-Progressive Bidding

**Original Design (A2):** Each bid must exceed previous\
**Current Implementation:** Any bid at or above minAsk is allowed

**Rationale:**\
If a higher bidder becomes unresponsive, other interested buyers can still
complete the purchase. This prevents deals from falling through due to ghosting.

**Impact:**

- All bids at or above minAsk are valid
- Seller can choose which bid to accept
- No automatic winner selection

---

### 2. Listing Status Validation

**Original Design (A2):** Could bid on any listing\
**Current Implementation:** Only "Active" listings accept bids

**Rationale:**\
Prevents bids on sold or withdrawn items.

**Validation:**

- Check listing status before accepting bid
- Throw error if listing is not "Active"

---

### 3. Seller Self-Bidding Prevention

**Original Design (A2):** Not specified\
**Current Implementation:** Sellers cannot bid on own listings

**Rationale:**\
Prevents price manipulation and fraud.

**Implementation:**

- Compare bidder ID with listing seller ID
- Reject bid with clear error message

---

### 4. Minimum Ask Enforcement

**Original Design (A2):** Basic bid comparison\
**Current Implementation:** First bid must meet minAsk (if set)

**Rationale:**\
Sellers can set a minimum price floor for their items.

**Logic:**

```
if (minAsk set):
  require: bid >= minAsk
```

---

### 5. School-Based Bidding

**Original Design (A2):** Not specified\
**Current Implementation:** Bidders can only bid on listings from their school

**Rationale:**\
Campus marketplace should be school-specific for safety and convenience.

---

### 6. Bid Sorting

**Original Design (A2):** Not specified\
**Current Implementation:** Descending by amount

**Rationale:**\
Display highest bids first for seller review and bidder transparency.

---

## Implementation Issues Encountered

### Issue 1: Concurrent Bid Handling

**Problem:** Two simultaneous bids might both think they're highest\
**Current Solution:** MongoDB atomic updates\
**Future:** Consider optimistic locking for high-traffic scenarios

### Issue 2: Denormalized Data Sync

**Problem:** Keep listing's currentHighBid in sync\
**Solution:** Update listing collection after each bid\
**Note:** currentHighBid tracks the highest amount, not the "winning" bid

---

## Data Model

```typescript
{
  bidId: ObjectId,
  listingId: ObjectId,
  bidder: ObjectId,
  amount: number,
  timestamp: Date,
  withdrawn: boolean
}
```

---

## Business Rules Enforced

1. **Seller Protection:** Sellers cannot bid on own listings
2. **Buyer Protection:** All bids are visible (transparency)
3. **Minimum Ask:** First bid must meet minAsk if set
4. **Status Safety:** Only active listings accept bids
5. **School Restriction:** Can only bid on same-school listings
6. **Seller Choice:** Seller can accept any valid bid (withdraws listing)

---

## Notes on Withdrawal

- **Listings** can be withdrawn by sellers (status changes to "Withdrawn")
- **Bids** are permanent once placed - they remain in the system
- If a seller accepts a bid, listing status changes to "Sold"

---

## Testing Notes

All actions tested:

- Operational Principle: place bid → getBids → place another bid → seller
  accepts
- Bid below minAsk rejected
- Seller self-bid rejected
- Sold listing bid rejected
- Cross-school bid rejected
- Bids sorted correctly

**Edge Cases Tested:**

- Multiple bidders on same listing
- First bid validation with minAsk
- Bid on inactive listing rejected
