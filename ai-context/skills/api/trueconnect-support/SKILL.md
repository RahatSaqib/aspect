---
name: trueconnect-support
description: Use when implementing or debugging True Connect (TrueConnect) in the Aspect API — mobile auth, assigned sites, FormData / custom fields, Truenat-result event linking, Result column sync, and Truenat sample-id alignment with the device PatientID field.
---

# True Connect (TrueConnect) — Aspect API

True Connect is a **native mobile client** of Aspect, authenticated like other mobile apps but identified by **`clientType: true_connect`**. It shares most Mobile API v4 routes with **Aspect Mobile (`reporter_app`)**, except the **primary site list**: True Connect must use **`GET …/sites/assigned`** (job-assignment sites only), not **`GET …/sites`** (reporter-only transfer rows and flags).

This skill summarizes **business rules**, **tables**, **workflows**, **endpoints**, and **code locations** so agents can change the feature safely.

---

## Canonical documentation

- **`api/docs/mobile-custom-fields-api.md`** — HTTP contracts for sites, custom fields, versioning, and client rules (conflicts, `externalId`, filters).
- General API patterns: `ai-context/skills/api/use-case-development/SKILL.md`, `ai-context/skills/api/database-handling/SKILL.md`.

---

## Product & auth

### What True Connect is

- Companion app workflow: user signs in with **username/password**, receives **JWT** for **`mobileApi`** strategy, then calls Mobile API routes under the configured **`mobileApiPath`** (commonly **`/mobile/api/`**).
- **`clientTypes.true_connect`** is defined in `api/src/auth/service.js` alongside `reporter_app` and `web`.
- **`mobileClientTypes`** = `[reporter_app, true_connect]` — both get **mobile-only** behaviors (e.g. **`deviceTokenId`** on login/refresh is preserved; for non-mobile `clientType` it is cleared).

### Session / JWT

- Login and refresh: **`POST /api/auth`** (and refresh endpoint) must send **`clientType: "true_connect"`** consistently so tooling, tests, and JWT claims align.
- Contract tests cover **`true_connect`**: refresh token storage, **~30 day** mobile-style expiry, **`clientType`** embedded in JWT (`api/test/auth/auth.spec.js`).
- Mobile routes use strategy **`mobileApi`** and scope **`+mobileApi`**; individual routes add scopes such as **`site`**, **`result:view`**, **`result:edit`** (`api/src/routes.js` → `decorateMobileAPI`).

### Header / URL versioning

- Send **`api-version: 4`** on Mobile API requests. Unversioned paths may be rewritten to **`v4`** internally (`api/src/plugin/apiVersioning.js`).

---

## HTTP surface (Mobile API)

Base path is server-configurable; see `mobileApiPath` in `api/src/server.js`. Paths below are **suffixes** after that root (often `/api/mobile/api` from the gateway’s perspective — see the doc).

### Site list (True Connect–specific)

| Method | Path | Auth scope | Purpose |
|--------|------|------------|---------|
| **GET** | **`/v4/sites/assigned`** | `site` | **Primary** True Connect facility list: **only sites from the user’s job assignments**, same filters as reporter list. Compact rows: `id`, `name`, `shortName`, `state`, `lga`, `externalId` — **no** `sampleRegistrationAllowed` / `onlyForTransfers`. |

Implementation: `api/src/mobileApi/site/endpoints.js` (route registered **before** `/v4/sites`), handler `listSitesAssigned` → `getSitesMobileAssignedSimple` (`api/src/mobileApi/site/listSites/listSitesAssigned.js`, `api/src/mobileApi/site/listSites/db.js`). Query uses **`getSitesQuery`** + constraints (`addConstraints` / partner), optional **`type`** (site type external ids, default clinic+lab), **`nameContains`** (min 3 chars in validation), **`modifiedSince`**.

### Shared with Aspect Mobile (also used by True Connect)

| Method | Path | Auth scope | Notes |
|--------|------|------------|-------|
| GET | `/v4/custom-fields` | `result:view` | Form definitions / field metadata; optional query: `externalIds`, `assay`, `disease`, `deviceType`. |
| GET | `/v4/custom-fields/{externalId}` | `result:view` | Single **FormData** by `externalId` (must be visible via site constraints). |
| GET | `/v4/custom-fields/form-data` | `result:view` | Lists **FormData** rows where **`createdBy`** = current user id; optional `siteId`, `modifiedDays`. |
| POST | `/v4/custom-fields` | `result:edit` | Upsert **FormData** (body: `originSiteId`, `sampleExternalId`, `customFieldsData`, optional `externalId`, `collectedOn`). |

