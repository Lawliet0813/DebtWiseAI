# DebtWise AI Architecture Overview

## High-Level Design

```
┌──────────────────┐     ┌──────────────────┐
│  Mobile Clients  │◀───▶│  RESTful API     │
│ (React Native)   │     │  (Node.js)       │
└──────────────────┘     └──────────────────┘
                                 │
                                 ▼
                       ┌──────────────────┐
                       │  Storage Layer   │
                       │ (JSON in V1,     │
                       │  DB adapter V2)  │
                       └──────────────────┘
```

The backend exposes stateless JSON endpoints; clients authenticate using JWT bearer tokens. The storage layer is abstracted in `services/` to facilitate swapping the JSON file for PostgreSQL or Firestore without modifying business logic.

## Modules

| Module | Responsibilities |
| ------ | ---------------- |
| `algorithms/` | Financial simulations for snowball and avalanche repayment strategies. |
| `services/` | Business logic for authentication, debts, reminders, analytics, and strategy orchestration. |
| `http/router.js` | Lightweight request router with body parsing, route matching, and authentication guard. |
| `routes/` | HTTP endpoint definitions mapping to services. |
| `storage/database.js` | File-backed persistence abstraction used for local development and testing. |
| `utils/` | Shared utilities: JWT signing, PBKDF2 password hashing, validation helpers, and date formatting. |

## Data Model

### Users

```
{
  id: string,
  email: string,
  passwordHash: string,
  name: string,
  income: number,
  expenses: number,
  reminderPreferences: {
    daysBeforeDue: number,
    timeOfDay: "HH:MM"
  },
  membership: "free" | "premium",
  role: "user" | "admin",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Debts

```
{
  id: string,
  userId: string,
  name: string,
  principal: number,
  apr: number,
  minimumPayment: number,
  dueDate: ISODate,
  type: "credit_card" | "loan" | ...,
  balance: number,
  totalPaid: number,
  lastPaymentAt: ISODate | null,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Payments & Reminders

Payments capture `amount`, `paidAt`, and optional notes. Reminders include both system-generated (based on preferences) and user-created events.

## Security Considerations

- PBKDF2 password hashing with per-user salts.
- JWT tokens signed using HMAC-SHA256 with configurable expiration.
- Membership gates (free vs. premium) enforced at service layer.
- Input validation performed by hand-rolled validators to avoid external dependencies.

## Future Extensions

1. **Database Adapter** – Implement repository interfaces for Postgres/Firestore.
2. **Push Notifications** – Integrate APNs/FCM for real-time reminders.
3. **Advanced Analytics** – Add AI-assisted payoff suggestions and PDF export for premium members.
4. **Monitoring & Logging** – Plug into centralized logging (e.g., OpenTelemetry) and health checks.
