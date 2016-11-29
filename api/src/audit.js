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

    const createdBy = columns.indexOf('createdBy') > 0 ? 'new.createdBy' : 'null'
    const updatedBy = columns.indexOf('updatedBy') > 0 ? 'new.createdBy' : createdBy
    const deviceId = columns.indexOf('deviceId') > 0 ? 'new.deviceId' : 'null'
    const deviceLogId = '@AuditLog_deviceLogId'

    const columnFields = columns.map(c => `'${c}', new.${c}`).join(', ')
    const fields = `json_object(${columnFields})`

    yield knex.raw(`drop trigger if exists AuditLogInsert${table}`)
    yield knex.raw(`
      create trigger AuditLogInsert${table}
      after insert on ${table}
      for each row
          insert into AuditLog
              (tableName, tableId, operation, fields, deviceId, deviceLogId, createdBy, createdOn)
          values
              ('${table}', new.id, 'insert', ${fields}, ${deviceId}, ${deviceLogId}, ${createdBy}, now())`)

    yield knex.raw(`drop trigger if exists AuditLogUpdate${table}`)
    yield knex.raw(`
      create trigger AuditLogUpdate${table}
      after update on ${table}
      for each row
          insert into AuditLog
              (tableName, tableId, operation, fields, deviceId, deviceLogId, createdBy, createdOn)
          values
              ('${table}', new.id, 'update', ${fields}, ${deviceId}, ${deviceLogId}, ${updatedBy}, now())`)

    const deviceIdOld = deviceId.replace('new', 'old')
    const updatedByOld = updatedBy.replace('new', 'old')
    yield knex.raw(`drop trigger if exists AuditLogDelete${table}`)
    yield knex.raw(`
      create trigger AuditLogDelete${table}
      after delete on ${table}
      for each row
          insert into AuditLog
              (tableName, tableId, operation, fields, deviceId, createdBy, createdOn)
          values
              ('${table}', old.id, 'delete', json_object(), ${deviceIdOld}, ${deviceLogId}, ${updatedByOld},  now())`)
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
