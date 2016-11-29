const config = require('./config')

const schema = config.db.database

function* createAuditTriggers(knex, ...tables) {
  for (const table of tables) {
    const columns = yield knex
      .withSchema('information_schema')
      .from('columns')
      .where({ table_schema: schema, table_name: table })
      .orderBy('ordinal_position')
      .select('column_name')
      .map(row => row.column_name)
    const columnFields = columns.map(c => `'${c}', new.${c}`).join(', ')

    yield knex.raw(`drop trigger if exists AuditLogInsert${table}`)
    yield knex.raw(`
      create trigger AuditLogInsert${table}
      after insert on ${table}
      for each row
          insert into AuditLog
              (tableName, tableId, operation, fields, createdOn)
          values
              ('${table}', new.id, 'insert', json_object(${columnFields}), now())`)

    yield knex.raw(`drop trigger if exists AuditLogUpdate${table}`)
    yield knex.raw(`
      create trigger AuditLogUpdate${table}
      after update on ${table}
      for each row
          insert into AuditLog
              (tableName, tableId, operation, fields, createdOn)
          values
              ('${table}', new.id, 'update', json_object(${columnFields}), now())`)

    yield knex.raw(`drop trigger if exists AuditLogDelete${table}`)
    yield knex.raw(`
      create trigger AuditLogDelete${table}
      after delete on ${table}
      for each row
          insert into AuditLog
              (tableName, tableId, operation, fields, createdOn)
          values
              ('${table}', old.id, 'delete', json_object(), now())`)
  }
}


function* dropAuditTriggers(knex, ...tables) {
  for (const table of tables) {
    yield knex.raw(`drop trigger if exists AuditLogInsert${table}`)
    yield knex.raw(`drop trigger if exists AuditLogUpdate${table}`)
    yield knex.raw(`drop trigger if exists AuditLogDelete${table}`)
  }
}

module.exports = {
  createAuditTriggers,
  dropAuditTriggers
}
