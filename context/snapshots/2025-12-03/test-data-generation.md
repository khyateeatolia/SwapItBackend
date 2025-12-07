# Test Data Generation with AI Images

**Snapshot Date:** 2025-12-03 **Type:** Data Population

---

## Data Volume

| Entity   | Count         | Distribution    |
| -------- | ------------- | --------------- |
| Users    | 25            | 5 per school    |
| Listings | 100+          | 20 per school   |
| Images   | 2 per listing | AI-generated    |
| Bids     | ~60           | 60% of listings |

## Schools

MIT, Wellesley, Harvard, Boston University, Northeastern

## Image Generation with Gemini

```typescript
const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY"));
const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });

const result = await model.generateImages({
  prompt: `Professional product photo of ${category} clothing item`,
  numberOfImages: 2,
});
```

## Interesting Moment

**Token Efficiency:** Initially tried generating all images upfront - exceeded
rate limits. Changed to on-demand generation with batching.
