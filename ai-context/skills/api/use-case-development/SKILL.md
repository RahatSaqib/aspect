---
name: use-case-development
description: Use when creating or modifying an API use case — endpoint definition, request handler, business logic, and database access.
---

# API Use Case Development

This document describes how to structure and implement a use case in the Aspect API. The canonical reference is `api/src/device/deviceComposition/` (`mergeDevices`, `transferInstruments`, `transferInstrumentToNewDevice`).

---

## File Layout Decision Tree

Before writing any code, decide on the file layout:

```
# Flat use case — simple handler, no shared DB logic needed
src/{module}/{useCaseName}.js           ← handler + inline DB queries

# Use case with significant DB or logic code
src/{module}/{useCaseName}/
  index.js         ← re-exports the handler (keeps endpoints.js imports stable)
  {useCaseName}.js ← handler (orchestration, validation, wiring)
  db.js            ← DB queries used ONLY by this use case
  {subject}Service.js  ← complex sub-task logic exclusive to this use case

# Shared DB queries (reused across ≥2 use cases in the same module)
src/{module}/common/db.js

# Shared short/medium helper functions (reused across ≥2 use cases in the same module)
src/{module}/common/logic.js

# Shared complex logic reused across ≥2 use cases in the same module
src/{module}/common/{subject}Service.js
```

**Rules:**

- Colocate DB queries with the use case. Only promote to `common/db.js` when ≥2 use cases need the same query.
- `common/logic.js` is for short-to-medium helper functions shared across use cases. If the shared logic is complex or tied to a domain concept, give it its own `common/{subject}Service.js` file.
- **`{subject}Service.js` in the tree (common or next to a use case)** is where **non-entrypoint** work lives: mapping between persisted shapes, transforms, heavy validation—anything that is **not** the route handler or subscription callback itself. The handler (or a thin orchestrator only called from handlers/subscribers) keeps auth, transaction boundaries, and I/O order; it calls into this module. **Filename** can be `{subject}Service.js` or another single descriptive name when that reads better (e.g. `trueConnectCustomFieldsMapping.js`); either way, **every export should match that file’s subject**, and related helpers stay together—no scattering across tiny files or unrelated `service.js` entrypoints.
- Do not add `db.js` or a dedicated `{subject}` module for trivial one-off snippets that will never gain a second caller or a coherent name.

---

## 1. Endpoint Definition (`endpoints.js`)

Endpoints live in the module's `endpoints.js`. Import the handler and add a route object.

```js
const Joi = require('@hapi/joi')
const { asyncHandler } = require('../routes')
const { myUseCaseHandler } = require('./myUseCase')          // flat
// or
const { myUseCaseHandler } = require('./myUseCase/index')    // folder

// Inside the routes array:
{
  method: 'POST',                          // GET / POST / PUT / DELETE / PATCH
  path: '/resource/action',
  handler: asyncHandler(myUseCaseHandler), // always wrap async handlers
  config: {
    auth: { scope: ['resource:edit'] },    // pick the narrowest scope
    description: 'Short human description',
    notes: 'Longer explanation of what this endpoint does',
    validate: {
      payload: {                           // or params / query
        sourceIds: Joi.array().items(Joi.number()).required(),
        targetId: Joi.number().required(),
      },
    },
    // Add response schema when shape is well-defined and worth documenting:
    response: {
      options: { allowUnknown: false },
      schema: Joi.object({
        ok: Joi.bool().required(),
        data: Joi.object({ ... }),
      }),
    },
  },
},
```

**Scope naming convention:** `{resource}:view`, `{resource}:edit`, `{resource}:admin`.

---

## 2. Handler File (`{useCaseName}.js`)

The handler is the orchestration layer. It should:

1. Resolve the current user (`getUser`)
2. Fetch the entities needed for validation
3. Validate (business rules + permissions)
4. Execute the mutation — wrapped in `transact()` if it touches multiple tables
5. Trigger any async side effects (e.g., fact table recalculation via message context)
6. Return the standard response shape

