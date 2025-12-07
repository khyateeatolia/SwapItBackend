# Concept Specifications Initial Draft

**Snapshot Date:** 2025-11-24 **Type:** Specification Development

---

## UserAccount Concept

### State

```
users: set ObjectId
email: users → String (one)
username: users → String (one)
passwordHash: users → String (one)
school: users → String (one)
verified: users → Boolean (one)
```

### Actions

- `signup(email, password, username)` - Create new account
- `verify(userId, token)` - Verify email
- `login(email, password)` - Authenticate user
- `getProfile(userId)` - Get user info
- `updateProfile(userId, updates)` - Modify profile

---

## ItemListing Concept

### State

```
listings: set ObjectId
seller: listings → ObjectId (one)
title: listings → String (one)
description: listings → String (one)
price: listings → Number (one)
photos: listings → [String] (one)
status: listings → Enum{Active, Sold, Withdrawn} (one)
```

### Actions

- `createListing(seller, title, desc, price, photos, tags)`
- `getListing(listingId)`
- `updateListing(listingId, updates)`
- `setStatus(listingId, status)`

---

## Interesting Moment

**Discovery:** Initially had `photos` as Base64 strings embedded in document.
This caused massive payload sizes in feed queries.
