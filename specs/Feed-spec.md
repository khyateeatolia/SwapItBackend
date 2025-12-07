# Feed Concept Specification

## Purpose

Provides filtered and sorted views of active item listings in the SwapIt
marketplace for buyers to browse and discover items.

## Operational Principle

Users can browse all active listings, filter by tags (categories) or price
range, and sort by different criteria. The feed shows only active listings and
can be paginated for performance.

## State

```typescript
// Feed is a derived view over ItemListing data
// No independent state - reads from listings collection
```

## Actions

### getLatest(limit?: number, filters?: {minPrice?: number, maxPrice?: number}) → Listing[]

**Purpose:** Get the most recent active listings\
**Preconditions:**

- limit is a positive number (default: 20)
- minPrice and maxPrice are positive numbers if provided

**Postconditions:**

- None (read-only operation)
- Returns only listings with status "Active"
- Excludes sold or withdrawn listings
- Sorts by createdAt (newest first)
- Applies price filters if provided

**Returns:** Array of listing objects (limited to specified count)

---

### getByTag(tag: string, limit?: number) → Listing[]

**Purpose:** Get active listings filtered by a specific tag\
**Preconditions:**

- tag is a non-empty string
- limit is a positive number (default: 20)

**Postconditions:**

- None (read-only operation)
- Returns only active listings containing the specified tag
- Sorts by createdAt (newest first)

**Returns:** Array of listing objects

---

### getByPrice(minPrice?: number, maxPrice?: number, limit?: number) → Listing[]

**Purpose:** Get active listings within a price range\
**Preconditions:**

- minPrice and maxPrice are positive numbers if provided
- minPrice <= maxPrice (if both provided)
- limit is a positive number (default: 20)

**Postconditions:**

- None (read-only operation)
- Returns listings where currentHighBid or minAsk falls in range
- If no bids, uses minAsk for comparison
- If bids exist, uses currentHighBid for comparison
- Sorts by createdAt (newest first)

**Returns:** Array of listing objects

---

### search(query: string, limit?: number) → Listing[]

**Purpose:** Search listings by title or description\
**Preconditions:**

- query is a non-empty string
- limit is a positive number (default: 20)

**Postconditions:**

- None (read-only operation)
- Returns active listings matching query in title or description
- Case-insensitive search
- Sorts by relevance, then by createdAt

**Returns:** Array of listing objects

---

### getByMultipleTags(tags: string[], matchAll?: boolean, limit?: number) → Listing[]

**Purpose:** Get listings matching multiple tags\
**Preconditions:**

- tags is a non-empty array
- limit is a positive number (default: 20)

**Postconditions:**

- None (read-only operation)
- If matchAll=true: returns listings containing ALL tags
- If matchAll=false: returns listings containing ANY tag
- Sorts by createdAt (newest first)

**Returns:** Array of listing objects

## Data Invariants

1. Feed only shows listings with status "Active"
2. All returned arrays are sorted (default: newest first)
3. limit parameter is always respected
4. Price filters consider both minAsk and currentHighBid
5. Pagination respects database indices for performance

## Dependencies

- MongoDB for reading listing data
- Reads from listings collection but doesn't modify it
- No direct dependencies on other concepts (pure read operations)

## Notes

- Feed is a "view concept" - it provides different perspectives on ItemListing
  data
- All operations are read-only
- Performance is critical - uses MongoDB aggregation pipeline and indices
- Could be extended to support saved searches and recommendations
