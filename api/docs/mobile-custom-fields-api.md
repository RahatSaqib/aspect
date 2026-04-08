# Mobile Custom Fields API

Use user/password authentication (bearer token from `POST /api/auth` and refresh) for all requests below.

This document covers **Mobile API** `v4` endpoints used by native clients: **custom fields** and **sites**. The primary site list for **True Connect** is **`/v4/sites/assigned`**; **Aspect Mobile (reporter)** uses **`/v4/sites`**, which adds reporter-specific behavior described in that section.

## Base Path

Paths below are relative to the Mobile API root. In production that is often:

```text
https://{host}/api/mobile/api
```

- **True Connect** → **`GET /api/mobile/api/sites/assigned`** or **`GET /api/mobile/api/v4/sites/assigned`** (primary site list for this app).
- **Reporter app (Aspect Mobile)** → **`GET /api/mobile/api/sites`** or **`GET /api/mobile/api/v4/sites`** (reporter-specific site list; see that section for how it differs).

In docs and curl snippets, `$BASE_URL` means that root (including any `/api` prefix your gateway uses), e.g.:

```text
$BASE_URL = https://{host}/api/mobile/api
```

### How versioning works

- If you send **`api-version: 4`** (recommended), you can call **unversioned** paths: the server rewrites them to **`v4`** internally (e.g. `/sites/assigned` → `/v4/sites/assigned`).
- You can also put **`v4` in the URL** (`.../v4/sites/assigned`, `.../v4/sites`) and still send `api-version: 4` for consistency.

Send the header `api-version: 4` on Mobile API requests unless your client stack adds it automatically.

## GET `/v4/sites/assigned` (True Connect)

Primary **Mobile API** endpoint for listing sites for **True Connect**. Returns sites the signed-in user can access through normal job assignments, with the same access controls as elsewhere in Aspect. Each row includes site id, names, geography, and external id (see JSON below).

### Query parameters

| Parameter        | Type     | Required | Notes |
| ---------------- | -------- | -------- | ----- |
| `type`           | string[] | no       | Site type external ids (e.g. `lab`, `clinic`). Can be repeated or array-shaped per your HTTP client. Defaults to `clinic` and `lab`. |
| `nameContains`   | string   | no       | If present, **at least 3** characters after trim; filters by site name (contains). |
| `modifiedSince`  | string   | no       | ISO 8601 UTC instant; excludes sites where both `createdOn` and `updatedOn` are strictly before this time. |

### Response (`GET /v4/sites/assigned`)

`200` with:

```json
{
  "ok": true,
  "data": [
    {
      "id": 123,
      "name": "Example Clinic",
      "shortName": "EC",
      "state": "Ohio",
      "lga": "",
      "externalId": "SITE-001"
    }
  ]
}
```

### Example request (`GET /v4/sites/assigned`)

Unversioned (typical with gateway `/api` prefix):

```bash
curl "$BASE_URL/sites/assigned?type=clinic&type=lab" \
  -H "Authorization: Bearer $TOKEN" \
  -H "api-version: 4"
```

Explicit `v4` in path:

```bash
curl "$BASE_URL/v4/sites/assigned?type=clinic&type=lab" \
  -H "Authorization: Bearer $TOKEN" \
  -H "api-version: 4"
```

---

## GET `/v4/sites` (reporter app — Aspect Mobile)

**Aspect Mobile** uses this endpoint for **sample registration** and related flows. It is **not** the same contract as **`GET /v4/sites/assigned`**.

### How this endpoint differs from `/v4/sites/assigned`

| | **`GET /v4/sites/assigned`** (True Connect) | **`GET /v4/sites`** (reporter) |
| --- | --- | --- |
| **Rows returned** | Sites from the user’s job assignments | Those sites **plus** additional sites in the user’s state/country that exist only for **transfer** workflows |
| **Payload** | Compact site fields only (see True Connect section) | Same core fields, **plus** reporter-specific booleans documented below |

Reporter-only fields on each row:

- **`sampleRegistrationAllowed`** — whether sample registration is allowed at that site.
- **`onlyForTransfers`** — `false` if the row is a job-assignment site; `true` if it is one of the extra state-wide sites included only for transfers.

### Query parameters

Same filters as **`GET /v4/sites/assigned`**:

| Parameter        | Type     | Required | Notes |
| ---------------- | -------- | -------- | ----- |
| `type`           | string[] | no       | Site type external ids (e.g. `lab`, `clinic`). Can be repeated or array-shaped per your HTTP client. Defaults to `clinic` and `lab`. |
| `nameContains`   | string   | no       | If present, **at least 3** characters after trim; filters by site name (contains). |
| `modifiedSince`  | string   | no       | ISO 8601 UTC instant; excludes sites where both `createdOn` and `updatedOn` are strictly before this time. |

### Response (`GET /v4/sites`, reporter)

`200` with (includes **`sampleRegistrationAllowed`** and **`onlyForTransfers`**):

```json
{
  "ok": true,
  "data": [
    {
      "id": 123,
      "name": "Example Clinic",
      "shortName": "EC",
      "state": "Ohio",
      "lga": "",
      "externalId": "SITE-001",
      "sampleRegistrationAllowed": true,
      "onlyForTransfers": false
    }
  ]
}
```

### Example request (`GET /v4/sites`)

Unversioned (typical with gateway `/api` prefix):

```bash
curl "$BASE_URL/sites?type=clinic&type=lab" \
  -H "Authorization: Bearer $TOKEN" \
  -H "api-version: 4"
```

Explicit `v4` in path:

```bash
curl "$BASE_URL/v4/sites?type=clinic&type=lab" \
  -H "Authorization: Bearer $TOKEN" \
  -H "api-version: 4"
```

