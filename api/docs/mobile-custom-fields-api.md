# Mobile Custom Fields API

Use user/passworld authentication token for all requests.

## Base Path

All examples use:

```text
$BASE_URL/mobile/api
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
Integrate the Mobile Custom Fields API.

Rules:
- Use bearer auth for all requests.
- POST to /mobile/api/v4/custom-fields to create or update entries.
- GET /mobile/api/v4/custom-fields/{externalId} to fetch one entry.
- Reuse the same externalId for all updates to the same local form entry.
- externalId is optional but when present its max length is 36.
- If externalId is omitted, the server matches by originSiteId + sampleExternalId.
- Handle 409 as a sync conflict.
- Handle 404 on GET by externalId as missing remote state.

Use these example payloads exactly as the contract reference.
```
