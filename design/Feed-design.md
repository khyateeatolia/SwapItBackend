# Feed Concept - Design Changes

### 1. Concept Classification

**Original Design (A2):** Standard concept with state\
**Current Implementation:** View concept (stateless query layer)

**Rationale:**\
Feed doesn't maintain state - it provides filtered views of ItemListing data.
This is a "derived concept" that aggregates and filters.

**Key Insight:** Not all concepts need independent state. Feed demonstrates the
"view pattern."

---

### 2. Active-Only Filter

**Original Design (A2):** Show all listings\
**Current Implementation:** Only show "Active" status listings

**Rationale:**\
Browse experience should exclude sold/withdrawn items by default.

**Implementation:**

- All query methods filter `status: "Active"`
- Improves UX and performance

---

### 3. Price Filtering Logic

**Original Design (A2):** Filter by minAsk only\
**Current Implementation:** Consider currentHighBid if bids exist

**Rationale:**\
Current price = highest bid if bids exist, otherwise minAsk.

**Logic:**

```
effective_price = listing.currentHighBid || listing.minAsk || 0
filter where: minPrice <= effective_price <= maxPrice
```

---

### 4. Tag Matching Modes

**Original Design (A2):** Single tag filter\
**Current Implementation:** Multiple tags with AND/OR logic

**Rationale:**\
Flexibility in search - user might want:

- ANY tag (union): "Tops OR Dresses"
- ALL tags (intersection): "Tops AND Outerwear"

**Action:** `getByMultipleTags(tags, matchAll)`

---

### 5. Performance Optimization

**Original Design (A2):** Not specified\
**Current Implementation:** MongoDB aggregation pipeline

**Rationale:**\
Feed queries are read-heavy and performance-critical.

**Optimizations:**

- Uses MongoDB $match early in pipeline
- Indexes on status, createdAt, tags
- Default limit of 20 results
- Sort by createdAt descending (newest first)

---

## Implementation Issues Encountered

### Issue 1: Category Consistency

**Problem:** Frontend filter dropdown didn't match database tags\
**Solution:** Standardized to exact categories\
**Categories:** Tops, Bottoms, Outerwear, Shoes, Accessories, Dresses, Clothing

### Issue 2: Empty Result Handling

**Problem:** What to show when no listings match?\
**Solution:** Return empty array (frontend handles empty state)\
**UX:** Frontend shows "No listings found" message

### Issue 3: Pagination

**Problem:** Need to support infinite scroll\
**Current:** Basic limit parameter\
**Future:** Could add offset/cursor pagination for better UX

---

## Concept Independence

**Critical Design Decision:** Feed is intentionally dependent on ItemListing
data structure.

**Justification:**

- Feed is a "reader" concept
- Doesn't modify listings
- No circular dependencies
- Clean separation: ItemListing = writes, Feed = reads

**Alternative Considered:** Make Feed completely independent with its own cache\
**Rejected Because:** Added complexity without benefit for this scale

---

## Data Model

No independent state - queries ItemListing collection with filters:

```typescript
// Example query structure
db.collection("listings").find({
  status: "Active",
  category: { $in: ["Tops"] },
  createdAt: { $lt: cutoffDate },
}).sort({ createdAt: -1 }).limit(20);
```

---

## Testing Notes

All actions tested:

- Operational Principle: getLatest → getByTag → getByPrice
- Sold listings excluded
- Newest first sorting
- Tag filter accuracy
- Price filter with bids
- Limit parameter

**Performance Tests:**

- Tested with 40 listings (reasonable scale)
- All queries execute < 100ms

---
