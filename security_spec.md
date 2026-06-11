# Security Spec for Standings & Participants System

This document outlines the security architecture and invariants for the Cloud Firestore databases in our Standings applet, designed in accordance with the Zero-Trust Security framework.

## 1. Data Invariants

1. **Owner-Only Creation and Identification**:
   - Only validated administrators or authenticated clients can declare write operations on `participants`.
   - Admin audit logs (`logs`) can only be written by registered, authenticated administrative accounts. Users cannot create or spoof logs describing actions of other users.

2. **Immutable Properties**:
   - `createdAt` must be fixed of value. It cannot be altered during subsequent profile modifications.
   - Core ID references once set must not change.

3. **Status Boundaries**:
   - The status field on `Participant` is strictly limited to either `'active'` or `'inactive'`.
   
4. **Data Size Sanitization**:
   - Participant name strings cannot exceed 100 characters.
   - IDs must be alphanumeric and under 128 characters.
   - Fields such as `points`, `wins`, `losses`, `draws`, and `played` must strictly be positive integers.

---

## 2. The "Dirty Dozen" Attack Payloads

These 12 malicious schemas must be rejected, outputting `PERMISSION_DENIED`:

### Payload 1: Privilege Escalation (Self-Appointed Admin)
```json
// Collection: /system/config
// Attack: Standard user attempts to overwrite global settings to set isContestActive = true
{
  "systemName": "Hackers Arena",
  "isContestActive": true,
  "minPoints": 0,
  "maxPoints": 1000000
}
```

### Payload 2: Timestamp Tampering on Create
```json
// Collection: /participants/hacker1
// Attack: Spoofing create timestamp to a historical date in the past
{
  "id": "hacker1",
  "name": "Eve",
  "points": 0,
  "wins": 0,
  "losses": 0,
  "draws": 0,
  "played": 0,
  "status": "active",
  "createdAt": "2020-01-01T00:00:00Z", // Should enforce request.time
  "updatedAt": "2020-01-01T00:00:00Z"
}
```

### Payload 3: Score Poisoning (Negative Scores)
```json
// Collection: /participants/player1
// Attack: Injecting negative point differentials
{
  "points": -100000,
  "wins": -5
}
```

### Payload 4: Invalid Status Injection
```json
// Collection: /participants/player1
// Attack: Changing status to "god-mode"
{
  "status": "god-mode"
}
```

### Payload 5: Denials of Wallet via Name Sizing
```json
// Collection: /participants/player1
// Attack: Injecting a 1MB name string representing structural bloat
{
  "name": "Eve[1,000,000 alphanumeric characters...]"
}
```

### Payload 6: Shadow Update (Injecting Ghost Fields)
```json
// Collection: /participants/player1
// Attack: Setting an unlisted boolean parameter "isAdmin": true
{
  "name": "Cheater",
  "points": 500,
  "isAdmin": true
}
```

### Payload 7: Overwriting Log Files as Another User
```json
// Collection: /logs/log123
// Attack: Creating automated logs using an adminEmail representing an authorized administrator
{
  "id": "log123",
  "adminEmail": "legit-admin@company.com", // Authenticated user is actually user@attacker.com
  "action": "Points Cleared",
  "details": "Nuking logs",
  "timestamp": "2026-06-11T12:00:00Z"
}
```

### Payload 8: Altering Historical Log Entry (Immutability Violation)
```json
// Collection: /logs/log123
// Attack: Updating an admin operation log entry to overwrite details of points adjustment
{
  "details": "No points were updated on this day."
}
```

### Payload 9: Empty/ID Poisoning character strings
```json
// Path: /participants/%0A%0Dhack-carriage-return
// Attack: Path Injection strings to corrupt subcollections
{
  "name": "Legit Name"
}
```

### Payload 10: State Shortcutting - Modifying Games Played Without Recalculating
```json
// Collection: /participants/player2
// Attack: Injecting plays = 100 with wins = 0, draws = 0, losses = 0
{
  "played": 100,
  "wins": 0,
  "losses": 0,
  "draws": 0
}
```

### Payload 11: Attempting Blanket Reads
```json
// Collection: /logs
// Query: Fetching all admin log trails from standard participant view
{}
```

### Payload 12: Bypassing the App and Performing Self-Deletion
```json
// Path: /participants/target-leader
// Attack: Deleting the top-ranking competitor's standings record directly via Client SDK
{}
```

---

## 3. Security Assertions

- Rules are configured under `rules_version = '2'`.
- Default behavior: **Deny-by-default** catchment rule at root.
- Admin status is explicitly queried against a list of verified admins or secured fields.
- Field write controls are strictly wrapped inside action-based helpers utilizing `diff().affectedKeys().hasOnly()`.
