# ItemListing Concept Specification

## Purpose

Manages the creation, modification, and retrieval of item listings in the SwapIt
marketplace.

## Operational Principle

After a seller creates a listing with photos and details, buyers can view it in
the feed. The seller can update the listing details or change its status
(Active/Sold/Withdrawn).

## State

```typescript
listings: Set<Listing>

Listing = {
  listingId: ObjectId
  sellerId: ObjectId
  school: string
  title: string
  description: string
  photos: string[]  // Array of Cloudinary image URLs
  tags: string[]    // Categories (Tops, Bottoms, Shoes, etc.)
  category: string  // Primary category
  condition: "new_with_tags" | "pre_owned" | "washed"
  minAsk: number | null
  currentHighestBid: number | null
  status: "Active" | "Sold" | "Withdrawn"
  createdAt: Date
  updatedAt: Date
}
```

## Actions

### createListing(seller, title, description, photos, tags, minAsk?, condition?) → {listingId: string}

**Purpose:** Create a new item listing\
**Preconditions:**

- seller is a valid user ID with a school affiliation
- title and description are non-empty strings
- description is 100 words or less
- photos array has 1-10 photos
- tags array is provided

**Postconditions:**

- Creates new listing with unique listingId
- Status set to "Active"
- Sets createdAt and updatedAt timestamps
- Stores sellerId, school (from seller), minAsk, condition
- Uploads photos to Cloudinary

**Returns:** `{listingId: string}`

---

### getListing(listingId: string) → Listing

**Purpose:** Retrieve a specific listing by ID\
**Preconditions:**

- listingId exists in listings

**Postconditions:**

- None (read-only operation)

**Returns:** Complete listing object with all fields including createdAt

---

### getListingsByUser(userId: string) → Listing[]

**Purpose:** Get all listings created by a specific user\
**Preconditions:**

- userId is a valid user ID

**Postconditions:**

- None (read-only operation)
- Returns listings sorted by createdAt (newest first)

**Returns:** Array of listing objects

---

### updateListing(listingId: string, fields: Partial<Listing>) → void

**Purpose:** Update listing details (title, description, photos, tags, minAsk)\
**Preconditions:**

- listingId exists
- fields contains valid updateable fields only

**Postconditions:**

- Updates specified fields in the listing
- Cannot update listingId, sellerId, status, or bid-related fields

**Returns:** `{success: true}`

---

### setStatus(listingId: string, status: "Active" | "Sold" | "Withdrawn") → void

**Purpose:** Change the status of a listing\
**Preconditions:**

- listingId exists
- status is one of the valid values

**Postconditions:**

- Updates listing status

**Returns:** `{success: true}`

---

### acceptBid(listingId: string, bidId: string) → void

**Purpose:** Accept a specific bid on a listing\
**Preconditions:**

- listingId exists
- bidId exists and is for this listing

**Postconditions:**

- Updates listing status to "Sold"
- Sets currentHighestBid to accepted bid amount

**Returns:** `{success: true}`

## Data Invariants

1. All listings have unique listingIds
2. All listings have 1-10 photos
3. Status can only be "Active", "Sold", or "Withdrawn"
4. condition can only be "new_with_tags", "pre_owned", or "washed"
5. updatedAt >= createdAt
6. minAsk is null or a positive number
7. All listings have a school affiliation from the seller

## Dependencies

- MongoDB for persistent storage
- Cloudinary for image hosting
- ObjectId generation for unique identifiers
- Relies on UserAccount concept for seller validation
