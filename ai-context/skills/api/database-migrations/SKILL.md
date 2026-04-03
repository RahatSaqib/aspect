---
name: database-migrations
description: Use when creating or modifying database migrations, understanding schema changes, or working with the migration system in the Aspect project.
---

# Database migrations

To handle database structure the system uses normal knex migrations in the `api/migrations` folder.
To generate a new migration: `yarn knex migrate:make [migration_name]`.

## Example migration

```javascript
module.exports = require('../src/db').migration(up, down);

const { addAuditFields } = require('./utils');

async function up(knex) {
  await knex.schema.createTable('Patient', (patient) => {
    patient.increments('id').primary();
    patient
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner');
    patient.string('externalId').notNullable();
    patient.boolean('reliable').notNullable().default(false);
    patient.boolean('died').notNullable().default(false);
    patient.json('data').notNullable();
    addAuditFields(patient);
  });
  await knex.schema.alterTable('Sample', (sample) => {
    sample
      .integer('patientId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Patient');
  });
}

async function down(knex) {
  await knex.schema.alterTable('Sample', (sample) => {
    sample.dropForeign('patientId');
    sample.dropColumn('patientId');
  });
  await knex.schema.dropTable('Patient');
}
```

> Database tables should never use cascade delete or defaults on delete.

## Audit fields

If not specified otherwise, the audit fields must be created in all tables.

In the file `api/migrations/utils/index.js` the method `addAuditFields` will do the job.

Fields created:

`createdBy`, `integer` not nullable, points to `User.id`.
`createdOn`, `datetime` not nullable.
`updatedBy`, `integer` not nullable, points to `User.id`.
`updatedOn`, `datetime` not nullable.
