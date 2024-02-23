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

function addCreateFieldsNullable(table) {
  table.dateTime('createdOn')
  table.integer('createdBy').unsigned().index().references('id').inTable('User')
}

// Adds updatedOn, updatedBy
function addUpdateFieldsNullable(table) {
  table.dateTime('updatedOn')
  table.integer('updatedBy').unsigned().index().references('id').inTable('User')
}

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
}
