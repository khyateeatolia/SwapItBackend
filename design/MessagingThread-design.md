# MessagingThread Concept - Design Changes

### 1. Thread Deduplication

**Original Design (A2):** Allow multiple threads per buyer-listing pair\
**Current Implementation:** One thread per buyer-listing combination

**Rationale:**\
Prevents conversation fragmentation. If thread exists, return existing threadId.

**Implementation:**

- Check for existing thread before creating new one
- Unique constraint: (buyerId, sellerId, listingId)

---

### 2. Participant Restrictions

**Original Design (A2):** Open messaging\
**Current Implementation:** Only buyer and seller can message

**Rationale:**\
Privacy and relevance - conversations should be between interested parties only.

**Validation:**

- Verify sender is in participants array
- Reject messages from non-participants

---

### 3. Thread Queries

**Original Design (A2):** Get thread by ID only\
**Current Implementation:** Multiple query methods

**Actions Added:**

- `getThreadsByUser` - All threads for a participant
- `getThreadsByListing` - All inquiries about a listing

**Use Cases:**

- User's message inbox
- Seller reviews all questions about their item

---

## Implementation Issues Encountered

### Issue 1: Participant Order

**Problem:** [buyer, seller] vs [seller, buyer] affects duplicate detection\
**Solution:** Always store in [buyer, seller] order\
**Impact:** Consistent thread identification

### Issue 2: Thread Creation Race Condition

**Problem:** Two requests might create duplicate threads\
**Solution:** Check-then-insert logic (upsert unnecessary with careful checks)\
**Result:** Effective deduplication for standard usage

### Issue 3: Message Timestamps

**Problem:** Messages need ordering\
**Solution:** Store timestamp with each message\
**Display:** Sort by timestamp ascending (chronological)

### Issue 4: Listing Status Update

**Problem:** Need to update ItemListing when pickup complete\
**Solution:** Delegated to **Sync Engine** (no direct cross-concept write)\
**Justification:** Maintains concept independence (Messaging shouldn't write to
Listing db)

---

## Data Model

```typescript
Thread {
  threadId: ObjectId,
  listingId: ObjectId,
  participants: [ObjectId, ObjectId],  // [buyer, seller]
  messages: Message[],
  createdAt: Date
}

Message {
  sender: ObjectId,
  text: string,
  timestamp: Date,
  attachments: string[]
}
```

---

## Privacy & Security

1. **Authorization:** Only participants can view thread
2. **Message Validation:** Sender must be participant
3. **Immutable Participants:** Cannot add/remove after creation

---

## Testing Notes

All actions tested:

- Operational Principle: start → post → post → markComplete
- Duplicate thread returns existing
- Non-participant cannot post
- Get threads by user
- Get threads by listing
