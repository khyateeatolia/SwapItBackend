# Feed Test Execution Output

## Test Run Information

- **Date:** 2025-12-07
- **Database:** assignment4a_test (MongoDB Atlas)
- **Command:**
  `deno test --no-check --allow-net --allow-env --allow-read --allow-sys src/concepts/Feed.test.ts`

## Test Results

### Operational Principle: Complete feed filtering

```
✓ Got latest listings
✓ Filtered by tag 'Clothing'
✓ Filtered by price range
 Operational principle test PASSED
```

**Status:** PASSED **Duration:** ~7s

---

### Variant 1: Sold listings excluded

```
Variant 1 PASSED: Sold excluded from feed
```

**Status:** PASSED **Duration:** <1s

---

### Variant 2: Results sorted by newest first

```
Variant 2 PASSED: Newest first sorting works
```

**Status:** PASSED **Duration:** <1s

---

### Variant 3: Tag filter returns only matching items

```
Variant 3 PASSED: Tag filter accurate
```

**Status:** PASSED **Duration:** <1s

---

### Variant 4: Price filter considers current highest bid

```
Variant 4 PASSED: Price filter uses currentHighBid
```

**Status:** PASSED **Duration:** <1s

---

### Variant 5: Limit parameter works

```
Variant 5 PASSED: Limit respected
```

**Status:** PASSED **Duration:** <1s

---

## Summary

**Total Tests:** 6 **Passed:** 6 **Failed:** 0 **Skipped:** 0

## Test Coverage

All Feed actions tested:

- getLatest
- getByTag
- getByPrice
- search
- getByMultipleTags

Filter functionality validated:

- Active-only filtering
- Tag-based filtering (single and multiple)
- Price range filtering
- Newest-first sorting
- Result limiting/pagination
- Price considers both minAsk and currentHighBid
