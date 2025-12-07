# UserAccount Concept Specification

## Purpose

Manages user authentication, registration, and profile information for the
SwapIt marketplace.

## Operational Principle

After a user requests verification with their email, they receive a token. They
complete registration by providing the token, choosing a username, and setting a
password, after which they can log in and access their profile.

## State

```typescript
users: Set<User>
pending_verifications: Set<PendingVerification>

User = {
  userId: ObjectId
  email: string
  username: string
  displayName: string
  school: string | null
  avatarUrl: string | null
  passwordHash: string
  verifiedAt: Date
}

PendingVerification = {
  email: string
  token: string
  school?: string
  authMethod?: "email" | "sso"
  createdAt: Date
}
```

## Actions

### requestVerification(email: string) → {token: string, alreadyVerified: boolean}

**Purpose:** Initiate email verification for new user registration\
**Preconditions:**

- None (allows anyone to request verification)

**Postconditions:**

- If email not verified: creates pending verification with unique token, sets
  createdAt
- If email already verified: returns alreadyVerified flag with existing user
  info
- Token stored in pending_verifications

**Returns:** `{token: string, alreadyVerified: boolean}`

---

### confirmVerification(token: string, username: string, password: string) → {userId: string}

**Purpose:** Complete registration by verifying token and creating user account\
**Preconditions:**

- Valid token exists in pending_verifications
- Token not expired (within 24 hours)
- Username not already taken
- Password meets minimum length (8 characters)

**Postconditions:**

- Creates new user with userId, email, username, password hash, verified
  timestamp
- Removes pending verification
- Sets school based on email domain if applicable

**Returns:** `{userId: string}`

---

### requestSSOLogin(school: string, email: string) → {ssoToken: string, alreadyVerified: boolean}

**Purpose:** Initiate SSO authentication for school email\
**Preconditions:**

- Valid school selection from supported schools
- Email domain matches school domain

**Postconditions:**

- If email not verified: creates pending verification with SSO token and school
- If email already verified: returns existing user info
- Validates email domain against school requirements

**Returns:** `{ssoToken: string, alreadyVerified: boolean, userId?: string}`

---

### confirmSSOLogin(ssoToken: string, username: string, password: string) → {userId: string, school: string}

**Purpose:** Complete SSO registration\
**Preconditions:**

- Valid SSO token exists
- Token not expired (24 hours)
- Username not taken
- Password meets minimum length (8 characters)

**Postconditions:**

- Creates user with school affiliation and password hash
- Removes pending SSO verification

**Returns:** `{userId: string, school: string}`

---

### loginByEmail(email: string, password: string) → {userId: string, username: string}

**Purpose:** Login for existing verified users\
**Preconditions:**

- User with email exists and is verified
- Password matches stored hash

**Postconditions:**

- None (read-only operation)

**Returns:** `{userId: string, username: string}`

---

### viewProfile(userId: string) → Profile

**Purpose:** Retrieve user profile with their listings\
**Preconditions:**

- User with userId exists

**Postconditions:**

- None (read-only operation)
- Includes user info and all their listings

**Returns:**

```typescript
{
  userId: string
  username: string
  displayName: string
  email: string
  school: string | null
  avatarUrl: string | null
  listings: Listing[]
}
```

---

### lookupUser(userId: string) → User

**Purpose:** Look up basic user information by ID\
**Preconditions:**

- User with userId exists

**Postconditions:**

- None (read-only operation)

**Returns:**

```typescript
{
  userId: string;
  username: string;
  displayName: string;
  school: string | null;
  avatarUrl: string | null;
}
```

---

### updateAvatar(userId: string, avatarUrl: string | null) → void

**Purpose:** Upload, change, or delete user profile avatar\
**Preconditions:**

- User with userId exists
- avatarUrl is a valid URL or null (to delete)

**Postconditions:**

- Updates user's avatarUrl field
- If avatarUrl is null, avatar is removed

**Returns:** `{success: true}`

---

### getSchools() → School[]

**Purpose:** Get list of supported schools for SSO\
**Preconditions:** None

**Postconditions:** None (read-only)

**Returns:**

```typescript
Array<{
  name: string;
  domain: string;
  fullName: string;
}>;
```

## Data Invariants

1. All verified users have unique usernames
2. All verified users have unique emails
3. Pending verifications expire after 24 hours
4. Email domains for SSO users must match their school
5. All users have verifiedAt timestamp
6. Password hashes are stored, never plaintext passwords

## Dependencies

- MongoDB for persistent storage
- Email service (Resend API) for verification emails
- ObjectId generation for unique identifiers
- bcrypt for password hashing
