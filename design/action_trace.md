# Action Trace from Demo

This document contains the console output from the backend server during the
demo recording.

---

## Server Startup

```
 Starting CampusCloset Sync-Enabled Server...
 Registered 6 concepts
 Sync engine initialized

 Route Configuration:
   Included (direct): 24 routes
   Excluded (synced): 4 routes

🔄 Routes with Syncs:
   - Bidding.placeBid
   - ItemListing.createListing
   - MessagingThread.markPickupComplete
   - ItemListing.setStatus

🌐 Server running at http://localhost:8000/api
 Request logging enabled
Listening on http://0.0.0.0:8000/
```

---

## Deployment Logs

### Frontend (Static Site)

- **Platform:** Render
- **Build command:** `npm install; npm run build`
- **Framework:** Vite v5.4.21
- **Modules:** 120 modules transformed
- **Build time:** 2.04s
- **Status:**  Site live at https://swapitfrontend.onrender.com

### Backend (Docker Web Service)

- **Platform:** Render
- **Image:** denoland/deno:latest
- **Dependencies:** mongodb, bcrypt, @google/generative-ai
- **Status:**  Service live at https://swapitbackend.onrender.com

---

## Concepts Registered

| Concept         | Actions                                                        |
| --------------- | -------------------------------------------------------------- |
| UserAccount     | login, signup, verify, getProfile, updateProfile               |
| ItemListing     | createListing, getListing, updateListing, setStatus, getByUser |
| Bidding         | placeBid, acceptBid, withdrawBid, getBidsForListing            |
| MessagingThread | createThread, sendMessage, getThreads, markPickupComplete      |
| Feed            | getFeed, search, filter                                        |
| Requesting      | request logging, audit trail                                   |

---

## Sync Engine Routes

### Included (Direct Pass-through) - 24 routes

Standard concept actions that are directly executed.

### Excluded (Synced) - 4 routes

Actions that trigger synchronizations:

1. `Bidding.placeBid` - Logs bid activity
2. `ItemListing.createListing` - Logs listing creation
3. `MessagingThread.markPickupComplete` - Updates listing status
4. `ItemListing.setStatus` - Logged for audit
