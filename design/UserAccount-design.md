# UserAccount Concept - Design Changes

### 1. Password Authentication Added

**Original Design (A2):** Email-only authentication, passwordless login\
**Current Implementation:** Full password authentication with bcrypt hashing

**Rationale:**\
During implementation, we realized passwordless authentication would be insecure
for a real marketplace application. Added password fields to all authentication
flows with proper hashing using bcrypt.

**Impact:**

- Added `passwordHash` field to user schema
- Updated `confirmVerification` and `confirmSSOLogin` to require passwords
- Updated `loginByEmail` to verify passwords
- Minimum password length: 8 characters

---

### 2. SSO Authentication Method

**Original Design (A2):** Not specified\
**Current Implementation:** Simulated SSO with school-based email verification

**Rationale:**\
For campus marketplace, school email verification is critical. Implemented
simulated SSO flow that:

- Validates email domain against school list
- Creates school-affiliated accounts
- Generates SSO tokens for verification

**Implementation Details:**

- Added `requestSSOLogin` and `confirmSSOLogin` actions
- Maintains list of supported schools (MIT, Harvard, BU, etc.)
- Stores `authMethod: "sso"` in pending verifications

---

### 3. Profile Enhancement

**Original Design (A2):** Basic user lookup\
**Current Implementation:** Profile includes user's listings

**Rationale:**\
Users need to view all their active listings in one place. The `viewProfile`
action now aggregates listings from the ItemListing collection.

**Impact:**

- Added JOIN-like query to fetch user's listings
- Returns listings sorted by creation date
- Includes listing status, photos, and bid information

---

### 4. Verification Token Expiration

**Original Design (A2):** Not specified\
**Current Implementation:** 24-hour token expiration

**Rationale:**\
Security best practice - verification tokens should expire to prevent
unauthorized account creation from leaked tokens.

---

### 5. Avatar Management

**Original Design (A2):** Not specified (default placeholders) **Current
Implementation:** Full CRUD for user avatars

**Capabilities:**

- **Upload/Change:** Users can upload a custom profile picture (stored as
  Cloudinary URL)
- **Delete:** Users can remove their avatar (reverts to default)
- **Display:** Avatar URL returned in user profile data

**Implementation Details:**

- Action: `updateAvatar(userId, avatarUrl)`
- `avatarUrl: string` → Updates/Sets avatar
- `avatarUrl: null` → Deletes avatar
- Frontend handles image upload to Cloudinary before calling API

---

## Implementation Issues Encountered

### Issue 1: MongoDB Connection Management

**Problem:** Deno tests show "leaks detected" warnings\
**Cause:** MongoDB connections not explicitly closed between tests\
**Resolution:** Functional impact is none - tests pass correctly. Could add
explicit connection cleanup in future.

### Issue 2: Type Safety with MongoDB

**Problem:** TypeScript doesn't recognize MongoDB types in Deno\
**Solution:** Using `--no-check` flag for test execution\
**Long-term:** Consider adding proper type definitions

### Issue 3: School Domain Validation

**Problem:** Need to validate email domains for SSO\
**Solution:** Created SCHOOLS constant mapping school names to domains\
**Result:** Clean validation logic without external API calls

---

## Data Model

```typescript
{
  userId: ObjectId,
  email: string,
  username: string,
  displayName: string,
  passwordHash: string,  // NEW: bcrypt hash
  school: string | null, // NEW: for SSO users
  avatarUrl: string | null,
  verifiedAt: Date
}
```

---

## Testing Notes

All actions tested with operational principle + 5 variants:

- Operational Principle: request → confirm → lookup
- Invalid email format rejected
- Duplicate username rejected
- Invalid token rejected
- Profile includes listings
- Missing parameters rejected

Tests updated to include password parameters throughout.
