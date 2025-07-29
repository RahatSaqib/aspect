# Database Access Context for AI Tools

This document provides patterns for database access in the Aspect API codebase using Knex.js with MySQL.

## Core Module

```javascript
const { knex, filterParams, sortPageParams, transact, run } = require('./db')
const { getConstraints, addConstraints } = require('./auth/constraints')
```

## Key Patterns

DB access code should be located, for any non-trivial case, in a `db.js` file located at the lowest level possible. If the db code is reusable among use cases, the method must be hoisted to a higher level.

### 1. Constraint System

Constrainst is the way Aspect handles permissions, the constraints are rules obtained from the user's access profile, and then converted to filtering conditions in any db query.

#### Get User Constraints First:
The constraints are usually obtained in the service, where the auth object is passed as part of the request coming from the endpoint.
```javascript
const dataConstraints = await getConstraints(auth.credentials)
```

#### Apply to Queries:
```javascript
.modify(addConstraints, dataConstraints, {
  site: 's',      // table: alias
  geography: 'g',
  result: 'r'
})
```

#### Supported Constraint Tables:
- **Geography**: `geography`, `country`, `site`
- **Medical**: `disease`, `assay`, `assayType`, `result`, `sample`
- **Device**: `device`, `deviceType`
- **User**: `person`, `partner`, `jobFunction`
- **Other**: `issue`, `case`, `transferLog`

#### Constraint Mechanisms:
1. **Direct** - Applied to aliased tables
2. **OR** (`$or`) - Multiple conditions with OR logic
3. **Derived** - Auto-joins missing tables (e.g., Result→Assay→AssayType for disease constraints, if an alias is not provided, a join will be added to match the user's constraint)

### 2. Table Aliases

Standard aliases:
- `s`: Site
- `g`: Geography
- `r`: Result
- `d`: Device
- `dt`: DeviceType
- `a`: Assay
- `at`: AssayType
- `p`: Person
- `s` (or `st` if `s` is used): State
- `l`: Lga
- `c`: Country

### 3. Helper Functions

```javascript
// Filter parameters
.modify(filterParams, query, {
  countryId: 'g.countryId',     // exact
  name: 's.name',                // LIKE for strings
  siteId: ['s.id', 's.parentId'] // OR across columns
})

// Sort and pagination
.modify(sortPageParams, query, 'defaultColumn', {
  siteName: 's.name',
  country: 'c.name'
})

// Date range
.modify(filterDateRangeParams, { minDate, maxDate }, 'r.endedOn', { allowNulls: true })
```

### 4. `raw` methods - Minimize Usage

```javascript
// NEVER: 
.whereRaw('r2.endedOn > r.endedOn')
// ALWAYS: 
.where('r2.endedOn', '>', 'r.endedOn')
```

```javascript
// NEVER: 
.whereRaw('r2.endedOn > MAX(r.endedOn)')
// ALWAYS: 
.where('r2.endedOn', '>', knex.raw('max(r.endedOn)'))
```


### 5. `.modify()` Method (Preferred for Composable Queries)

```javascript
// Constraints application
knex('Result as r')
  .modify(addConstraints, dataConstraints, {
    result: 'r',
    site: 's',
    geography: 'g'
  })
  .modify(filterParams, query, {
    deviceId: 'd.id',
    siteName: 's.name'
  })

// Conditional logic
.modify(qb => {
  if (condition) qb.where('field', value)
})
```

### 6. Transactions

```javascript
await transact(async trx => {
  await trx('Table1').insert(data1)
  await trx('Table2').insert(data2)
})
```

## Critical Rules

1. **SQL Injection**: Never use string interpolation in SQL
   ```javascript
   // WRONG: 
   knex.raw(`WHERE x = '${value}'`)
   // RIGHT: 
   knex.raw('WHERE x = ?', [value])
   ```

2. **Joins**: Use `leftJoin` for optional relationships, `join` for required

3. **Null Handling**: Explicit for nullable columns
   ```javascript
   .modify(filterDateRangeParams, params, 'field', { allowNulls: true })
   ```

4. Sorting
   Use field names for ASC and object for desc sorting.
```javascript
   .orderBy(['i.serial', { column: 'm.startedOn', order: 'desc' }])
```

## Complete Example

```javascript
async function getDevices(dataConstraints, query) {
  return knex('Device as d')
    .join('Site as s', 'd.siteId', 's.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g'
    })
    .modify(filterParams, query, {
      deviceName: 'd.name',
      siteName: 's.name',
      countryId: 'g.countryId'
    })
    .modify(sortPageParams, query, 'd.name')
    .select('d.id', 'd.name', 's.name as siteName')
}
```

## Module Structure
- `common/db.js` - Database queries
- `service.js` - Business logic
- `routes.js` - HTTP endpoints

## References
- `api/src/db.js` - Core utilities
- `api/src/auth/constraints.js` - Constraint implementation
- `api/src/site/common/db.js` - Complex query examples
