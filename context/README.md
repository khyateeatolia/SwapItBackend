# Context Directory

This directory contains development snapshots documenting the incremental and
reflective workflow for SwapIt.

## Structure

```
context/
├── snapshots/
│   ├── 2025-11-24/   # Initial concept development
│   ├── 2025-11-26/   # Authentication decisions
│   ├── 2025-11-28/   # Bidding implementation
│   ├── 2025-12-01/   # Performance discoveries
│   ├── 2025-12-03/   # Test data generation
│   ├── 2025-12-05/   # UI refinements
│   ├── 2025-12-06/   # Syncs and branding
│   └── 2025-12-07/   # Deployment and cleanup
└── README.md
```

## Interesting Moments

### 1. Initial Concept Specs (Nov 24)

[concept-specs-initial.md](snapshots/2025-11-24/concept-specs-initial.md)

- Discovery: Base64 photos embedded in documents caused issues

### 2. SSO Authentication Decision (Nov 26)

[auth-sso-decision.md](snapshots/2025-11-26/auth-sso-decision.md)

- Bug: LLM-generated code lacked school domain validation
- Fix: Added SUPPORTED_SCHOOLS allowlist

### 3. Bidding Implementation (Nov 28)

[bidding-implementation.md](snapshots/2025-11-28/bidding-implementation.md)

- Bug: Sellers could bid on own items
- Fix: Added seller validation check

### 4. Feed Performance Fix (Dec 1)

[feed-performance-fix.md](snapshots/2025-12-01/feed-performance-fix.md)

- Problem: 15+ second load times
- Solution: Cloudinary CDN URLs

### 5. Test Data Generation (Dec 3)

[test-data-generation.md](snapshots/2025-12-03/test-data-generation.md)

- AI-generated images via Gemini Imagen

### 6. ListingCard UI Refinement (Dec 5)

[listingcard-refinement.md](snapshots/2025-12-05/listingcard-refinement.md)

- Amazon-style layout prioritizing price

### 7. Sync Engine Setup (Dec 6)

[sync-engine-setup.md](snapshots/2025-12-06/sync-engine-setup.md)

- Performance optimization: include-by-default

### 8. Branding: SwapIt (Dec 6)

[branding-swapit.md](snapshots/2025-12-06/branding-swapit.md)

- Evolution: CampusCloset → thrift.edu → SwapIt

### 9. Render Deployment (Dec 7)

[deployment-render.md](snapshots/2025-12-07/deployment-render.md)

- Docker for backend, Static Site for frontend

### 10. Documentation Cleanup (Dec 7)

[documentation-cleanup.md](snapshots/2025-12-07/documentation-cleanup.md)

- Assignment compliance audit
