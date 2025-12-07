# Requesting Concept Specification

## Purpose

Encapsulates HTTP requests as a concept for logging and sync engine integration.
Tracks all excluded route requests that go through the sync engine.

## Operational Principle

When a request comes in for an excluded route (one that syncs are written on),
the Requesting concept logs it and processes it. This allows syncs to intercept
and respond to specific request patterns.

## State

```typescript
request_logs: Set<RequestLog>

RequestLog = {
  requestId: ObjectId
  path: string           // e.g., "Bidding/placeBid"
  concept: string        // e.g., "Bidding"
  action: string         // e.g., "placeBid"
  userId: string | null
  params: Record<string, unknown>
  timestamp: Date
  type: "excluded_route" | "logged_action"
}
```

## Actions

### request(path: string, actionParams: Record) → {requestId: string}

**Purpose:** Called for excluded routes to log and process the request\
**Preconditions:**

- path is a valid concept/action path string

**Postconditions:**

- Creates new request log entry
- Records path, params, and timestamp
- Sets type to "excluded_route"

**Returns:** `{requestId: string, path: string, received: true}`

---

### log(action: string, concept: string, userId?: string, params: Record) → {requestId: string}

**Purpose:** Log a concept action for sync engine tracking\
**Preconditions:**

- action and concept are non-empty strings

**Postconditions:**

- Creates new log entry with concept, action, userId, and params
- Records timestamp

**Returns:** `{requestId: string}`

---

### getRequests(userId?: string, limit?: number) → RequestLog[]

**Purpose:** Retrieve request logs, optionally filtered by user\
**Preconditions:**

- limit is a positive number (default: 50)

**Postconditions:**

- None (read-only operation)
- Returns logs sorted by timestamp (newest first)

**Returns:** Array of request log objects

## Data Invariants

1. All request logs have unique requestIds
2. All logs have a timestamp
3. path is present for excluded_route types
4. concept and action are present for logged_action types

## Dependencies

- MongoDB for persistent storage
- ObjectId generation for unique identifiers
- Used by sync engine for intercepting and routing requests
