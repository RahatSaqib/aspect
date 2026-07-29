---
name: database-seeding
description: Use when working with database seeds, creating new seeds, understanding the seeding system, or troubleshooting seeding issues in the Aspect project.
---

# Database Seeding System

## Overview

The Aspect project uses database seeding system built on top of Knex.js. The seeding system is designed to handle both shared data (applied to all countries) and country-specific data, with different execution behaviors for different environments. The seeding process occurs after the migration process on each deploy.
In the db the seeding files are applied incrementally using the table `AspectSeed` that records already applied seedings. Incremental application only matters in production/staging — development and test databases are always recreated from scratch (see [Environment Behavior](#environment-behavior)).

> Every time knex must be preferred over raw sql. If raw sql is needed, the user must be warned about it.

## Folder Structure

```
api/seeds/
├── zz_shared/           # Shared seeds (executed for all countries)
├── common/              # Common utility functions for seeding
├── fixtures/            # Static data fixtures
├── [country]/           # Country-specific seeds (e.g., angola/, bangladesh/, etc.)
└── utils.js            # Core seeding utilities
```

## Seed Types

### 1. Shared Seeds (`zz_shared/`)

- **Location**: `api/seeds/zz_shared/`
- **Execution**: Runs for all countries during deployment
- **Environment Restriction**: **Not executed in develop and test environments**
- **Purpose**: Apply universal data and configurations

### 2. Country-Specific Seeds

- **Location**: `api/seeds/[country]/`
- **Execution**: Runs only for the specific country
- **Purpose**: Apply country-specific configurations and data

## Execution Patterns

### One-Time Execution

```javascript
module.exports = require('../utils').seed(seed, __filename);
```

```javascript
module.exports = require('../utils').seed(seed, __filename)
```
- Uses static `__filename` as identifier
- Executes only once per deployment

### Repeated Execution
```javascript
module.exports = require('../utils').seed(seed, `${__filename}-${new Date().toISOString()}`)
```
- Uses dynamic timestamp as identifier
- Executes on every deployment
- Example: `03_upsert_reports_with_country_specific.js`

## Common Seeding Patterns

### 1. Upsert Pattern
Most seeds follow an "upsert" pattern (insert or update):
```javascript
// Check if record exists, then insert or update
const existing = await knex('Table').where('externalId', data.externalId).first()
if (existing) {
  await knex('Table').update(data).where('id', existing.id)
} else {
  await knex('Table').insert(data)
}
```

### 2. Batch Processing
For large datasets:
```javascript
const batchSize = 1000
// Process records in batches to avoid memory issues
- Example: `03_upsert_reports_with_country_specific.js`
```

### 3. Transaction Usage
Critical operations use transactions:
```javascript
await knex.transaction(async trx => {
  // Multiple related operations
})
```

## Key Seeding Functions

### Core Data Seeds
- **`upsert_partner_data.js`**: Partner configuration and settings
- **`upsert_contacts.js`**: Users, persons, job contexts, and permissions
- **`upsert_job_functions_&_permissions.js`**: Job functions and permission mappings

### Configuration Seeds
- **`upsert_reports.js`**: Report definitions and sheets
- **`upsert_consumables.js`**: Consumable items and assay relationships
- **`upsert_tags.js`**: Tag definitions and default associations
- **`upsert_issue_event_triggers.js`**: Issue event trigger configurations

### Messaging & Notifications
- **`upsert_message_and_notification_types.js`**: Message types and notification configurations
- **`upsert_webhook_servers.js`**: Webhook server configurations
- **`upsert_webhook_templates.js`**: Webhook template definitions

### Data Processing
- **`upsert_fact_custom_field_completion_table.js`**: Fact table population for analytics
- **`upsert_result_category_group.js`**: Result categorization rules

## Environment Behavior

### Development & Test — always from scratch
- Databases are **recreated from zero** (`yarn db:reseed`); there is **no incremental deploy** in these environments
- Every migration and every seed in `seeds/development/` or `seeds/test/` replays on each recreation
- Shared seeds (`zz_shared/`) are skipped (`api/src/config.js` excludes them when `seeds.directory` points at `/test` or `/development`)
- **Consequence**: for dev/test purposes you may alter any existing migration or seed file in the history — the change takes effect on the next DB recreation

### Production & Staging — incremental
- Partner-specific (`seeds/[country]/`) **and** `zz_shared/` seeds run **incrementally**: only seeds not yet recorded in the `AspectSeed` table execute on deploy
- Migrations are likewise incremental (standard knex versioning)
- The web and the API are always deployed together (the web is never online against a newer/older API)

### Can I edit an existing migration/seed file, or do I need a new one?

Decide by asking: **will this file run again in production?**

| File state | Production behavior | What to do |
| --- | --- | --- |
| One-time seed / migration **already applied in production** | Never re-runs | Add a **new** numbered seed (or migration) with the change |
| Repeated-execution seed (`${__filename}-${new Date().toISOString()}` identifier, e.g. `zz_shared/03_upsert_reports_with_country_specific.js`) | Re-runs on **every** deploy | Editing the file (or the fixtures it reads) reaches production on the next deploy |
| File **not yet shipped** to production (unmerged branch) | Will run once, with its final content | Free to alter in place |

Dev/test never constrain this decision — they rebuild from scratch either way. Only the production ledger (`AspectSeed` / knex migrations table) makes history immutable.

## Creating New Seeds

### 1. Naming Convention
```
[number]_[descriptive_name].js
```
Examples:
- `01_initial_setup.js`
- `15_add_new_feature_data.js`
- `66_change_id_strings_to_numbers.js`

### 2. Basic Structure
```javascript
const { seed } = require('../utils')

module.exports = seed(async knex => {
  // Your seeding logic here
  
  // Example: Upsert data
  const data = [
    { externalId: 'example1', name: 'Example 1' },
    { externalId: 'example2', name: 'Example 2' }
  ]
  
  for (const item of data) {
    await knex('YourTable')
      .insert(item)
      .onConflict('externalId')
      .merge()
  }
}, __filename) // Static for one-time execution
```

### 3. Using Shared Utilities
```javascript
const { upsertItems, getPartnerByExternalId } = require('../utils')

// Batch upsert with conflict resolution
await upsertItems(knex, 'TableName', ['externalId'], dataArray)

// Get partner ID by external ID
const { id: partnerId } = await getPartnerByExternalId(knex, 'partner-external-id')
```

## Best Practices

### 1. Idempotency
- All seeds should be idempotent (safe to run multiple times)
- Use upsert patterns instead of direct inserts
- Check for existing data before operations

### 2. Error Handling
```javascript
try {
  // Seeding operations
} catch (error) {
  console.log(`Error in seed: ${error.message}`)
  throw error // Re-throw to fail the deployment
}
```

### 3. Performance
- Use batch operations for large datasets
- Implement proper indexing for lookup operations
- Use transactions for related operations

### 4. Data Validation
```javascript
// Validate required external IDs exist
const requiredIds = await knex('ReferenceTable')
  .whereIn('externalId', requiredExternalIds)
  .pluck('externalId')

if (requiredIds.length !== requiredExternalIds.length) {
  throw new Error('Missing required reference data')
}
```

## Migration vs Seeding

### Migrations
- **Purpose**: Schema changes (tables, columns, indexes)
- **Execution**: Linear, versioned
- **Rollback**: Supported with down functions

### Seeds
- **Purpose**: Data population and configuration
- **Execution**: Environment-dependent
- **Rollback**: Manual, data-dependent

## Troubleshooting

### Common Issues
1. **Missing Dependencies**: Ensure referenced tables/data exist
2. **External ID Conflicts**: Use proper conflict resolution strategies
3. **Performance Issues**: Implement batching for large datasets
4. **Environment Differences**: Check shared seed execution settings

### Debugging
```javascript
// Add logging for debugging
console.log(`Processing ${items.length} items`)
console.log(`Current item: ${JSON.stringify(item)}`)
```

## Related Files
- `api/seeds/utils.js` - Core seeding utilities
- `api/src/shared/dictionary.js` - ID mapping utilities
- `api/seeds/fixtures/` - Static data definitions
- `api/knexfile.js` - Database configuration
