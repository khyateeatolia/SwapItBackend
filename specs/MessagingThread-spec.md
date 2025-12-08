# MessagingThread Concept Specification

## Purpose

Enables communication between buyers and sellers about specific listings through
threaded conversations.

## Operational Principle

After a buyer shows interest in a listing, they can start a conversation thread
with the seller for that listing. Both parties can exchange messages in the thread. 

## State

```typescript
threads: Set<Thread>

Thread = {
  threadId: ObjectId
  listingId: ObjectId
  participants: ObjectId[]  // [buyerId, sellerId]
  messages: Message[]
  pickupComplete: boolean
  createdAt: Date
}

Message = {
  sender: ObjectId
  text: string
  timestamp: Date
}
```

## Actions

### startThread(userId: string, listingId: string) → {threadId: string}

**Purpose:** Start a new conversation thread about a listing\
**Preconditions:**

- listingId exists
- userId is not the listing seller
- No existing thread between this user and seller for this listing

**Postconditions:**

- Creates new thread with unique threadId
- Sets participants to [userId, sellerId]
- Initializes empty messages array
- Sets pickupComplete to false
- Records createdAt timestamp

**Returns:** `{threadId: string}` (or existing threadId if thread already
exists)

---

### postMessage(threadId: string, sender: string, text: string) → void

**Purpose:** Send a message in a thread\
**Preconditions:**

- threadId exists
- sender is one of the thread participants
- text is non-empty

**Postconditions:**

- Appends new message to thread's messages array
- Records sender, text, and timestamp

**Returns:** `{success: true}`

---

### getThread(threadId: string) → Thread

**Purpose:** Retrieve a complete thread with all messages\
**Preconditions:**

- threadId exists

**Postconditions:**

- None (read-only operation)
- Returns thread with messages sorted by timestamp

**Returns:** Complete thread object

---

### getThreadsByUser(userId: string) → Thread[]

**Purpose:** Get all threads where user is a participant\
**Preconditions:**

- userId is valid

**Postconditions:**

- None (read-only operation)
- Returns threads sorted by most recent message

**Returns:** Array of thread objects

---

### getThreadsByListing(listingId: string) → Thread[]

**Purpose:** Get all conversation threads for a specific listing\
**Preconditions:**

- listingId exists

**Postconditions:**

- None (read-only operation)

**Returns:** Array of thread objects for the listing

---

## Data Invariants

1. All threads have unique threadIds
2. Each thread has exactly 2 participants (buyer and seller)
3. Threads are immutable once created (participants cannot change)
4. Only participants can post messages in a thread
5. Messages are ordered by timestamp
6. Each thread is associated with exactly one listing

## Dependencies

- MongoDB for persistent storage
- ObjectId generation for unique identifiers
- Reads listing data (sellerId) but doesn't directly call ItemListing
- Updates listing status when pickup is marked complete
