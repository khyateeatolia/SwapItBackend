# Feed Performance Issue Discovery

**Snapshot Date:** 2025-12-01 **Type:** Bug Fix / Performance

---

## Problem

Feed page took **15+ seconds** to load with only 10 listings.

## Root Cause

```typescript
// Feed.ts - $project stage
$project: {
  title: 1,
  price: 1,
  photos: 1,  // ← Base64 strings, 500KB+ each!
  category: 1
}
```

## Solution: Cloudinary Migration

```typescript
// Upload to Cloudinary
const uploadResult = await cloudinary.uploader.upload(imageDataUrl, {
  folder: "swapit/listings",
});

// Store URL instead of base64
photos: [uploadResult.secure_url];
```

## Results

| Metric    | Before | After |
| --------- | ------ | ----- |
| Payload   | 10MB   | 50KB  |
| Load time | 15s    | 0.5s  |

## Lesson Learned

Never store binary data as Base64 in MongoDB for frequently-accessed
collections.
