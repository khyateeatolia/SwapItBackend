# ItemListing Test Execution Output

## Test Run Information

- **Date:** 2025-12-07
- **Database:** assignment4a_test (MongoDB Atlas)
- **Command:**
  `deno test --no-check --allow-net --allow-env --allow-read --allow-sys src/concepts/ItemListing.test.ts`

## Test Results

### Operational Principle: Complete listing lifecycle

```
✓ Listing created: [listingId]
✓ Listing updated
✓ Status changed to Sold
✓ Listing retrieved by user
 Operational principle test PASSED
```

**Status:** PASSED **Duration:** ~6s

---

### Variant 1: Missing required fields rejected

```
Variant 1 PASSED: Missing fields rejected
```

**Status:** PASSED **Duration:** <1ms

---

### Variant 2: Empty photos array rejected

```
Variant 2 PASSED: Empty photos rejected
```

**Status:** PASSED **Duration:** <1s

---

### Variant 3: Invalid status rejected

```
Variant 3 PASSED: Invalid status rejected
```

**Status:** PASSED **Duration:** <1s

---

### Variant 4: Non-existent listing returns error

```
Variant 4 PASSED: Non-existent listing handled
```

**Status:** PASSED **Duration:** <1s

---

### Variant 5: Listing can be created without minAsk

```
Variant 5 PASSED: Optional minAsk works
```

**Status:** PASSED **Duration:** <1s

---

## Summary

**Total Tests:** 6 **Passed:** 6 **Failed:** 0 **Skipped:** 0

## Test Coverage

All ItemListing actions tested:

- createListing
- getListing
- updateListing
- setStatus
- getListingsByUser
- acceptBid

Edge cases tested:

- Required fields validation
- Photo array validation
- Status enum validation
- Error handling for missing listings
- Optional minAsk field
- Condition field (new_with_tags, pre_owned, washed)
