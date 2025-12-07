# Authentication Design: SSO + Password

**Snapshot Date:** 2025-11-26 **Type:** Architecture Decision

---

## Problem

Campus marketplace needs verified students only. How to authenticate?

## Options Considered

| Option        | Pros      | Cons                       |
| ------------- | --------- | -------------------------- |
| Password only | Simple    | Manual verification needed |
| SSO only      | Strongest | Complex IdP integration    |
| **Both**      | Flexible  | More code                  |

## Decision: Implement Both

```typescript
// Password signup
async signup(email: string, password: string, username: string) {
  const hash = await bcrypt.hash(password, 10);
  // ...
}

// SSO signup
async ssoSignup(email: string, ssoToken: string) {
  const school = this.extractSchool(email);
  if (!SUPPORTED_SCHOOLS.includes(school)) {
    throw new Error("School not supported");
  }
  // ...
}
```

## Interesting Moment

**Bug Found:** LLM-generated SSO code didn't validate school domains. Added
allowlist:

```typescript
const SUPPORTED_SCHOOLS = [
  "mit.edu",
  "wellesley.edu",
  "harvard.edu",
  "bu.edu",
  "northeastern.edu",
];
```
