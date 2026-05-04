---
name: date-time-handling
description: Use when implementing or debugging date filters, timezones, ISO query params (minDate/maxDate), `api/src/shared/date.js` helpers, or browse-list date ranges in the Aspect API and web app.
---

# Date and time handling (Aspect)

This skill covers **filter date ranges**, **`api/src/shared/date.js`**, and alignment with the **web** (`date-fns-tz`, user timezone from profile). It is **not** about authentication: JWTs carry permissions and person identity; **timezone** for the logged-in user comes from **Person/Country/TimeZone** in the API and is mirrored in Redux for the web. Putting date-range contracts here keeps **`authentication-authorization/SKILL.md`** focused on **who may call** an endpoint, not **how to parse** `minDate`.

## FormData list (`GET /form-data`) — reference implementation

- Route: `api/src/formData/endpoints.js`, scope **`forms:view`**.
- **Required** query params: **`minDate`**, **`maxDate`** — `Joi.date().iso().required()` (same names as `fetchWrapperForQueries` / result list).
- Handler: `api/src/formData/service.js` coerces both to **`Date`** and passes them through. **No** second server-side timezone transform.
- DB: `api/src/formData/db.js` — `fd.createdOn` with `>=` / `<=`. Client ISO strings **with offset** (e.g. `...+06:00`) are correct UTC instants.

## UI — recommended practice

- Use **`minDate`** and **`maxDate`** in query params.
- Align with the **result list**: `PeriodSelector` / filter state so values are ISO with the **user’s offset** (start/end of day in profile time).
- To format a **calendar** `yyyy-MM-dd` for the API from a `Date`, use **`formatInTimeZone`** from **`date-fns-tz`** with the IANA zone from **`getTimezoneById(Redux timezoneId)`** (see existing browse pages).

## API — recommended practice for browse `minDate` / `maxDate`

1. **Validate** with `Joi.date().iso()` (or `validateDateRangeParams` where used).
2. **Coerce** to `Date` for Knex: `value instanceof Date ? value : new Date(value)`.
3. **Compare** to UTC columns directly. Do **not** derive a “day” with **`toISOString().slice(0, 10)`** on offset datetimes (that uses the **UTC** calendar day and breaks e.g. “27 Apr” in `Asia/Dhaka`).
4. Use server-side **`replaceOffset` / `slideDateToTimeZone` / SQL `CONVERT_TZ`** when **the server** builds bounds, not when the client already sends full instants.

## Helpers that fit this model well

| Helper | Role |
|--------|------|
| **`parseDateOrDefault`** / **`formatDateOrDefault`** | Integrations, templates, exports, messy string inputs — widely used (e.g. `api/src/stringTemplate/service.js`, device API raw processors, `api/src/inventory/common/logic.js`). |
| **`REGEX_ISODATESTRING`** + **`validateDateRangeParams`** (`api/src/routes.js`) | Result-style list query **strings**. |
| **`slideDateToTimeZone`** | Wall time in IANA → UTC `Date` (`zonedTimeToUtc`). Example: `api/src/device/getDevicePerformance.js`, `api/src/fact/customFieldsCompletionStatsService.js`. |
| **`replaceOffset`** | With **`startOfDay`/`endOfDay`** (`date-fns`) + user **`timezoneIANA`**: `api/src/result/service.js` (dashboard flags), `api/src/fact/calculateFactResultsDevice*.js`, `api/src/result/serviceReport/trendReports.js`, `api/src/fact/onFactCalculateInventoryConsumptionRates.js`. |
| **`getDateTimeProjectionInTimeZoneIANA`** / **`getMonthYearExpressionFromFieldInTimeZone`** | MySQL **`CONVERT_TZ`** for **SQL-side** projection and grouping. Use when the database must bucket by **local calendar day** (e.g. **`GROUP BY DATE(...)`** after converting the column to the user’s IANA zone). Node **`Date`** / server-side string formatting **cannot** substitute here: aggregation runs in MySQL on stored UTC values; without **`CONVERT_TZ`** in the expression, “day” is wrong for reporting timezones. Examples: `api/src/inventory/listInventoryLog.js`, `api/src/deviceMaintenanceStatus/serviceReports.js`, `api/src/deviceApiKey/service.js`. |

