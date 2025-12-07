# ListingCard UI Refinement

**Snapshot Date:** 2025-12-05 **Type:** UI/UX Iteration

---

## Amazon-Style Layout Decision

Reordered for buyer priority:

1. **Price** (most important)
2. **Title**
3. **Category**

## Changes Made

| Change        | From     | To        | Rationale    |
| ------------- | -------- | --------- | ------------ |
| Border radius | 1rem     | 4px       | Sharper look |
| Font          | Default  | Helvetica | Professional |
| Image ratio   | Variable | 1:1       | Consistency  |
| Padding       | 1rem     | 0.5rem    | Compact      |

## 1:1 Aspect Ratio CSS

```css
.photo-container {
  position: relative;
  width: 100%;
  padding-bottom: 100%; /* 1:1 aspect ratio */
}

.photo {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

## Interesting Moment

**User Feedback:** Multiple real-time iterations. Key insight: price visibility
is #1 priority for marketplace users.
