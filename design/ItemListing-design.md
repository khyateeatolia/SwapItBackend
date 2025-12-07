# ItemListing Concept - Design Changes

### 1. Photo Storage Strategy

**Original Design (A2):** Base64 encoded strings in database **Current
Implementation:** Cloudinary URLs (CDN)

**Rationale:**

- Images are uploaded to Cloudinary, and only the secure URL is stored in the
  database
- Significantly improves database performance and payload size
- Eliminates 15s+ load times caused by large base64 strings

**Impact:**

- `photos` array stores string URLs
- Frontend renders images from optimized CDN
- Faster page loads and list rendering

---

### 2. Bid Tracking Fields

**Original Design (A2):** Separate bid concept only **Current Implementation:**
Listing stores current highest bid

**Rationale:** Performance optimization - avoid JOINs when displaying listings
in feed. Denormalizes highest bid data.

**Fields Added:**

- `currentHighBid: number | null`
- `currentHighBidder: ObjectId | null`

**Synchronization:** Bidding concept updates these fields when bids are placed.

---

### 3. Status Management

**Original Design (A2):** Boolean flags (sold, withdrawn) **Current
Implementation:** Single status enum

**Rationale:** Cleaner data model with mutually exclusive states.

**Values:**

- `"Active"` - Available for bidding
- `"Sold"` - Transaction complete
- `"Withdrawn"` - Seller removed from marketplace

---

### 4. Tag System

**Original Design (A2):** Free-form tags **Current Implementation:** Predefined
categories

**Rationale:** Marketplace needs consistent filtering. Standardized tags ensure
uniform browse experience.

**Categories:**

- Tops, Bottoms, Outerwear, Shoes, Accessories, Dresses, Clothing

---

### 5. Timestamps

**Original Design (A2):** Only createdAt **Current Implementation:** createdAt +
updatedAt

**Rationale:** Track when listings are modified. Useful for:

- Debugging
- Showing "last updated" to users
- Audit trail

---

### 6. Condition Field

**Original Design (A2):** Not specified **Current Implementation:** Item
condition enum

**Values:**

- `"new_with_tags"` - Brand new, unworn
- `"pre_owned"` - Used but good condition
- `"washed"` - Pre-owned and cleaned

**UI Display:** Condition badge shown on listing detail view.

---

### 7. School Affiliation

**Original Design (A2):** Global marketplace **Current Implementation:**
School-scoped listings

**Rationale:** Campus marketplace should restrict listings/bidding to same
school for local transactions.

**Impact:**

- Listing stores `school` field from seller
- Bidding restricted to users from same school
- Messaging restricted to same-school users

---

### 8. Mark as Sold Action

**Original Design (A2):** Manual status change **Current Implementation:**
`markAsSold` action

**Rationale:** Atomic operation that accepts a specific bid and marks listing as
sold.

**Behavior:**

- Validates bid exists for listing
- Sets status to "Sold"

---

## UI Enhancements

### Listing Detail View

- **Publish Date:** Creation date/time displayed between seller name and chat
  button
- **Chat Button:** White-filled speech bubble icon with "Chat" text
- **Condition Badge:** Visual badge showing item condition
- **Bid History Overlay:** Modal showing all bids with bidder names

### Listing Card (Feed)

- **Amazon-style Layout:** Price prominently displayed first
- **1:1 Aspect Ratio:** Square image containers for consistent grid
- **Status Badge:** Color-coded (Green=Active, Gray=Sold, Yellow=Withdrawn)

---

## Implementation Issues Encountered

### Issue 1: Photo Validation

**Problem:** Empty photos array shouldn't be allowed **Solution:** Added
validation in `createListing` **Test:** Variant 2 verifies this constraint

### Issue 2: Seller ID Type

**Problem:** Sometimes passed as string, stored as ObjectId **Solution:**
Consistent conversion in concept actions **Impact:** Fixed Feed bug where seller
field was undefined

### Issue 3: MinAsk Optional

**Problem:** Not all sellers want minimum bids **Solution:** Made minAsk
optional (null allowed) **Test:** Variant 5 tests this scenario

---

## Data Model

```typescript
{
  listingId: ObjectId,
  sellerId: ObjectId,
  school: string,              // School affiliation
  title: string,
  description: string,
  photos: string[],            // At least 1 required (Cloudinary URLs)
  tags: string[],              // At least 1 required
  condition: "new_with_tags" | "pre_owned" | "washed",
  minAsk: number | null,       // Optional
  currentHighBid: number | null,      // Denormalized from Bidding
  currentHighBidder: ObjectId | null,
  status: "Active" | "Sold" | "Withdrawn",
  createdAt: Date
}
```

---

## Testing Notes

All actions tested:

- Operational Principle: create → get → update → setStatus → getByUser
- Missing fields rejected
- Empty photos rejected
- Invalid status rejected
- Non-existent listing handled
- Optional minAsk works
- Accept bid marks listing as sold

**Test Coverage:** 100% of actions executed in at least one test.