```js
const Boom = require('@hapi/boom');
const { knex, transact } = require('../../db');
const { getConstraints } = require('../../auth/constraints');
const { getUser } = require('../../auth/service');
const { getDevicesIdsCheckingConstraints } = require('../common/db'); // shared query
const { recalculateDeviceFactTables } = require('../common/logic'); // shared logic
const { executeMyAction } = require('./myActionLogic'); // use-case logic

async function myUseCaseHandler({
  payload,
  params,
  query,
  plugins: { messageContext },
  auth,
}) {
  const { id: userId } = await getUser(auth.credentials.name);

  // 1. Fetch entities
  const source = await getSource(payload.sourceId);
  const target = await getTarget(payload.targetId);

  // 2. Validate
  await validate(source, target, auth.credentials);

  // 3. Mutate (wrap in transaction when touching multiple tables)
  await transact(async (trknex) =>
    executeMyAction(trknex, source.id, target.id, userId)
  );

  // 4. Side effects
  await recalculateDeviceFactTables(messageContext, [target.id]);

  return { ok: true };
}

// ── Validation ────────────────────────────────────────────────────────────────

const validate = async (source, target, credentials) => {
  validateBusinessRule(source, target);
  await validatePermissions([source.id, target.id], credentials);
};

function validateBusinessRule(source, target) {
  if (source.id === target.id) {
    throw Boom.badData('Source and target must be different.');
  }
}

async function validatePermissions(deviceIds, credentials) {
  const dataConstraints = await getConstraints(credentials);
  const accessible = await getDevicesIdsCheckingConstraints(
    deviceIds,
    dataConstraints
  );
  if (accessible.length !== deviceIds.length) {
    throw Boom.forbidden(`You don't have permission to perform this action.`);
  }
}

// ── Inline DB queries (not shared) ───────────────────────────────────────────

async function getSource(id) {
  return knex('Device').where('id', id).first('id', 'siteId', 'deviceTypeId');
}

async function getTarget(id) {
  return knex('Device').where('id', id).first('id', 'siteId', 'deviceTypeId');
}

module.exports = { myUseCaseHandler };
```

**Key conventions:**

- Destructure `{ payload, params, query, plugins, auth }` from the Hapi request object.
- Keep inline DB queries at the bottom of the handler file — small, purpose-built.
- Never throw raw `Error`. Always use `Boom`: `Boom.notFound()`, `Boom.badData()`, `Boom.forbidden()`, `Boom.badRequest()`.
- Standard response shapes: `{ ok: true }` / `{ ok: true, data }` / `{ ok: true, total, length, data }`.

---

## 3. Use-Case Logic File (`{useCaseName}Logic.js` / `{subject}Service.js`)

Extract to a sibling logic file when the mutation is complex enough that it would make the handler hard to read, or when the logic is reused from another handler within the same folder.

```js
// myActionLogic.js — transactional mutation steps
const { knex } = require('../../db');
const { deleteDevice } = require('../common/logic'); // shared logic

async function executeMyAction(trknex, sourceId, targetId, userId) {
  await reassignRelatedRecords(trknex, sourceId, targetId);
  await deleteDevice(sourceId, trknex);
}

async function reassignRelatedRecords(trknex, sourceId, targetId) {
  await trknex('RelatedTable')
    .where('deviceId', sourceId)
    .update({ deviceId: targetId });
}

module.exports = { executeMyAction };
```

**Patterns to follow (from `mergeDevicesLogic.js`):**

- Accept `trknex` as the first argument so everything runs in the caller's transaction.
- Use `.modify(filterFn)` for reusable query fragments within the file.
- Build sub-queries with `knex(...)` (non-transactional builder) for read-only sub-selects inside a `trknex` statement — this is the established pattern in the codebase.

---

## 4. Use-Case DB File (`db.js`)

Use a dedicated `db.js` inside the use case folder when there are several significant DB queries that would bloat the handler but are not shared outside this use case.

```js
// myUseCase/db.js
const { knex } = require('../../../db');
const { addConstraints } = require('../../../auth/constraints');

async function getSourceEntities(ids) {
  return knex('Device')
    .whereIn('id', ids)
    .select('id', 'siteId', 'deviceTypeId');
}

async function getTargetEntity(id) {
  return knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where('d.id', id)
    .first({ id: 'd.id', deviceTypeExternalId: 'dt.externalId' });
}

module.exports = { getSourceEntities, getTargetEntity };
```

---

## 5. Common DB / Logic (`common/db.js`, `common/logic.js`, `common/{subject}Service.js`)

Promote a function to `common/` only when it is genuinely needed by two or more use cases in the module.

| Location                     | When to use                                       |
| ---------------------------- | ------------------------------------------------- |
| `common/db.js`               | DB query reused across ≥2 use cases               |
| `common/logic.js`            | Short-to-medium helper reused across ≥2 use cases |
| `common/{subject}Service.js` | Complex shared logic that deserves its own file   |
| `common/{subject}Logic.js`   | Same as above, old naming convention              |

Example from the codebase: `getDevicesIdsCheckingConstraints` lives in `device/common/db.js` because both `mergeDevices.js` and `transferInstruments.js` call it. `recalculateDeviceFactTables` and `deleteDevice` live in `device/common/logic.js` for the same reason.

---

## 6. Transactions

Wrap any operation that writes to more than one table:

```js
await transact(async trknex => {
  await doStepOne(trknex, ...)
  await doStepTwo(trknex, ...)
})

