# SwapIt Design Decisions

This document captures ALL key decisions made during the development of SwapIt,
extracted from development conversations and implementation work.

---

## 1. Branding Decisions

### App Name Evolution

| Date    | Name         | Reason for Change                    |
| ------- | ------------ | ------------------------------------ |
| Initial | CampusCloset | Original concept name                |
| Dec 5   | thrift.edu   | More memorable, playful              |
| Dec 6   | **SwapIt**   | Final name - catchy, action-oriented |

**Decision:** SwapIt was chosen as the final name for its memorable,
action-oriented branding that resonates with college students.

---

## 2. Visual Design System

### Style Evolution

| Phase   | Aesthetic        | Characteristics                                               |
| ------- | ---------------- | ------------------------------------------------------------- |
| Initial | "Boxy" Wireframe | 0px border-radius, 2px solid black borders, uppercase labels  |
| Final   | **Modern Clean** | Rounded corners (4px), consistent padding, refined typography |

### Typography & Colors

- **Font Family:** Inter (Primary), Helvetica (Backup)
- **Primary Color:** Purple (`#6B46C1`)
- **Status Colors:**
  - Active: Green
  - Sold: Gray
  - Withdrawn: Amber
- **Contrast:** WCAG AA Compliant

---

## 3. UI/UX Decisions

### Simplified Navigation (Buy/Sell Focus)

**Original Design:** Complex navigation with multiple sections\
**Current Implementation:** Streamlined to Buy, Sell, and Profile

**Rationale:**

- Users have two primary goals: buying or selling
- Reduced cognitive load with fewer navigation options
- Profile dropdown consolidates secondary actions (Messages, Profile, Logout)
- Clean header keeps focus on core marketplace functionality

### ListingCard Component (Amazon-Style Layout)

| Decision               | Implementation                   | Rationale                                          |
| ---------------------- | -------------------------------- | -------------------------------------------------- |
| **Layout Order**       | Price → Title → Category         | Prioritizes price visibility for marketplace users |
| **Image Aspect Ratio** | 1:1 square                       | Visual consistency across all cards                |
| **Font Family**        | Helvetica                        | Clean, professional aesthetic                      |
| **Border Radius**      | `1rem` → `4px`                   | Sharper, more modern appearance                    |
| **Padding**            | `0.5rem` uniform                 | Tighter, compact cards                             |
| **Seller Display**     | `@username` format               | Social media-familiar pattern                      |
| **Separator**          | Dot (·) between price and seller | Clean visual separation                            |
| **Username Alignment** | `-4px` negative margin           | Optical vertical alignment with price              |

### ListingDetailView

| Decision                  | Implementation                                     | Rationale                                        |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| **Font Consistency**      | Helvetica on title, seller, description            | Match card components                            |
| **Content Positioning**   | `1.5rem` left margin on title/seller/description   | Push content right, but keep bid card full-width |
| **Bid Card Position**     | No left margin                                     | Full-width CTA for prominence                    |
| **Creation Date Display** | Relative formatting (today, yesterday, X days ago) | Human-readable, contextual timing                |

### Price Range Slider (vs Text Boxes)

**Original Design:** Two text input boxes for min/max price\
**Current Implementation:** Dual-handle range slider

**Rationale:**

- More intuitive and visual interaction
- Prevents invalid inputs (min > max)
- Shows price distribution context
- Touch-friendly for mobile users
- Faster to adjust than typing numbers

### Bidding History Overlay

**Original Design:** Navigate to separate page\
**Current Implementation:** Modal overlay on listing detail

**Rationale:**

- Users stay in context while viewing bid history
- Quick glance without losing their place
- Shows bidder names, amounts, and timestamps
- Close overlay to immediately place a bid
- Reduces page navigation friction

### Navigation & Header

| Decision                                     | Rationale                        |
| -------------------------------------------- | -------------------------------- |
| Profile dropdown (Messages, Profile, Logout) | Reduces header clutter           |
| Logo links to /feed                          | Standard home navigation pattern |
| Buy/Sell as main nav items                   | Primary actions prominent        |

### Search & Autocomplete

| Decision                   | Rationale                    |
| -------------------------- | ---------------------------- |
| Regex-based (not semantic) | Simpler, no AI dependencies  |
| 300ms debounce             | Prevents excessive API calls |
| Max 8 suggestions          | Clean UI                     |
| Keyboard navigation        | Accessibility                |

---

## 4. Bidding Design Decisions

### Non-Progressive Bidding

**Original Design:** Each bid must exceed the current highest bid\
**Current Implementation:** Any bid at or above minAsk is valid

**Rationale:**

- Prevents deals from falling through when highest bidder ghosts
- Other interested buyers can still complete purchase
- Seller can choose which bid to accept
- More flexible for real-world scenarios where communication is key

