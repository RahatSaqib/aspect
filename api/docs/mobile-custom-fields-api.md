# Mobile Custom Fields API

Use user/password authentication (bearer token from `POST /api/auth` and refresh) for all requests below.

This document covers **Mobile API** `v4` endpoints used by native clients: **custom fields** and the **sites** list.

## Base Path

All examples use:

```text
$BASE_URL/mobile/api
```

Send the header `api-version: 4` on Mobile API requests unless your client stack adds it automatically.

## GET `/v4/sites`

List sites available to the signed-in user (same access controls as elsewhere in Aspect). Which rows are returned depends on the **`clientType`** used at login (and embedded in the access JWT after login or refresh).

### Client type and list behavior

| `clientType` at login (`POST /api/auth`) | Sites returned |
| ---------------------------------------- | -------------- |
| `reporter_app` (Aspect Mobile)           | Job-assignment sites **plus** additional sites in the user’s state/country for transfers only. Those extra rows use **`onlyForTransfers: true`** (see below). |
| `true_connect` (True Connect app)        | **Only** sites the user has a normal job assignment to. |
| `web`                                    | If a web-issued token is used on this route, **assigned-only** list (no state-wide transfer sites), same as `true_connect`. |

**Legacy access tokens** issued before `clientType` was added to the JWT are treated like **`reporter_app`** for this endpoint (full list including transfer-only rows where applicable).

True Connect and other new apps should send `clientType: "true_connect"` on **login** and **refresh** so the access token carries the correct claim.

### onlyForTransfers (reporter_app only)

- **Meaningful only for `reporter_app`** (and legacy tokens treated as `reporter_app`): distinguishes assigned sites (`false`) from state-wide “transfer only” sites (`true`).
- **For any other client** (`true_connect`, `web`, etc.): the flag is **not used** for behavior. The API still returns the property on every row **only to keep the same JSON shape** as `reporter_app`; clients should **ignore** it (it is always `false` because those clients never receive the transfer-only rows).

### Query parameters

| Parameter        | Type     | Required | Notes |
| ---------------- | -------- | -------- | ----- |
| `type`           | string[] | no       | Site type external ids (e.g. `lab`, `clinic`). Can be repeated or array-shaped per your HTTP client. Defaults to `clinic` and `lab`. |
| `nameContains`   | string   | no       | If present, **at least 3** characters after trim; filters by site name (contains). |
| `modifiedSince`  | string   | no       | ISO 8601 UTC instant; excludes sites where both `createdOn` and `updatedOn` are strictly before this time. |

### Response

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
      "externalId": "SITE-001",
      "sampleRegistrationAllowed": true,
      "onlyForTransfers": false
    }
  ]
}
```

- **`onlyForTransfers`**: see [onlyForTransfers (reporter_app only)](#onlyfortransfers-reporter_app-only) above.

### Example request

```bash
curl "$BASE_URL/mobile/api/v4/sites?type=clinic&type=lab" \
  -H "Authorization: Bearer $TOKEN" \
  -H "api-version: 4"
```

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
- GET /mobile/api/v4/sites with header api-version: 4. True Connect must use clientType true_connect at login/refresh for assigned-only sites; reporter_app keeps the full list where onlyForTransfers distinguishes transfer-only rows. On true_connect/web, onlyForTransfers is always false and is present only for response shape parity—ignore it.
- POST to /mobile/api/v4/custom-fields to create or update entries.
- GET /mobile/api/v4/custom-fields/{externalId} to fetch one entry.
- Reuse the same externalId for all updates to the same local form entry.
- externalId is optional but when present its max length is 36.
- If externalId is omitted, the server matches by originSiteId + sampleExternalId.
- Handle 409 as a sync conflict.
- Handle 404 on GET by externalId as missing remote state.

Use these example payloads exactly as the contract reference.
```
