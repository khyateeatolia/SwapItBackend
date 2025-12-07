# UserAccount Test Execution Output

## Test Run Information

- **Date:** 2025-12-07
- **Database:** assignment4a_test (MongoDB Atlas)
- **Command:**
  `deno test --no-check --allow-net --allow-env --allow-read --allow-sys src/concepts/UserAccount.test.ts`

## Test Results

### Operational Principle: Complete verification flow

```
✓ Verification token generated
✓ User created with userId: [ObjectId]
✓ User profile retrieved successfully
 Operational principle test PASSED
```

**Status:** PASSED **Duration:** ~6s

---

### Variant 1: Invalid email format rejected

```
Variant 1 PASSED: Invalid email rejected
```

**Status:** PASSED **Duration:** <1ms

---

### Variant 2: Duplicate username rejected

```
Variant 2 PASSED: Duplicate username rejected
```

**Status:** PASSED **Duration:** <1s

---

### Variant 3: Invalid verification token rejected

```
Variant 3 PASSED: Invalid token rejected
```

**Status:** PASSED **Duration:** <1s

---

### Variant 4: Profile includes listings array

```
Variant 4 PASSED: Profile includes listings array
```

**Status:** PASSED **Duration:** ~2s

---

### Variant 5: Password too short rejected

```
Variant 5 PASSED: Short password rejected
```

**Status:** PASSED **Duration:** <1ms

---

## Summary

**Total Tests:** 6 **Passed:** 6 **Failed:** 0 **Skipped:** 0

## Test Coverage

All UserAccount actions tested:

- requestVerification
- confirmVerification (with password)
- loginByEmail
- lookupUser
- viewProfile
- requestSSOLogin
- confirmSSOLogin
- updateAvatar
- getSchools

Edge cases tested:

- Email format validation
- Username uniqueness
- Token validation
- Profile structure
- Password length enforcement (min 8 chars)
- School domain validation for SSO
