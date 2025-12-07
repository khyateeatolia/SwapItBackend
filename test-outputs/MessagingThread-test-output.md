# MessagingThread Test Execution Output

## Test Run Information

- **Date:** 2025-12-07
- **Database:** assignment4a_test (MongoDB Atlas)
- **Command:**
  `deno test --no-check --allow-net --allow-env --allow-read --allow-sys src/concepts/MessagingThread.test.ts`

## Test Results

### Operational Principle: Complete messaging flow

```
✓ Thread started: [threadId]
✓ Message posted
✓ Second message posted
✓ Thread retrieved with messages
 Operational principle test PASSED
```

**Status:** PASSED **Duration:** ~7s

---

### Variant 1: Duplicate thread returns existing

```
Variant 1 PASSED: Duplicate thread handled
```

**Status:** PASSED **Duration:** <1s

---

### Variant 2: Non-participant cannot post

```
Variant 2 PASSED: Non-participant rejected
```

**Status:** PASSED **Duration:** <1s

---

### Variant 3: Retrieve threads by user

```
Variant 3 PASSED: User threads retrieved
```

**Status:** PASSED **Duration:** <1s

---

### Variant 4: Retrieve threads by listing

```
Variant 4 PASSED: Listing threads retrieved
```

**Status:** PASSED **Duration:** <1s

---

### Variant 5: Buyer must be from same school

```
Variant 5 PASSED: Cross-school messaging rejected
```

**Status:** PASSED **Duration:** <1s

---

## Summary

**Total Tests:** 6 **Passed:** 6 **Failed:** 0 **Skipped:** 0

## Test Coverage

All MessagingThread actions tested:

- startThread
- postMessage
- getThread
- getThreadsByUser
- getThreadsByListing

Security & Authorization validated:

- Thread deduplication (check-then-insert)
- Participant-only messaging
- Query by user
- Query by listing
- School-based access restriction