### Bids Are Permanent (No Withdrawal)

**Original Design:** Bidders can withdraw their bids\
**Current Implementation:** Bids cannot be withdrawn

**Rationale:**

- Encourages thoughtful bidding decisions
- Prevents bid manipulation/sniping games
- Sellers can trust bid count reflects genuine interest
- Simpler mental model for users
- Only listings can be withdrawn (by sellers)

---

## 5. Messaging Design Decisions

### Per-Listing Chat Threads

**Original Design:** Single conversation per buyer-seller pair\
**Current Implementation:** Separate thread for each listing

**Rationale:**

- Clear separation of discussions about different items
- No confusion mixing negotiations for multiple listings
- Easy to reference which item is being discussed
- Natural archiving when listing is sold/withdrawn
- Thread tied to listing lifecycle
- **Thread Deduplication:** One thread per buyer-seller-listing triplet

---

## 6. Technical Architecture Decisions

### Backend: Concept-Based Architecture

- **Decision:** Self-contained concept classes (UserAccount, ItemListing,
  Bidding, MessagingThread, Feed, Requesting)
- **Rationale:** Clear separation of concerns, independent testing, loose
  coupling

### Frontend: Vue 3 + Composition API

- **Stack:** Vue 3, Pinia (state), Vue Router, Axios
- **Rationale:** Modern reactive framework, TypeScript support

### Frontend State Management (Pinia)

- **`useAuthStore`**: Manages user session, login/logout, and authentication
  state
- **`useListingStore`**: Caches listings and manages filter state
- **Component State**: Local reactive data for forms and UI toggles

### API Pattern

- **Design:** All calls follow `{concept, action, params}` pattern
- **Rationale:** Consistent interface, easy routing, type-safe

### Database: MongoDB

- **Collections:** users, pending_verifications, listings, bids, bid_logs,
  threads
- **Patterns:** Embedded messages in threads, separate bids with lookup, status
  enums
- **Denormalization:** `currentHighBid` stored in listing to optimize read
  performance

---

## 7. Image Storage & Cloudinary Integration

### Problem: Base64 Images Causing 15+ Second Load Times

| Phase     | Solution               | Performance                   |
| --------- | ---------------------- | ----------------------------- |
| Initial   | Base64 in MongoDB      | 15+ seconds (500KB per image) |
| Quick Fix | Strip photos from feed | 0.5 seconds                   |
| Final     | **Cloudinary URLs**    | Fast CDN delivery             |

### Cloudinary Implementation

**Decision:** Migrated to Cloudinary for image hosting with CDN delivery.

**Implementation Details:**

- Images uploaded during listing creation via Cloudinary Upload API
- Stored as secure HTTPS URLs in MongoDB (not binary data)
- CDN automatically optimizes and caches images globally
- Supports responsive image transformations

**Rationale:** Never store binary data as base64 in MongoDB for
frequently-accessed collections. CDN delivery provides:

- Sub-second image loading worldwide
- Automatic format optimization (WebP when supported)
- Responsive images without server-side processing

---

## 8. AI-Powered Test Data Generation

### Gemini API Integration

**Model Selection:**

- **Text Generation:** `gemini-2.0-flash-exp` - Fast, efficient for JSON
  generation
- **Image Generation:** `imagen-3.0-generate-002` - High-quality product photos

**Efficiency Optimizations:**

1. **Batch Generation:** Generate 5 users per school in single API call
2. **JSON Mode:** Request structured JSON output to minimize parsing
3. **Incremental Saving:** Save progress after each listing (resilient to
   failures)

### Two-Phase Data Generation

**Problem:** Long-running script (200+ images) could fail partway through\
**Solution:** Split into two phases

| Phase | Script                  | Purpose                                  |
| ----- | ----------------------- | ---------------------------------------- |
| 1     | `generate-to-file.ts`   | Generate all data + images, save to JSON |
| 2     | `populate-from-file.ts` | Read JSON, insert into MongoDB           |

**Benefits:**

- Can re-run Phase 2 without regenerating images
- JSON file serves as backup/cache
- Easier debugging of data issues
- Faster iteration when tweaking DB structure

### AI Image Generation Settings

**Prompt Engineering:**

```
Product photo of [item], [category], [angle], college student fashion, 
professional product photography, solid light gray background (#EAEAEA),
centered, clean, no text or watermarks
```

**Key Decisions:**

- **#EAEAEA Background:** Consistent neutral gray for all product photos
- **2 Images per Listing:** Front view + detail/side view
- **Direct Upload:** Generate → Base64 → Cloudinary (no local storage)

### Test Data Volume

