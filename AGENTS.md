# Aspect IoT — Agent Instructions

Important: This project runs on node 14.19.0, AI agents are more likely running in node 22+, never try to update or reinstall bcrypt or other libraries due to version issues. Instead open a terminal and switch to node 14.19.0 to execute whatever you need.

## Skill Discovery

Additional project-specific guidance lives in `ai-context/skills/`.

**Autonomous multi-role delivery** (PM → architecture → backend/frontend → security → QA): start with `ai-context/skills/agents/agent-orchestrator/SKILL.md`; role skills live under `ai-context/skills/agents/agent-*/` (`.cursor/` is gitignored in this repo).

When working in these areas, consult the matching skill first:

- API use cases: `ai-context/skills/api/use-case-development/SKILL.md`
- API database work: `ai-context/skills/api/database-handling/SKILL.md`
- API date filters, timezones, `shared/date.js`: `ai-context/skills/api/date-time-handling/SKILL.md`
- API migrations: `ai-context/skills/api/database-migrations/SKILL.md`
- API seeds: `ai-context/skills/api/database-seeding/SKILL.md`
- Authentication, authorization, permissions, menus, and permission-gated UI: `ai-context/skills/authentication-authorization/SKILL.md`
- Reports: `ai-context/skills/api/reports/SKILL.md`
- True Connect (mobile API, FormData, sites assigned): `ai-context/skills/api/trueconnect-support/SKILL.md`
- Responsive / mobile-friendly UI (hamburger menu, breakpoints, drawers): `ai-context/skills/web/responsive-design/SKILL.md`

## Project Overview

Aspect is a full-stack IoT management platform (monorepo) for tracking medical diagnostic results. Two sub-projects:

- **`api/`** — Node.js version 14.19.0 + Hapi.js REST API (CommonJS, JavaScript only)
- **`web/`** — React 17 SPA (ES modules, JavaScript/JSX)

---

## Build / Lint / Test Commands

### From repo root

```bash
yarn start             # Start API + web concurrently
```

### API (`api/` directory)

```bash
yarn lint              # eslint src/ test/ migrations/ seeds/
yarn lint:fix          # Same with --fix
yarn mocha:unit        # Run all unit tests
yarn mocha:contract    # Run all contract tests (requires running server)
yarn db:migrate        # knex migrate:latest + seed:run
yarn db:reseed         # Recreate DB + migrate (ask the developer to do it, never run this command without confirmation)
yarn knex migrate:make [name]   # Generate a new migration file
```

**Run a single API test by grep pattern:**

```bash
# From api/
yarn mocha:contract -g "description of the test"
add .only to the `it` or `describe` clause and execute yarn mocha:unit or yarn mocha:contract
yarn mocha:unit --spec test/device/endpoints.test.js
```

### Web (`web/` directory)

```bash
yarn start             # Webpack dev server (hot reload)
yarn dist              # Production build
yarn test              # Jest with coverage
yarn test:watch        # Jest in watch mode
yarn lint              # eslint src/
yarn prettier          # Prettier format src/**/*.{js,jsx,css}
```

**Run a single web test file:**

```bash
# From web/
yarn test:single src/components/AspectTable/TableHeader/Tests/TableHeaders.test.jsx

# Filter by test name:
yarn test:single --testNamePattern="Cron Component"
```

---

## Code Style

### Formatting (Prettier — both `api/` and `web/`)

- No semicolons
- Single quotes
- 2-space indentation
- 120-character line width
- `arrowParens: "avoid"` — single-param arrow functions: `x => x`
- Trailing commas in ES5 positions (objects, arrays)

Lint-staged runs `eslint --fix` + `prettier --write` on every commit automatically.

### Imports

**API (CommonJS):**

```js
const _ = require('lodash');
const Boom = require('@hapi/boom');
const { knex, filterParams } = require('../db');
module.exports = { functionA, functionB };
```

**Web (ES modules) — import order is ESLint-enforced:**

```js
import React, { useCallback, useMemo } from 'react'; // React first
import { Box } from '@mui/material'; // External libs
import get from 'lodash/get'; // Lodash: per-method ONLY
import { DetailHeader } from '../../../cleanComponents'; // Internal, alphabetized
```

- Lodash must be imported per-method in web: `import get from 'lodash/get'` (ESLint rule enforced)
- `date-fns` `format` is banned — use `date-fns-tz` instead
- No duplicate imports (`import/no-duplicates` is an error)

### Module exports and testability (API)

- Do **not** keep symbols on `module.exports` if nothing in the codebase imports them—remove dead exports instead of growing a misleading public API.
- **Exports that exist only so tests can import a helper** are a design smell: treat them as technical debt to **remove**. Prefer a **contract test** (HTTP-level behavior) or refactor so the module has a **small, intentional surface** that follows **SRP**, and unit-test through those entry points with **`proxyquire`** / test doubles for collaborators—not through leaked internals.
- When the problem is **integration** (e.g. Knex calls inlined in a handler), extract queries into a **`db.js`** file **next to the use case** and keep the handler thin, rather than exporting private functions for tests. Use a shared `db.js` only when the same queries are reused across multiple use cases (see `ai-context/skills/api/use-case-development/SKILL.md`).

