# Database migrations

To handle database structure the system use normal knex migrations in the `/api.migrations` folder.
To genearate a new migration: ` yarn knex migrate:make [migration_name]`.
## Example migration

module.exports = require('../src/db').migration(up, down)

const { addAuditFields } = require('./utils')

``` javascript
const { addAuditFields } = require('./utils')

module.exports.up = async function up(knex) {
  await knex.schema..createTable('Patient', patient => {
    patient.increments('id').primary()
    patient.integer('partnerId').unsigned().index().references('id').inTable('Partner')
    patient.string('externalId').notNullable()
    patient.boolean('reliable').notNullable().default(false)
    patient.boolean('died').notNullable().default(false)
    patient.json('data').notNullable()
    addAuditFields(patient)
  })
  await knex.schema.alterTable('Sample', sample => {
    sample.integer('patientId').unsigned().index().references('id').inTable('Patient')
  })
}

module.exports.down  = async function(knex) {
  await knex.schema.alterTable('Sample', sample => {
    sample.dropForeign('patientId')
    sample.dropColumn('patientId')
  })
  await knex.schema.dropTable('Patient')
}
```
> Database tables should never use cascade delete or defaults on delete.

## Auditory fields

If not specified otherwise, the audotory fields must be created in all tables.

In the file `/api/migrations/utils/index.js` the method `addAuditFields` will do the job.

Fields crated:

`createdBy`, `integer` not nullable, points to `User.id`.
`createdOn`, `datetime` not nullable.
`UpdatedBy`, `integer` not nullable, points to `User.id`.
`UpdatedOn`, `datetime` not nullable.