| Entity   | Count | Distribution        |
| -------- | ----- | ------------------- |
| Users    | 25    | 5 per school        |
| Listings | 100   | 20 per school       |
| Images   | ~200  | 2 per listing       |
| Bids     | ~124  | On ~60% of listings |

---

## 9. Authentication Decisions

### SSO vs Password

| Factor           | Password      | SSO              |
| ---------------- | ------------- | ---------------- |
| User convenience | Lower         | Higher           |
| Implementation   | Lower         | Higher           |
| Security         | Good (bcrypt) | Best (delegated) |

**Decision:** Implemented both - password-based registration AND SSO for school
emails.

### Multi-Path Authentication

1. **Email Verification**: Standard flow with tokens
2. **SSO Login**: School email validation → token → password
3. **Password Login**: Email + password verification (bcrypt)

### School Domain Validation

- **Decision:** Added `SUPPORTED_SCHOOLS` allowlist
- **Rationale:** LLM initially generated SSO code without proper domain
  validation
- **Schools:** MIT (@mit.edu), Wellesley (@wellesley.edu), Harvard
  (@harvard.edu), BU (@bu.edu), Northeastern (@northeastern.edu)

---

## 10. Sync Engine Decisions

### Route Configuration

| Type              | Count | Purpose                    |
| ----------------- | ----- | -------------------------- |
| Included (direct) | 24    | Standard pass-through      |
| Excluded (synced) | 4     | Cross-concept coordination |

### Synced Routes

1. **Bidding.placeBid** - Logs bid activity
2. **ItemListing.createListing** - Logs listing creation
3. **MessagingThread.markPickupComplete** - Updates listing status
4. **ItemListing.setStatus** - Audit trail

**Optimization Decision:** Changed from exclude-all to include-by-default after
discovering performance issues.

---

## 11. Deployment Decisions

### Platform: Render

| Component | Type        | Configuration                               |
| --------- | ----------- | ------------------------------------------- |
| Frontend  | Static Site | `npm install && npm run build`, dist folder |
| Backend   | Web Service | Docker, denoland/deno image                 |

### Environment Configuration

**Backend (Render Web Service):**

```
MONGODB_URL=mongodb+srv://...
DB_NAME=assignment4a
GEMINI_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Frontend (Render Static Site):**

```
VITE_API_BASE_URL=https://swapitbackend.onrender.com/api
```

### Redirect Rule

- **Rule:** `/*` → `/index.html` (Rewrite)
- **Rationale:** Required for Vue Router SPA routing

---

## 12. Code Quality Decisions

### Emoji Removal

**Decision:** Removed all emojis from source code files\
**Scope:** `.ts`, `.js`, `.vue`, `.md` files\
**Rationale:** Cleaner console output, professional codebase, better
cross-platform compatibility

### Documentation Consistency

**Decision:** All specs must match implementation\
**Actions Taken:**

- Updated all concept specs to reflect actual code
- Added missing concepts (Requesting)
- Renamed all "CampusCloset" references to "SwapIt"

---

## 13. Implementation Challenges & Solutions

### Challenge 1: Seller Field Inconsistency

**Problem:** Feed showing `sellerId: undefined`\
**Root Cause:** Inconsistent naming (`seller` vs `sellerId`) across codebase\
**Solution:** Standardized on `sellerId` across all concepts and interfaces

### Challenge 2: Runtime Compatibility (Bcrypt)

**Problem:** Different hashing packages needed for Deno (backend) vs Node.js
(scripts)\
**Solution:**

- Backend: `deno.land/x/bcrypt`
- Scripts: `bcryptjs` npm package

### Challenge 3: Deno Test Leaks

**Problem:** MongoDB connection leaks in tests\
**Decision:** Accepted warnings as tests pass functionally; likely driver-level
issue

---

## 14. Project Scale (Key Metrics)

- **Concepts:** 6 (User, Listing, Bidding, Messaging, Feed, Requesting)
- **Tests:** 30 (100% action coverage)
- **Database:** 25 users, 100 listings, 124 bids
- **Codebase:** ~4,500 lines

---

## 15. Lessons Learned

**What Worked:**

- **Concept Architecture:** Clean separation made adding features (like
  Requesting) easy
- **Vue Reactivity:** "View pattern" for Feed was simple to implement
- **Cloudinary:** Solved the "base64 blob" performance crisis instantly

**Challenges:**

- **Auth pivots:** Switching from email-only to password+SSO required
  significant refactoring
- **Denormalization:** Storing `currentHighBid` in listings improved read perf
  but complicated writes

---

## 16. Future Considerations

- Real-time messaging (WebSockets)
- Push notifications for bids/messages
- Full-text search with vector embeddings
- Payment integration (Stripe)
- Mobile app (React Native)
- Image moderation (AI-based)