---

## Naming Conventions

| Context                     | Convention                       | Examples                           |
| --------------------------- | -------------------------------- | ---------------------------------- |
| API source files            | `camelCase.js`                   | `service.js`, `listDevices.js`     |
| API unit tests              | `camelCase.test.js`              | `endpoints.test.js`                |
| API contract tests          | `camelCase.spec.js`              | `server.spec.js`                   |
| React components            | `PascalCase.jsx`                 | `DeviceDetail.jsx`                 |
| React hooks                 | `use{Name}.js/.jsx`              | `useDevice.jsx`, `useAuthState.js` |
| Redux files                 | `{Domain}Redux.js`               | `DeviceRedux.js`, `AuthRedux.js`   |
| Redux action type constants | `SCREAMING_SNAKE_CASE`           | `RECEIVE_SINGLE_DEVICE`            |
| API service functions       | verb + noun camelCase            | `showDevice`, `listApprovalTypes`  |
| Query key constants         | `SCREAMING_SNAKE_CASE`           | `DEVICE_KEY`                       |
| DB migrations               | `{timestamp}_{snake_case}.js`    | `20260220020808_add_column.js`     |
| DB seeds                    | `{number}_{descriptive_name}.js` | `15_add_feature_data.js`           |

---

## Architecture Patterns

### API

- **Feature-sliced**: each domain has `endpoints.js`, `service.js`, and per-use-case files
- Shared cross-cutting utilities live in `src/shared/`
- Routes go through `decorateClientAPI()` / `decorateDeviceAPI()` to attach auth strategy
- Use **Boom** for HTTP errors: `Boom.notFound()`, `Boom.forbidden()`
- Use **Joi** for request/response validation schemas inline in route definitions
- Standard response shape: `{ ok: true, total, length, data }`
- Test directory mirrors `src/` structure exactly

See `ai-context/skills/api/use-case-development/SKILL.md` for the full guide on structuring a use case (endpoint, handler, logic file, DB file, shared common/).

### Web

- **Three component layers**: `cleanComponents/` (new, MUI-based) → `components/` → `oldComponents/` (legacy)
- Barrel exports: every clean component re-exports via `index.js`; `cleanComponents/index.js` re-exports all
- **React Query** for server state (Redux also used, but legacy); **Redux + Immutable.js** for UI/auth state
- All API calls go through the `aspectFetch` wrapper
- All user-facing strings use `react-intl`: `defineMessages()` + `useIntl()`
- **Formik + Yup** for forms; **PropTypes** for runtime prop validation
- CSS Modules for component-scoped styles (`.module.css`)

---

## Database (API)

See `ai-context/skills/api/database-handling/SKILL.md` for full patterns. Key rules:

- Always use **table aliases** in Knex queries (`d` = Device, `s` = Site, `g` = Geography, etc.)
- Use `.modify()` for composable query logic and applying constraints
- Use `filterParams`, `sortPageParams` helpers from `src/db.js`
- Apply access-control constraints via `addConstraints` from `src/auth/constraints.js`
- Prefer Knex builder methods over `.whereRaw()`; if raw SQL is needed, use parameterized `knex.raw('? = ?', [a, b])`
- Use `leftJoin` for optional relationships, `join` for required
- Use `transact()` from `src/db.js` for multi-step atomic operations
- Colocate DB queries with the use case handler; only create a shared `db.js` when queries are reused across multiple use cases

---

## Database Migrations & Seeds

See `ai-context/skills/api/database-migrations/SKILL.md` and `ai-context/skills/api/database-seeding/SKILL.md` for full details.

**Migrations:**

- Generate: `yarn knex migrate:make [migration_name]` (from `api/`), remove autogenerated comments
- Wrap with `module.exports = require('../src/db').migration(up, down)`
- Always add audit fields (`addAuditFields`) to new tables
- Never use cascade delete or `ON DELETE` defaults

**Seeds:**

- All seeds must be idempotent — use upsert patterns
- One-time seeds: pass static `__filename` as identifier
- Repeated seeds: pass `${__filename}-${new Date().toISOString()}` as identifier
- `zz_shared/` seeds do not run in development/test environments

---

## Error Handling

**API:**

- Use `Boom` for all HTTP-layer errors; never throw raw `Error` objects from route handlers
- Server startup errors: `try/catch` → `logger.error(err)` → `process.exit(1)`
- Never commit `console.log` in application code (ESLint error); You can use it for debugging

**Web:**

- Custom error classes (`APIApplicationError`, `ConnectionError`) extend `Error`
- React Query handles loading/error states; always handle `isLoading` and `isError`

---

## Testing

- **API unit tests** use Mocha + Chai + Sinon; use `proxyquire` for dependency injection
- **API contract tests** are full HTTP integration tests using Supertest against a running server
- **Web tests** use Jest 27 + Enzyme + React Testing Library
- Never commit `.only` in tests — ESLint will catch it (`mocha/no-exclusive-tests`, `no-only-tests`)
- Timezone must be set: API tests run with `TZ=UTC`, web tests with `TZ=Europe/Paris`