// With a return value:
const { newId } = await transact(async trknex => {
  const [newId] = await trknex('Table').insert(data)
  await trknex('OtherTable').insert({ refId: newId, ... })
  return { newId }
})
```

Always pass `trknex` (not `knex`) to every DB call inside a transaction.

---

## 7. Error Handling

```js
// Not found
if (!entity) throw Boom.notFound('Entity not found');

// Permission denied
throw Boom.forbidden(`You don't have permission to do this.`);

// Invalid input / business rule violation
throw Boom.badData('Descriptive message about the rule.');

// Bad request with a machine-readable code (for frontend error handling)
throw Boom.badRequest('Descriptive message', { errorKeyCode: 'camelCaseKey' });
```

Never throw `new Error(...)` from route handlers or service functions.

---

---

## 8. Listing records with `addConstraints` (read-only use case)

Use this pattern when you need a **pageable, filterable list** of records that are access-controlled by the user's site/result constraints. The canonical example is `api/src/formData/` (TDC-21).

### Structure

```
src/formData/
  db.js          ← Knex queries; buildBaseQuery + filter modifier
  service.js     ← Handler + serialization
  endpoints.js   ← Route definitions (GET /form-data, GET /form-data/{id})
```

### Key patterns

**`db.js` — base query with constraints**

```js
const { knex } = require('../db')
const { addConstraints } = require('../auth/constraints')

function buildBaseQuery(dataConstraints) {
  return knex('FormData as fd')
    .join('Site as s', 's.id', 'fd.siteId')
    // other optional joins ...
    .modify(addConstraints, dataConstraints, { site: 's' })
}

function applyListFilters(query, { siteId, dateFrom, dateTo }) {
  if (siteId) query.where('fd.siteId', siteId)
  if (dateFrom) query.where('fd.createdOn', '>=', dateFrom)
  if (dateTo)   query.where('fd.createdOn', '<=', dateTo)
}

function getRecords(dataConstraints, filters) {
  return buildBaseQuery(dataConstraints)
    .modify(applyListFilters, filters)
    .select('fd.id', 's.name as siteName', ...)
    .orderBy('fd.createdOn', 'desc')
}

function countRecords(dataConstraints, filters) {
  return buildBaseQuery(dataConstraints).modify(applyListFilters, filters).countDistinct('fd.id as total').first()
}
```

**`service.js` — handler with default date range**

```js
async function listRecords(request) {
  const dataConstraints = await getConstraints(request.auth.credentials)
  const now = new Date()
  const filters = {
    siteId: request.query.siteId,
    dateFrom: request.query.dateFrom || subDays(now, 30),
    dateTo:   request.query.dateTo   || now,
  }
  const [rows, totalRow] = await Promise.all([
    getRecords(dataConstraints, filters),
    countRecords(dataConstraints, filters),
  ])
  return { ok: true, total: Number(totalRow.total || 0), length: rows.length, data: rows }
}
```

**`endpoints.js` — register with `decorateClientAPI('result')`**

```js
// In routes.js:
server.route(require('./formData/endpoints').routes.map(decorateClientAPI('result')))
```

**Access-control alias rule**: pass `{ site: 's' }` to `addConstraints` when the table being listed has a `siteId` FK, exactly like `getAccessibleFormDataByExternalId` in `api/src/mobileApi/customFields/db.js`. This hooks into job-context OR-constraints and country/partner filtering automatically.

---

## Complete Example Reference

See `api/src/device/deviceComposition/` for the canonical multi-file use case:

| File                               | Role                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `mergeDevices.js`                  | Handler — orchestration, validation, inline DB reads                       |
| `mergeDevicesLogic.js`             | Use-case logic — transactional mutation steps                              |
| `transferInstruments.js`           | Handler for a related use case in the same folder                          |
| `transferInstrumentsLogic.js`      | Logic for the above; reuses `mergeDevicesLogic`                            |
| `transferInstrumentToNewDevice.js` | Self-contained handler — all logic inline (simple enough)                  |
| `../common/db.js`                  | `getDevicesIdsCheckingConstraints` — shared by both handlers               |
| `../common/logic.js`               | `deleteDevice`, `recalculateDeviceFactTables` — shared orchestration steps |
