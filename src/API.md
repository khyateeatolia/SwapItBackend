# SwapIt API Specification

## Base URL

```
http://localhost:8000/api
```

## Request Format

All API requests use POST with JSON body:

```json
{
  "concept": "ConceptName",
  "action": "actionName",
  "params": {
    // action-specific parameters
  }
}
```

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": {/* action-specific data */}
}
```

Or on error:

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## UserAccount Concept

### POST /api/UserAccount/requestVerification

Request email verification token.

**Request:**

```json
{
  "concept": "UserAccount",
  "action": "requestVerification",
  "params": {
    "email": "student@university.edu"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "abc123def456"
  }
}
```

---

### POST /api/UserAccount/confirmVerification

Confirm email verification and create account.

**Request:**

```json
{
  "concept": "UserAccount",
  "action": "confirmVerification",
  "params": {
    "token": "abc123def456",
    "username": "johndoe",
    "password": "SecurePass123"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "student@university.edu",
    "username": "johndoe",
    "displayName": "johndoe"
  }
}
```

**Errors:**

- Invalid verification token
- Username already taken
- Password too short (min 8 characters)

---

### POST /api/UserAccount/loginByEmail

Login with email and password.

**Request:**

```json
{
  "concept": "UserAccount",
  "action": "loginByEmail",
  "params": {
    "email": "student@university.edu",
    "password": "SecurePass123"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "student@university.edu",
    "username": "johndoe",
    "displayName": "johndoe",
    "school": "University Name",
    "avatarUrl": "https://..."
  }
}
```

---

### POST /api/UserAccount/requestSSOLogin

Request SSO login token for school email.

**Request:**

```json
{
  "concept": "UserAccount",
  "action": "requestSSOLogin",
  "params": {
    "email": "student@mit.edu",
    "school": "MIT"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "ssoToken": "sso_xyz789abc",
    "email": "student@mit.edu",
    "school": "MIT"
  }
}
```

---

### POST /api/UserAccount/confirmSSOLogin

Complete SSO registration with username and password.

**Request:**

```json
{
  "concept": "UserAccount",
  "action": "confirmSSOLogin",
  "params": {
    "ssoToken": "sso_xyz789abc",
    "username": "johndoe",
    "password": "SecurePass123"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "student@mit.edu",
    "username": "johndoe",
    "displayName": "johndoe",
    "school": "MIT"
  }
}
```

---

### POST /api/UserAccount/viewProfile

Get user profile with listings.

**Request:**

```json
{
  "concept": "UserAccount",
  "action": "viewProfile",
  "params": {
    "userId": "507f1f77bcf86cd799439011"
  }
}
```

---

### POST /api/UserAccount/updateAvatar

Update user avatar.

**Request:**

```json
{
  "concept": "UserAccount",
  "action": "updateAvatar",
  "params": {
    "userId": "507f1f77bcf86cd799439011",
    "avatarUrl": "https://res.cloudinary.com/..."
  }
}
```

_Pass `null` as avatarUrl to delete/reset avatar._

---

## ItemListing Concept

### POST /api/ItemListing/createListing

Create a new item listing.

**Request:**

```json
{
  "concept": "ItemListing",
  "action": "createListing",
  "params": {
    "seller": "507f1f77bcf86cd799439011",
    "title": "Vintage Denim Jacket",
    "description": "Classic 90s style, size M",
    "photos": ["https://res.cloudinary.com/..."],
    "tags": ["Outerwear", "Vintage"],
    "minAsk": 45,
    "condition": "pre_owned"
  }
}
```

_Condition options: 'new_with_tags', 'pre_owned', 'washed'_

**Response:**

```json
{
  "success": true,
  "data": {
    "listingId": "507f1f77bcf86cd799439012"
  }
}
```

---

### POST /api/ItemListing/getListing

Get listing details.

**Request:**

```json
{
  "concept": "ItemListing",
  "action": "getListing",
  "params": {
    "listingId": "507f1f77bcf86cd799439012"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "listingId": "507f1f77bcf86cd799439012",
    "seller": "507f1f77bcf86cd799439011",
    "school": "MIT",
    "title": "Vintage Denim Jacket",
    "description": "Classic 90s style, size M",
    "photos": ["..."],
    "tags": ["Outerwear", "Vintage"],
    "minAsk": 45,
    "condition": "pre_owned",
    "status": "Active",
    "currentHighestBid": 50,
    "createdAt": "2024-12-01T00:00:00.000Z"
  }
}
```

---

### POST /api/ItemListing/acceptBid

Accept a bid and mark listing as sold.

**Request:**

```json
{
  "concept": "ItemListing",
  "action": "acceptBid",
  "params": {
    "listingId": "507f1f77bcf86cd799439012",
    "bidId": "507f1f77bcf86cd799439014"
  }
}
```

_Note: This automatically sets status to "Sold"._

---

### POST /api/ItemListing/setStatus

Change listing status directly.

**Request:**

```json
{
  "concept": "ItemListing",
  "action": "setStatus",
  "params": {
    "listingId": "507f1f77bcf86cd799439012",
    "status": "Withdrawn"
  }
}
```

_Valid Status Values: "Active", "Sold", "Withdrawn"_

---

## Bidding Concept

### POST /api/Bidding/placeBid

Place a bid on a listing.

**Request:**

```json
{
  "concept": "Bidding",
  "action": "placeBid",
  "params": {
    "bidder": "507f1f77bcf86cd799439013",
    "listingId": "507f1f77bcf86cd799439012",
    "amount": 55
  }
}
```

**Core Rules:**

- Bidder must be from same school
- Bidder cannot be seller (no shill bidding)
- Bid must be >= minimum ask
- **Non-Progressive:** Validation does NOT require bid to be higher than current
  highest (design decision).

---

### POST /api/Bidding/getBids

Get all valid (non-withdrawn) bids for a listing.

**Request:**

```json
{
  "concept": "Bidding",
  "action": "getBids",
  "params": {
    "listingId": "507f1f77bcf86cd799439012"
  }
}
```

---

### POST /api/Bidding/getBidHistory

Get comprehensive bid history including withdrawn bids and user names (for UI).

**Request:**

```json
{
  "concept": "Bidding",
  "action": "getBidHistory",
  "params": {
    "listingId": "507f1f77bcf86cd799439012"
  }
}
```

---

## MessagingThread Concept

### POST /api/MessagingThread/startThread

Start a conversation about a listing.

**Request:**

```json
{
  "concept": "MessagingThread",
  "action": "startThread",
  "params": {
    "userId": "507f1f77bcf86cd799439013", // Buyer initiating
    "listingId": "507f1f77bcf86cd799439012"
  }
}
```

_Returns existing thread ID if one already exists for this buyer-listing pair._

---

### POST /api/MessagingThread/postMessage

Send a message in a thread.

**Request:**

```json
{
  "concept": "MessagingThread",
  "action": "postMessage",
  "params": {
    "threadId": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439013", // Sender
    "text": "Hi! Is this still available?",
    "attachments": []
  }
}
```

---

### POST /api/MessagingThread/markPickupComplete

Mark transaction as complete (seller only).

**Request:**

```json
{
  "concept": "MessagingThread",
  "action": "markPickupComplete",
  "params": {
    "threadId": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439011" // Must be seller
  }
}
```

_Side Effect: Updates listing status to "Sold" via Sync Engine._

---

## Feed Concept

### POST /api/Feed/getLatest

Get latest active listings.

**Request:**

```json
{
  "concept": "Feed",
  "action": "getLatest",
  "params": {
    "limit": 20,
    "filters": {
      "minPrice": 10,
      "maxPrice": 100
    }
  }
}
```

---

### POST /api/Feed/getByTag

Get active listings by a specific tag.

**Request:**

```json
{
  "concept": "Feed",
  "action": "getByTag",
  "params": {
    "tag": "Clothing",
    "limit": 20
  }
}
```

---

### POST /api/Feed/search

Full-text search on title and description.

**Request:**

```json
{
  "concept": "Feed",
  "action": "search",
  "params": {
    "query": "vintage jacket",
    "limit": 20
  }
}
```

---

## Requesting Concept (Sync Engine)

### POST /api/Requesting/log

Log an API request (internal use, mainly triggered by Syncs).

**Request:**

```json
{
  "concept": "Requesting",
  "action": "log",
  "params": {
    "concept": "ItemListing",
    "action": "createListing",
    "userId": "...",
    "params": { "title": "..." }
  }
}
```

### POST /api/Requesting/getRequests

Get logged requests.

**Request:**

```json
{
  "concept": "Requesting",
  "action": "getRequests",
  "params": {
    "userId": "...",
    "limit": 50
  }
}
```
