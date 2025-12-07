# Sync Engine Configuration

**Snapshot Date:** 2025-12-06 **Type:** Architecture (Assignment 4c)

---

## Route Configuration

### Included (Direct) - 24 Routes

Standard concept actions without sync overhead.

### Excluded (Synced) - 4 Routes

1. **`Bidding.placeBid`** - Logs bid activity
2. **`ItemListing.createListing`** - Logs creation
3. **`MessagingThread.markPickupComplete`** - Updates status
4. **`ItemListing.setStatus`** - Audit trail

## Server Startup

```
 Starting SwapIt Sync-Enabled Server...
 Registered 6 concepts
 Sync engine initialized
 Route Configuration:
   Included (direct): 24 routes
   Excluded (synced): 4 routes
```

## Interesting Moment

**Performance Discovery:** Initially excluded all routes - caused slowdowns.
Changed to include-by-default strategy.
