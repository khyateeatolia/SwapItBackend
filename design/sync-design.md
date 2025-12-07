# Sync Design Documentation

## Overview

ItemListing implements synchronization patterns to coordinate actions across
multiple concepts, ensuring data consistency and proper business logic
execution.

## Implemented Syncs

### 1. AcceptBidAndSell (Direct Integration)

**Action:** `ItemListing.acceptBid` **Logic:**

- Sets `status: "Sold"`
- Sets `currentHighestBid`
- **Note:** Implemented directly in the concept action for atomicity, not via
  Sync Engine.

---

### 2. CompletePickupAndSell

**Trigger:** `MessagingThread.markPickupComplete`\
**Coordinated Actions:**

- `ItemListing.setStatus(listingId, "Sold")`

**Rationale:** When pickup is confirmed, ensure the listing reflects the
completed transaction. This provides redundancy and handles edge cases where
status update might have failed.

**Example Flow:**

```
Seller marks pickup complete in thread #789
→ MessagingThread.markPickupComplete executes
→ Sync engine ensures listing is marked "Sold"
→ Transaction fully recorded
```

---

### 3. LogListingCreation

**Trigger:** `ItemListing.createListing`\
**Coordinated Actions:**

- `Requesting.log(concept, action, userId, params)`

**Rationale:** Track all listing creation events for analytics, auditing, and
debugging. Helps monitor platform usage and detect suspicious activity.

**Example Flow:**

```
User creates new listing
→ ItemListing.createListing executes
→ Sync engine logs the request
→ Request log contains: timestamp, user, listing title
```

---

### 4. LogBidPlacement

**Trigger:** `Bidding.placeBid`\
**Coordinated Actions:**

- `Requesting.log(concept, action, userId, params)`

**Rationale:** Audit trail for all bidding activity. Critical for dispute
resolution and understanding user behavior patterns.

**Example Flow:**

```
User places bid of $50 on listing
→ Bidding.placeBid executes
→ Sync engine logs: bidder, listing, amount
→ Complete bid history maintained
```

---

## Route Configuration

### Included Routes (Direct Pass-Through)

These actions execute without triggering syncs:

**Authentication:**

- `UserAccount.requestVerification`
- `UserAccount.confirmVerification`
- `UserAccount.loginByEmail`
- `UserAccount.requestSSOLogin`
- `UserAccount.confirmSSOLogin`

**Read Operations:**

- `Feed.*` (all feed queries)
- `ItemListing.getListing`
- `ItemListing.getListingsByUser`
- `Bidding.getBids`
- `Bidding.getCurrentHigh`
- `MessagingThread.getThread*`

**Total: 16 included routes**

---

### Excluded Routes (Trigger Syncs)

These actions may trigger coordinated behavior:

- `Bidding.placeBid` → Triggers logging
- `ItemListing.createListing` → Triggers logging
- `MessagingThread.markPickupComplete` → Triggers listing status update
- `ItemListing.setStatus` → Future: could trigger notifications

**Total: 4 excluded routes**

---

## Architecture

### Sync Engine Components

**1. SyncEngine Class** (`src/sync-engine.ts`)

- Maintains reference to all concept instances
- Checks if actions trigger syncs
- Executes coordinated actions in sequence
- Handles errors gracefully (continues on failure)

**2. Sync Definitions** (`src/syncs.ts`)

- Declarative sync rules
- Parameter mapping functions
- Route include/exclude lists

**3. Requesting Concept** (`src/concepts/Requesting.ts`)

- Logs all API requests
- Provides request history
- Timestamp and user tracking

**4. Updated Server** (`src/concept-server.ts`)

- Integrates sync engine
- Executes syncs after successful actions
- Logs sync execution to console

---

## Parameter Mapping

Syncs use mapping functions to translate trigger parameters into included action
parameters:

```typescript
mapParams: ((triggerParams, triggerResult) => ({
  listingId: triggerParams.listingId, // From trigger input
  status: "Sold", // Hardcoded value
}));
```

This allows flexible coordination without tight coupling between concepts.

---

## Error Handling

**Sync Failures Are Non-Fatal:**

- If a sync fails, the original action still succeeds
- Other syncs continue to execute
- Errors are logged but don't break user experience

**Example:**

```
User accepts bid → Success
↳ Sync: Mark listing sold → Fails (network issue)
↳ Sync: Log request → Success

User sees: "Bid accepted" ✓
Admin sees: Error log for failed sync
```

---

## Observability

**Console Logging:**

```
Executing 2 sync(s) for Bidding.placeBid
 ↳ Sync: LogBidPlacement
 ✓ Executed Requesting.log
 ↳ Sync: UpdateHighestBid
 ✓ Executed ItemListing.updateListing
```

**Request Logs:** All synced actions create request log entries with:

- Timestamp
- User ID
- Concept + Action
- Parameters
- Unique request ID

Query logs: `Requesting.getRequests({ userId, limit })`

---

## Testing Syncs

**Manual Testing:**

1. Create listing → Check request logs
2. Place bid → Verify bidder logged
3. Accept bid → Confirm listing marked sold

**Observing Syncs:** Watch server console for sync execution logs showing the
coordination happening in real-time.

---

## Design Rationale

**Why Syncs?**

- **Consistency:** No way to forget to update listing status
- **Auditability:** Automatic logging of important actions
- **Maintainability:** Coordination logic in one place
- **Flexibility:** Easy to add new syncs without changing concepts

**Why This Approach?**

- Declarative sync definitions are clear and reviewable
- Loose coupling preserves concept independence
- Non-fatal failures maintain user experience
- Console logging provides transparency
