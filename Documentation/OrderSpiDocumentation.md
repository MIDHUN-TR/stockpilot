# Order Creation API

`POST /api/orders`

Creates a new order by atomically validating inventory, calculating prices server-side, and reserving stock across warehouse(s) — all within a single database transaction.

---

## Authentication

A valid `auth_token` cookie (JWT) is required. The user ID is extracted from the token and used as the order owner — it is **never** accepted from the request body.

| Condition | Response |
|---|---|
| Missing `auth_token` cookie | `401 Unauthorized` — `{ "error": "Unauthorized" }` |
| Invalid or expired token | `401 Unauthorized` — `{ "error": "Invalid or expired session" }` |

---

## Rate Limiting

Each authenticated user (`user{id}`) is rate-limited via `orderRateLimiter`.

| Condition | Response |
|---|---|
| Limit exceeded | `429 Too Many Requests` — includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers |

---

## Idempotency

An optional `Idempotency-Key` header can be sent to prevent duplicate orders on retries (e.g. network timeouts, double-clicks).

> **Not yet production-ready.** Currently checks the key against `orderNumber`, which is a placeholder. A dedicated `idempotencyKey @unique` column on the `Order` model is needed.

---

## Request

```
POST /api/orders
Content-Type: application/json
Cookie: auth_token=<jwt>
Idempotency-Key: <optional-client-generated-key>
```

### Body

```json
{
  "customerName": "string",
  "items": [
    {
      "productId": 1,
      "warehouseId": 1,
      "quantity": 2
    }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `customerName` | `string` | Yes | Must be non-empty |
| `items` | `array` | Yes | Minimum 1 item |
| `items[].productId` | `integer` | Yes | Must be positive |
| `items[].warehouseId` | `integer` | Yes | Must be positive |
| `items[].quantity` | `integer` | Yes | Must be positive |

`userId` and `createdById` are **excluded** from the payload by design — the order owner is always derived from the session token.

---

## Success Response

`201 Created`

```json
{
  "message": "Order created successfully",
  "order": {
    "id": 123,
    "orderNumber": "ORD-1234567890-42",
    "customerName": "Jane Doe",
    "totalAmount": "199.98",
    "orderStatus": "Pending",
    "paymentStatus": "Pending",
    "createdAt": "2026-09-14T10:00:00.000Z",
    "items": [
      {
        "id": 1,
        "productId": 5,
        "quantity": 2,
        "unitPrice": "99.99",
        "subtotal": "199.98"
      }
    ]
  }
}
```

Only client-relevant fields are returned via an explicit `select`. Internal fields (stock reservations, `createdById`, warehouse assignments, etc.) are excluded by default.

---

## Error Responses

| Status | Cause | Example |
|---|---|---|
| `400` | Missing or invalid `customerName` | `{ "error": "customerName is required" }` |
| `400` | Empty `items` array | `{ "error": "Order must contain at least one item." }` |
| `400` | Invalid item fields (non-integer, ≤ 0) | `{ "error": "Invalid item data" }` |
| `400` | Product not found | `{ "error": "Product ID 5 does not exist." }` |
| `400` | Inactive or discontinued product | `{ "error": "Product \"X\" is not currently available for order." }` |
| `401` | Missing or invalid session | `{ "error": "Unauthorized" }` |
| `409` | Insufficient stock during reservation | `{ "error": "Insufficient stock for Product ID 5." }` |
| `429` | Rate limit exceeded | `{ "error": "Too many requests..." }` |
| `500` | Transaction timeout (`P2028`) | `{ "error": "Order processing timed out. Please try again." }` |
| `500` | Unhandled server error | `{ "error": "An unexpected error occurred while creating the order." }` |

---

## Business Logic

1. **Authenticate** — verify `auth_token` cookie; reject immediately on failure.
2. **Rate-limit** — enforce per-user limits before any database work.
3. **Validate** — check payload structure and field types.
4. **Check idempotency key** (partial — see note above).
5. **Process items** inside a single DB transaction:
   - **Sort by `productId`** to enforce consistent lock ordering and prevent deadlocks across concurrent requests.
   - Fetch each product; reject if missing or `isActive: false`.
   - **Reserve stock atomically** via conditional SQL:
     ```sql
     UPDATE inventory
     SET "reservedQuantity" = "reservedQuantity" + $quantity
     WHERE "warehouseId" = $warehouseId
       AND "productId" = $productId
       AND ("quantityOnHand" - "reservedQuantity") >= $quantity
     ```
     This eliminates the race condition in a read-then-write approach — two concurrent requests cannot both read stale availability and both succeed.
   - If 0 rows are affected, the item is rejected (inventory row missing or insufficient stock).
   - Pricing comes from `Product.price` in the database, **never** from the client.
6. **Create records** — `Order`, `OrderItem`, and `StockReservation` in the same transaction.
7. **All-or-nothing** — if any item fails, the entire transaction rolls back. No partial orders.

---

## Known Limitations

- **Idempotency key** lacks a dedicated unique DB column — needs a schema migration (`idempotencyKey String @unique` on `Order`) to reliably prevent duplicates.
- **Ambiguous stock error**: the `409` on reservation failure doesn't distinguish "inventory row missing" from "not enough stock." A separate existence check would improve error messages at the cost of an extra query per item.
- **Deadlock scope**: item sorting prevents deadlocks *within this endpoint only*. Any other code path modifying `Inventory.reservedQuantity` (cancellation, cleanup jobs) must follow the same lock ordering and atomic update pattern.
- **No reservation expiry job**: reservations are created with a 30-minute `expiresAt`, but no cleanup process exists to release expired ones — unreleased reservations hold stock indefinitely.
- **`quantityOnHand` unchanged**: by design, it only decreases at fulfillment/shipping via `StockMovement`, not at reservation time.
- **Duplicate items not merged**: sending the same `productId` + `warehouseId` twice creates two separate reservations instead of combining them into one line.