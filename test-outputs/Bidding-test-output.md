# Bidding Test Execution Output

## Test Run Information

- **Date:** 2025-12-07
- **Database:** assignment4a_test (MongoDB Atlas)
- **Command:**
  `deno test --no-check --allow-net --allow-env --allow-read --allow-sys src/concepts/Bidding.test.ts`

## Test Results

### Operational Principle: Complete bidding flow

```
✓ Bid placed: [bidId]
✓ Current high bid retrieved
✓ All bids retrieved
✓ Second bid placed successfully
 Operational principle test PASSED
```

**Status:** PASSED **Duration:** ~8s

---

### Variant 1: Bid below minAsk rejected

```
Variant 1 PASSED: Bid below minAsk rejected
```

**Status:** PASSED **Duration:** <1s

---

### Variant 2: Seller cannot bid on own listing

```
Variant 2 PASSED: Seller cannot bid on own listing
```

**Status:** PASSED **Duration:** <1s

---

### Variant 3: Cannot bid on sold listing

```
Variant 3 PASSED: Cannot bid on inactive listing
```

**Status:** PASSED **Duration:** <1s

---

### Variant 4: Bidder must be from same school

```
Variant 4 PASSED: Cross-school bidding rejected
```

**Status:** PASSED **Duration:** <1s

---

### Variant 5: Bids returned in descending order

```
Variant 5 PASSED: Bids sorted by amount DESC
```

**Status:** PASSED **Duration:** <1s

---

## Summary

**Total Tests:** 6 **Passed:** 6 **Failed:** 0 **Skipped:** 0

## Test Coverage

All Bidding actions tested:

- placeBid
- getCurrentHigh
- getBids
- getBidHistory

Business rules validated:

- First bid must meet minAsk
- Sellers cannot bid on own listings
- Cannot bid on inactive listings
- Bidders must be from same school as listing
- Non-progressive bidding (any bid >= minAsk allowed)