---

## Risky or inconsistent helpers — why, and where they appear

Use this table before **removing** or **rewriting** a helper: many paths still depend on it.

| Helper / pattern | Risk | Usage in the codebase |
|------------------|------|------------------------|
| **`startOfDayUtc`** / **`startOfTodayUtc`** | Implemented with **`getTimezoneOffset()`** (Node **process** TZ), not user IANA; name suggests “UTC” but behavior is **host-dependent** (`TZ=UTC` in tests/CI mitigates). | **`api/src/device/service.js`** (maintenance days), **`api/src/plugin/issueTriggers.js`**, **`api/src/scheduler/taskTracker.js`**, **`api/src/email/service.js`**, **`api/src/fact/calculateFactResultsDevice*.js`**, **`api/src/fact/onFactCalculateInventoryConsumptionRates.js`** (often chained with **`replaceOffset`**), **`api/seeds/test/31_add_device_maintenance_status.js`**, plus multiple **`api/test/**`** files. |
| **`getYear`** | Assumes **`date.split('T')[0]`** — brittle if input is not ISO-shaped. | **`api/src/result/dashboard/getTbTestingDiagnosisTrend.js`** (`getYear(request.query.minDate)` / `maxDate`). |
| **`getOffsetFromIsoDateString`** | **`slice(-6)`** assumes offset suffix shape; fragile for unusual ISO variants. | **`api/src/device/service.js`** (list device / workload — **`query.maxDate`** twice), **`api/src/dashboard/resultsTransmitted.js`**, **`api/src/device/serviceReportsPakistan/xpertSiteDetailedReport/index.js`**. Tests: **`api/test/shared/date.test.js`**. |
| **`getOffsetFromIsoDateStringInMinutes`** | Same regex gate as above; different consumers than **`slice`** helper. | **`api/src/dashboard/activityOverTime.js`**, **`api/src/device/serviceReportsPakistan/xpertWorkloadSummaryReport/xpertWorkloadSummaryReport.js`**. |
| **`getAllMonthsInRange`** vs **`getAllUserMonthsInRange`** | Different algorithms (month walk vs minute-offset buckets); picking the wrong one breaks report ranges. | **`getAllMonthsInRange`**: **`api/src/result/service.js`** (clinical/month aggregation), **`api/src/device/serviceReportsPakistan/xpertSiteDetailedReport/index.js`**. **`getAllUserMonthsInRange`**: **`xpertWorkloadSummaryReport.js`** only (+ **`api/test/shared/date.test.js`**). |
| **`getLocalDateTimeStringInUtc`** | Uses legacy **`date-fns-timezone`** (`convertToLocalTime`); overlaps **`date-fns-tz`** used elsewhere. | **Internal** to **`getAllMonthsInRange`** in `api/src/shared/date.js`; tests in **`api/test/shared/date.test.js`**. |
| **Raw SQL `CONVERT_TZ(...)`** outside **`shared/date.js`** helpers | Duplicates projection logic; risk of **`offset`** vs **IANA** mistakes (DST). | Scattered: **`api/src/device/listDevices.js`**, **`device/common/db.js`**, **`device/deployment/persistDeploymentChanges.js`**, **`dashboard/resultsTransmitted.js`**, **`fact/customFieldsCompletionStatsService.js`**, **`result/treatment.js`**, **`deviceMaintenanceStatus/service.js`**, etc. (prefer **`getDateTimeProjectionInTimeZoneIANA`** where possible). |

---

## Relation to auth / JWT (narrow)

- **Authorization** decides whether **`GET /form-data`** etc. can run (`forms:view`, `result`, …).
- **Timezone** for UI formatting and PeriodSelector-style ISO offsets comes from the **user profile / country** wiring (see **`getUser`** / **`timezoneIANA`**), not from JWT claims alone.
- Do not conflate **permission checks** with **date parsing** — use this skill and **`authentication-authorization/SKILL.md`** together when both apply.
