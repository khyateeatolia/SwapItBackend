# Deployment to Render

**Snapshot Date:** 2025-12-07 **Type:** Deployment

---

## Configuration

### Frontend (Static Site)

| Setting   | Value                          |
| --------- | ------------------------------ |
| Build     | `npm install && npm run build` |
| Directory | `dist`                         |
| Redirect  | `/*` → `/index.html`           |

### Backend (Web Service)

| Setting  | Value                  |
| -------- | ---------------------- |
| Language | Docker                 |
| Image    | `denoland/deno:latest` |

## Environment Variables

- `VITE_API_BASE_URL` - Backend URL
- `MONGODB_URL` - Database
- `CLOUDINARY_*` - Images

## Live URLs

- Frontend: https://swapitfrontend.onrender.com
- Backend: https://swapitbackend.onrender.com