Definitions: `api/src/mobileApi/customFields/endpoints.js`.  
**Do not** point True Connect product flows at **`GET /v4/sites`** unless you intentionally want reporter semantics (transfer-only sites + extra booleans).

---

## Reporter vs True Connect (business rule)

| Topic | True Connect | Reporter (`reporter_app`) |
|--------|----------------|---------------------------|
| Primary site endpoint | **`GET /v4/sites/assigned`** | **`GET /v4/sites`** |
| Site rows | Assigned jobs only | Assigned + **state/country** sites for **transfers** only |
| Payload | Compact | Adds **`sampleRegistrationAllowed`**, **`onlyForTransfers`** |
| `clientType` on auth | **`true_connect`** | **`reporter_app`** |

---

## Domain model: `FormData` and `Result`

### Table: `FormData`

Created/adapted for True Connect–style payloads in migration **`api/migrations/20260128160813_adapt_formdata_to_trueconnect.js`** (and `externalId` guarded add in **`api/migrations/20260309120000_add_external_id_to_formdata.js`**).

| Column | Role |
|--------|------|
| `id` | Primary key |
| `siteId` | FK → **Site** (origin site for the form) |
| `resultId` | FK → **Result**, nullable until linked |
| `sampleExternalId` | Matches **Sample.externalId** for the same run (normalized/trimmed in app code). For **Truenat**, that value comes from the device **PatientID** / **PatientName** path — see [Truenat uploads and the True Connect sample id](#truenat-device-uploads-and-the-true-connect-sample-id). |
| `externalId` | Optional client id (max **36** chars); unique match key with partner |
| `data` | JSON — persisted object includes **`customFieldsData`** (array of `{ formDefinitionExternalId, fields }`) |
| `collectedOn` | Optional |
| Audit | `createdOn`, `createdBy`, `updatedOn`, `updatedBy` |

**Constraint:** unique **`(siteId, sampleExternalId)`** — one FormData row per site + sample external id pair.

Related tables in workflows: **`Site`**, **`Sample`**, **`Result`**, **`Assay`**, **`AssayType`**, **`Geography`**, **`Country`**, partner-scoped **form definitions** (via `forms` module / `FormDefinition`).

---

## Truenat device uploads and the True Connect sample id

**True Connect** users enter a **sample id** in the app when saving **FormData**; that string is stored as **`sampleExternalId`** for the chosen **`originSiteId`** (site). The API links **FormData** to **Result** rows by **`siteId` + `sampleExternalId`**, resolving the **Sample** attached to the result (`Sample.externalId` must match).

**Truenat** results arrive through the device raw pipeline, not the mobile API. The Truenat instrument does **not** expose a dedicated sample-barcode field to Aspect in the usual payload: the integration uses **`PatientID`**, and if that is empty **`PatientName`**, as the only stable per-run token available for **`Sample.externalId`** (`api/src/deviceApiRaw/dataProcessors/truenatDevice/result.js`, `generateSampleExternalId`).

**Operational contract**

- The **same string** the user typed in True Connect as **`sampleExternalId`** must be sent on the device as **`PatientID`** (recommended) so **`Sample.externalId`** matches after upload.
- Sites/labs treat **`PatientID`** as a **workflow sample identifier** (for example `567` or `TR-344`), not necessarily a demographic patient id.
- **Uniqueness** of that value **for a given device + site** (so concurrent runs do not collide on one **Sample** row) is a **process responsibility** on the customer side; Aspect does not mint a composite device key for Truenat uploads.

**How Aspect picks “the” result / form**

- **Upsert** (`selectCandidateResultIdForSiteAndSample` in `api/src/mobileApi/customFields/upsertFormData.js`): among results for the same **`siteId`** and **`Sample.externalId`**, excluding results already tied to another **FormData** **`resultId`**, load **all** such candidates and pick the one whose **`Result.startedOn`** is **closest in time** to this row’s **`FormData.collectedOn`** (from the upsert payload when present, otherwise the stored row). If **`collectedOn`** is missing/invalid, every candidate has **`startedOn` null**, or several tie on the same distance, selection falls back to the previous ordering: prefer rows with **`endedOn` set**, then **latest `endedOn`**, then **highest `id`**.
- **`TRUENAT_RESULT_LOGGED`**: links the oldest pending **FormData** (`resultId IS NULL`) for that **site + sampleExternalId** to the newly logged Truenat result, then **`syncFormDataToResult`**.

Changing Truenat **`Sample.externalId`** generation without updating this contract breaks True Connect matching.

---

## Workflows

### 1) Bootstrap client

1. **`POST /api/auth`** with `clientType: "true_connect"` (and optional `deviceTokenId`).
2. Use access token as **Bearer** on Mobile API.
3. **`GET /v4/sites/assigned`** with `api-version: 4` for facilities.
4. **`GET /v4/custom-fields`** (and filters) to render forms.

### 2) Save custom fields (`POST /v4/custom-fields`)

Handler: **`upsertFormData`** (`api/src/mobileApi/customFields/upsertFormData.js`).

High-level steps:

1. Resolve user and **data constraints**; load **`originSiteId`** site with **`getSite`** — forbidden if not authorized.
2. **`knex.transaction`**:
   - Resolve **`partnerId`** from site using **`getSitePartnerId`** for partner-scoped externalId conflict checks.
   - Find existing row by **`externalId`** (partner-scoped) and/or **`siteId` + `sampleExternalId`** (`api/src/mobileApi/customFields/db.js`).
   - **`validateConflicts`**: cannot have one external id mapping to a different site+sample row, etc.
   - If row exists with **`resultId`**, **`sampleExternalId`** cannot change (**409** conflict).
   - **`resolveResultIdForUpsert`**: if already linked, use that `resultId`; else **`selectCandidateResultIdForSiteAndSample`** — among results for that site + sample **not** already referenced by any FormData’s **`resultId`**, pick **`startedOn`** closest to **`collectedOn`** (with **`endedOn` / `id`** fallback as in the skill’s “How Aspect picks” bullet).
   - **`syncFormDataToResult`** when a target result exists (or when already linked — then sync is mandatory or **400**).
3. Insert or update **FormData** with JSON **`{ customFieldsData }`**.

### 3) Truenat logs result after mobile saved form (`TRUENAT_RESULT_LOGGED`)

Subscriber: **`onFormDataResultLogged`** (`api/src/mobileApi/customFields/linkFormDataOnResultLogged.js`), registered on **`mobileApi`** queue for **`TRUENAT_RESULT_LOGGED`** (`api/src/mobileApi/subscriptions.js` → `api/src/subscriptions.js`).

**Producer:** Truenat raw result processor dispatches **`truenatResultLogged`** after **`Result`** insert/update. The action carries **`resultId`** and optional **`deviceApiRawId`** ( **`DeviceApiRaw`** row id). The subscriber only needs **`resultId`**.

When a result is logged:

1. Load **`siteId`** + **`sampleExternalId`** from **Result** + **Sample**.
2. In a transaction, **`SELECT … FOR UPDATE`** the first **FormData** with matching **`siteId`**, **`sampleExternalId`**, **`resultId IS NULL`**.
3. If found, **`syncFormDataToResult`**; on success set **`FormData.resultId`** to that result.

If sync fails, handler logs a **warn** and leaves **`resultId`** null (no link).

### 4) Mapping into **Result** columns

**`syncFormDataToResult`** (`api/src/mobileApi/customFields/syncFormDataToResult.js`):

- Parses **`data.customFieldsData`**.
- Loads result context (partner, assay, disease, country, existing JSON columns).
- Requires **`assayId`** on the result for a real sync; without assay, linking path skips or errors depending on **`isAlreadyLinked`**.
- Calls **`getCustomFieldsFromTrueConnectFormData`** → builds a fragment, merges **`patientData`** / **`resultData`** like **`updateResult`** rules, nulls **`resultDataHash`** when JSON blobs change, **`UPDATE Result`**.

**TrueConnect-specific mapping:** **`trueConnectCustomFieldsMapping.js`**

- For each **`customFieldsData`** entry, load form definitions by **`formDefinitionExternalId`** via **`getFormsByFormDefinitionExternalIds`** (`forms/service.js`).
- Field values are read from **`fields`** object by **numeric `field.id`**, string id, or **`field.name`** (**first defined wins**).
- Values are normalized to **`{ value }`** (or keep `{ value, key }` objects) under keys **`field.id` or `field.name`** to build a **GxConnect-shaped** `data.customFieldData` tree for **`getCustomFieldsFromPayload`** with **`includeZeroAndFalse: true`** (so `0` / `false` sync).

---

## Business rules (concise)

1. **True Connect site list** = **assigned sites only**; do not use **`/v4/sites`** for the default True Connect UX.
2. **Auth** must use **`clientType: true_connect`** for this product; refresh with the same **`clientType`**.
3. **FormData upsert** uses transaction + row locks on matched **FormData** rows (when present); no partner-wide site lock.
4. **Match keys:** prefer **`externalId`** when provided; else **`siteId` + sampleExternalId`**.
5. **`externalId`** max length **36**; conflicts return **409** (`Boom.conflict`) with explicit messages (duplicate site+sample vs external id mismatch).
6. **Linking to Result:** either immediately when a suitable result row exists on upsert, or later via **`TRUENAT_RESULT_LOGGED`** when FormData was stored with **`resultId` null**.
7. **Candidate result** for linking: same site + sample external id, **`sampleId`/`siteId` not null**, **no other FormData** already pointing at that **`resultId`**; choose **`startedOn`** nearest **`collectedOn`**, else same **`endedOn`/`id`** tie-break as before.
8. **Sync:** uses same **`getCustomFieldsFromPayload`** pipeline as Gx device payloads for **`gxConnectForm`** definitions; phone fields normalized with country abbreviation.
9. **Linked row:** changing **`sampleExternalId`** is forbidden; failed sync while linked is **400**; empty mapping when already linked is treated as **synced** (skip clearing existing columns).
10. **Truenat ↔ True Connect:** **`PatientID`** (or **`PatientName`**) on the device payload = **`Sample.externalId`** = the **`sampleExternalId`** the user enters in True Connect for that site; when several results share that sample, upsert links using **`startedOn`** vs **`collectedOn`** (see rule 7) instead of “latest **`endedOn`** only”.

---

## Key source files

| Area | Path |
|------|------|
| Client type constants | `api/src/auth/service.js` (`clientTypes`, `mobileClientTypes`, `isMobileClientType`) |
| Mobile routes wiring | `api/src/routes.js` (`addMobileRoutes`, `decorateMobileAPI`) |
| Sites assigned | `api/src/mobileApi/site/endpoints.js`, `listSites/listSitesAssigned.js`, `listSites/db.js` |
| Custom fields HTTP | `api/src/mobileApi/customFields/endpoints.js` |
| Upsert + rules | `api/src/mobileApi/customFields/upsertFormData.js` |
| DB helpers FormData | `api/src/mobileApi/customFields/db.js` |
| Result sync | `api/src/mobileApi/customFields/syncFormDataToResult.js` |
| TrueConnect → Gx payload | `api/src/mobileApi/customFields/trueConnectCustomFieldsMapping.js` |
| TRUENAT_RESULT_LOGGED | `api/src/mobileApi/customFields/linkFormDataOnResultLogged.js`, `api/src/mobileApi/subscriptions.js`, `api/src/deviceApiRaw/dataProcessors/truenatDevice/result.js`, `api/src/result/actions.js` |
| Form definitions / payload mapping | `api/src/forms/service.js` (`getCustomFieldsFromPayload`, `getFormsByFormDefinitionExternalIds`) |
| Truenat result → **Sample.externalId** | `api/src/deviceApiRaw/dataProcessors/truenatDevice/result.js` (`generateSampleExternalId`) |

---

## Tests to run or extend

- Auth / refresh / JWT for **`true_connect`**: `api/test/auth/auth.spec.js`
- Sites assigned: `api/test/mobileApi/sites.spec.js` (verify behavior vs `/sites` if present)
- FormData linking: `api/test/mobileApi/customFields/linkFormDataOnResultLogged.test.js`
- Sync / upsert: `api/test/mobileApi/customFields/syncFormDataToResult.test.js`

---

## Web UI note

The React app may surface copy that **TrueNat** / device custom fields are managed in True Connect (`web/src/pages/Results/Detail/messages.js`). API agents usually touch **`api/`** only unless the task spans web.

---

## Agent checklist before changing behavior

1. Confirm whether the change affects **True Connect only**, **reporter only**, or **both** (shared handlers).
2. Prefer **`/v4/sites/assigned`** for any True Connect–specific site list feature.
3. Any new **FormData** or sync rule: re-read **`upsertFormData`**, **`syncFormDataToResult`**, and **`trueConnectCustomFieldsMapping`** together — they share transactions and idempotency expectations.
4. Subscribers run asynchronously; **`TRUENAT_RESULT_LOGGED`** handlers must stay **idempotent** and safe under retries.
5. Follow **`api/docs/mobile-custom-fields-api.md`** for any contract-visible change and update that doc when behavior changes.
