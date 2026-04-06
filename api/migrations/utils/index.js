// Adds createdOn, createdBy
function addCreateFields(table) {
  table.dateTime('createdOn').notNullable()
  table.integer('createdBy').notNullable().unsigned().index().references('id').inTable('User')
}

// Adds updatedOn, updatedBy
function addUpdateFields(table) {
  table.dateTime('updatedOn').notNullable()
  table.integer('updatedBy').notNullable().unsigned().index().references('id').inTable('User')
}

function addAuditFields(table) {
  addCreateFields(table)
  addUpdateFields(table)
}

function addAuditFieldsNullable(table) {
  addCreateFieldsNullable(table)
  addUpdateFieldsNullable(table)
}

function addCreateFieldsNullable(table) {
  table.dateTime('createdOn')
  table.integer('createdBy').unsigned().index().references('id').inTable('User')
}

// Adds updatedOn, updatedBy
function addUpdateFieldsNullable(table) {
  table.dateTime('updatedOn')
  table.integer('updatedBy').unsigned().index().references('id').inTable('User')
}

/**
 * Adds auditory fields to a Knex migration table for tracking timestamps and user references.
 *
 * @param {Knex.SchemaBuilder} table - The Knex table object.
 * @param {object} options - Options for configuring the auditory fields.
 * @param {boolean} [options.nullable] - Indicates whether the timestamps can be nullable (default is false).
 * @param {boolean} [options.update] - Indicates whether to include updated timestamps (default is true).
 * @param {object} [options.by] - Indicates if user name fields shall be added.
 * @param {boolean} [options.by.nullable] - Indicates whether user fields can be nullable (default is false).
 
 * @example
 * addTimestamps("Person", { nullable: true, update: false, by: { nullable: true } });
 */
function addTimestamps(table, { nullable = false, update = true, by } = {}) {
  if (nullable) {
    table.dateTime('createdOn')
    if (update) {
      table.dateTime('updatedOn')
    }
  } else {
    table.dateTime('createdOn').notNullable()
    if (update) {
      table.dateTime('updatedOn').notNullable()
    }
  }

  if (by) {
    /**
     * createdBy
     */
    let createdBy = table.integer('createdBy')
    if (!by.nullable) {
      createdBy = createdBy.notNullable()
    }
    createdBy.unsigned().index().references('id').inTable('User')

    if (update) {
      /**
       * updatedBy
       */
      let updatedBy = table.integer('updatedBy')
      if (!by.nullable) {
        updatedBy = updatedBy.notNullable()
      }
      updatedBy.unsigned().index().references('id').inTable('User')
    }
  }
}

module.exports = {
  addCreateFields,
  addUpdateFields,
  addCreateFieldsNullable,
  addUpdateFieldsNullable,
  addTimestamps,
  addAuditFields,
  addAuditFieldsNullable,
}
