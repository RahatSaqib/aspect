/**
 * Generates AFTER UPDATE and AFTER DELETE triggers for a given table,
 * which insert the OLD row into an audit table (prefixed with 'z_').
 * The audit table must already exist and have all columns nullable.
 * Assumes the audit table always has a 'auditTime' field.
 *
 * @param {object} knex - Knex instance
 * @param {string} tableName - The name of the table to audit (e.g., 'Sample')
 * @param {string} auditTableName - The name of the audit table (e.g., 'z_Sample')
 */
async function addAuditoryTriggers(knex, tableName, auditTableName) {
  // Get column names from the audit table
  const columnsInfo = await knex(auditTableName).columnInfo()
  const columns = Object.keys(columnsInfo)
  // Compose column list for SQL (MySQL uses backticks for identifiers)
  const columnList = columns.map(col => `\`${col}\``).join(',\n  ')
  // Compose OLD value list for SQL, using NOW() for 'auditTime'
  const valueList = columns.map(col => (col === 'auditTime' ? 'NOW()' : `OLD.\`${col}\``)).join(',\n  ')

  // Generate trigger for UPDATE
  const updateTriggerName = `trg_${auditTableName}_update`
  // Drop trigger if exists (MySQL requires this for idempotency)
  await knex.raw(`DROP TRIGGER IF EXISTS \`${updateTriggerName}\`;`)
  await knex.raw(`
    CREATE TRIGGER \`${updateTriggerName}\`
    AFTER UPDATE ON \`${tableName}\`
    FOR EACH ROW
    BEGIN
      INSERT INTO \`${auditTableName}\` (
        ${columnList}
      ) VALUES (
        ${valueList}
      );
    END
  `)

  // Generate trigger for DELETE
  const deleteTriggerName = `trg_${auditTableName}_delete`
  await knex.raw(`DROP TRIGGER IF EXISTS \`${deleteTriggerName}\`;`)
  await knex.raw(`
    CREATE TRIGGER \`${deleteTriggerName}\`
    AFTER DELETE ON \`${tableName}\`
    FOR EACH ROW
    BEGIN
      INSERT INTO \`${auditTableName}\` (
        ${columnList}
      ) VALUES (
        ${valueList}
      );
    END
  `)
}

module.exports = {
  addAuditoryTriggers,
}
