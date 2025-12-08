# SwapIt

A secure, campus-exclusive secondhand fashion marketplace for verified students.

## Live Demo

- **Frontend:** https://swapitfrontend.onrender.com
- **Backend:** https://swapitbackend.onrender.com

---

## Documentation

- [Final Design Document](design/design-decisions.md) - Evolution from A2
  to final design
- [Reflection](design/reflection.md) - Project experience and learnings
- [Action Trace](design/action_trace.md) - Console output from demo
- [Design Decisions](design/design-decisions.md) - Key architectural and UX
  decisions

### Sync Design

- [Sync Design](design/sync-design.md) - Synchronization rules and architecture

---

## Concept Specifications

| Concept         | Specification                         | Design Doc                                 | Test Output                                          |
| --------------- | ------------------------------------- | ------------------------------------------ | ---------------------------------------------------- |
| UserAccount     | [Spec](specs/UserAccount-spec.md)     | [Design](design/UserAccount-design.md)     | [Tests](test-outputs/UserAccount-test-output.md)     |
| ItemListing     | [Spec](specs/ItemListing-spec.md)     | [Design](design/ItemListing-design.md)     | [Tests](test-outputs/ItemListing-test-output.md)     |
| Bidding         | [Spec](specs/Bidding-spec.md)         | [Design](design/Bidding-design.md)         | [Tests](test-outputs/Bidding-test-output.md)         |
| MessagingThread | [Spec](specs/MessagingThread-spec.md) | [Design](design/MessagingThread-design.md) | [Tests](test-outputs/MessagingThread-test-output.md) |
| Feed            | [Spec](specs/Feed-spec.md)            | [Design](design/Feed-design.md)            | [Tests](test-outputs/Feed-test-output.md)            |

---

## API Specification

- [API.md](src/API.md) - Complete API documentation for all concept actions

---

## Quick Start

### Backend

```bash
export MONGODB_URL="your_mongodb_connection_string"
export DB_NAME="table_name"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
deno run --allow-net --allow-env --allow-read --allow-write --allow-sys -c deno.json src/concept-server.ts
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Tech Stack

- **Backend:** Deno + TypeScript + MongoDB Atlas
- **Frontend:** Vue 3 + Pinia + Vue Router + Vite
- **Images:** Cloudinary CDN
- **Deployment:** Render