### Auth `clientType` (sites)

Send `clientType` on **`POST /api/auth`** and refresh for session length, JWT claims, and tooling — e.g. **`true_connect`** with **`/v4/sites/assigned`**, **`reporter_app`** with **`/v4/sites`**. Use the URL that matches the product.

## POST `/v4/custom-fields`

Create or update a custom-fields entry.

### Request Body

| Field              | Type   | Required | Notes             |
| ------------------ | ------ | -------- | ----------------- |
| `externalId`       | string | no       | Max 36 chars  (suggested guid/ulid)     |
| `sampleExternalId` | string | yes      | Max 80 chars      |
| `originSiteId`     | number | yes      | Integer           |
| `collectedOn`      | string | no       | ISO 8601 datetime |
| `customFieldsData` | array  | yes      | At least 1 item   |

Each `customFieldsData` item has this shape:

| Field                      | Type   | Required | Notes                      |
| -------------------------- | ------ | -------- | -------------------------- |
| `formDefinitionExternalId` | string | yes      | Form identifier            |
| `fields`                   | object | yes      | Free-form key/value object |

### Example Request

```bash
curl -X POST "$BASE_URL/mobile/api/v4/custom-fields" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "sampleExternalId": "SAMPLE-1001",
    "originSiteId": 123,
    "collectedOn": "2026-03-09T10:30:00.000Z",
    "customFieldsData": [
      {
        "formDefinitionExternalId": "ClinicalResponse",
        "fields": {
          "symptoms": "cough",
          "temperature": "37.2"
        }
      }
    ]
  }'
```

### Example Request Without `externalId`

```bash
curl -X POST "$BASE_URL/mobile/api/v4/custom-fields" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sampleExternalId": "SAMPLE-1001",
    "originSiteId": 123,
    "collectedOn": "2026-03-09T10:30:00.000Z",
    "customFieldsData": [
      {
        "formDefinitionExternalId": "ClinicalResponse",
        "fields": {
          "symptoms": "cough"
        }
      }
    ]
  }'
```

### Example Response

```json
{
  "ok": true
}
```

### Example Update After `sampleExternalId` Changes

Reuse the same `externalId` and send the new `sampleExternalId`.

```bash
curl -X POST "$BASE_URL/mobile/api/v4/custom-fields" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "sampleExternalId": "SAMPLE-1001-UPDATED",
    "originSiteId": 123,
    "customFieldsData": [
      {
        "formDefinitionExternalId": "ClinicalResponse",
        "fields": {
          "symptoms": "cough"
        }
      }
    ]
  }'
```

### Example Conflict Response

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "The provided site and sample combination is already linked to a different externalId."
}
```

## GET `/v4/custom-fields/{externalId}`

Fetch one entry by `externalId`.

### Example Request

```bash
curl "$BASE_URL/mobile/api/v4/custom-fields/01ARZ3NDEKTSV4RRFFQ69G5FAV" \
  -H "Authorization: Bearer $TOKEN"
```

### Example Response

```json
{
  "ok": true,
  "data": {
    "id": 55,
    "siteId": 123,
    "resultId": null,
    "sampleExternalId": "SAMPLE-1001",
    "externalId": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "collectedOn": "2026-03-09T10:30:00.000Z",
    "customFieldsData": [
      {
        "formDefinitionExternalId": "ClinicalResponse",
        "fields": {
          "symptoms": "cough",
          "temperature": "37.2"
        }
      }
    ]
  }
}
```

### Example Not Found Response

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "FormData entry not found."
}
```

## GET `/v4/custom-fields?externalIds=...`

Fetch form definitions by external id.

### Example Request

```bash
curl "$BASE_URL/mobile/api/v4/custom-fields?externalIds=ClinicalResponse" \
  -H "Authorization: Bearer $TOKEN"
```

### Example Response

```json
{
  "ok": true,
  "data": [
    {
      "formDefinitionExternalId": "ClinicalResponse",
      "fields": [
        {
          "id": 1,
          "name": "symptoms",
          "title": "Symptoms",
          "fieldType": "string",
          "order": 1,
          "controlType": "text",
          "mandatory": false,
          "validation": null,
          "condition": null,
          "items": null
        }
      ]
    }
  ]
}
```

## Client Rules

- Reuse the same `externalId` for all updates to the same local form entry.
- `externalId` max length is `36`.
- If `externalId` is omitted, the server matches by `originSiteId + sampleExternalId`.
- Treat `409` as a sync conflict and do not silently retry with a different identifier.
- Treat `404` from `GET /v4/custom-fields/{externalId}` as missing remote state.

## Agent Prompt Snippet

Use this snippet with coding agents working on a client integration:

```text
Integrate the Mobile Custom Fields API and related Mobile v4 endpoints.

Rules:
- Use bearer auth for all requests (POST /api/auth with clientType; refresh with same clientType).
- True Connect (primary site list): GET /mobile/api/v4/sites/assigned. Reporter app: GET /mobile/api/v4/sites — wider list and extra reporter-only fields; see doc table vs assigned. Same query filters on both. api-version: 4. true_connect + /sites/assigned; reporter_app + /sites.
- POST to /mobile/api/v4/custom-fields to create or update entries.
- GET /mobile/api/v4/custom-fields/{externalId} to fetch one entry.
- Reuse the same externalId for all updates to the same local form entry.
- externalId is optional but when present its max length is 36.
- If externalId is omitted, the server matches by originSiteId + sampleExternalId.
- Handle 409 as a sync conflict.
- Handle 404 on GET by externalId as missing remote state.

Use these example payloads exactly as the contract reference.
```
