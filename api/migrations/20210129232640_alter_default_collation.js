const Promise = require('bluebird')
const config = require('../src/config')
module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  /**
   * Alter collation to it's server default.
   * There will be an update in our current devops script to set up all this things as a default
   */

  await knex.raw(`ALTER DATABASE \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)

  const [alterTableQueries] = await knex.raw(
    "SELECT CONCAT('ALTER TABLE `', tbl.`TABLE_SCHEMA`, '`.`', tbl.`TABLE_NAME`, '` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;') as query FROM `information_schema`.`TABLES` tbl WHERE tbl.`TABLE_SCHEMA` = ? AND TABLE_COLLATION<>'utf8mb4_unicode_ci';",
    [config.db.database]
  )

  const [alterColumnQueries] = await knex.raw(
    // eslint-disable-next-line no-useless-escape
    "SELECT CONCAT('ALTER TABLE `', col.`TABLE_SCHEMA`, '`.`', col.`TABLE_NAME`, '` change column `',col.COLUMN_NAME, '` ','`',col.COLUMN_NAME ,'` varchar(',character_maximum_length,') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ', CASE col.IS_NULLABLE WHEN 'NO' THEN 'NOT NULL' ELSE 'NULL' END, CASE WHEN column_default IS NOT NULL THEN CONCAT( ' DEFAULT ', ? ,column_default, ? ) ELSE '' END) as query FROM INFORMATION_SCHEMA.COLUMNS col WHERE col.DATA_TYPE = 'varchar' AND TABLE_SCHEMA=? AND (COLLATION_NAME<>'utf8mb4_unicode_ci' OR CHARACTER_SET_NAME<>'utf8mb4');",
    ["'", "'", config.db.database]
  )

  await Promise.each(alterTableQueries, tableQuery => knex.raw(tableQuery.query))

  await Promise.each(alterColumnQueries, columnQuery => knex.raw(columnQuery.query))
}

// eslint-disable-next-line no-unused-vars
async function down(knex) {
  await knex.raw(`ALTER DATABASE ${config.db.database} CHARACTER SET utf8 COLLATE utf8_general_ci;`)

  const [alterTableQueries] = await knex.raw(
    "SELECT CONCAT('ALTER TABLE `', tbl.`TABLE_SCHEMA`, '`.`', tbl.`TABLE_NAME`, '` CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;') as query FROM `information_schema`.`TABLES` tbl WHERE tbl.`TABLE_SCHEMA` = ? AND TABLE_COLLATION<>'utf8mb4_unicode_ci';",
    [config.db.database]
  )

  const [alterColumnQueries] = await knex.raw(
    "SELECT CONCAT('ALTER TABLE ', col.`TABLE_SCHEMA`, '.', col.`TABLE_NAME`, ' change column `',col.COLUMN_NAME, '` ','`',col.COLUMN_NAME ,'` varchar(',character_maximum_length,') CHARACTER SET utf8 COLLATE utf8_general_ci ', CASE col.IS_NULLABLE WHEN 'NO' THEN 'NOT NULL' ELSE 'NULL' END, CASE WHEN column_default IS NOT NULL THEN CONCAT( ' DEFAULT ',?, column_default, ? ) ELSE '' END) as query FROM INFORMATION_SCHEMA.COLUMNS col WHERE col.DATA_TYPE = 'varchar' AND TABLE_SCHEMA=? AND (COLLATION_NAME='utf8mb4_unicode_ci' OR CHARACTER_SET_NAME='utf8mb4');",
    ["'", "'", config.db.database]
  )

  await Promise.each(alterTableQueries, tableQuery => knex.raw(tableQuery.query))

  await Promise.each(alterColumnQueries, columnQuery => knex.raw(columnQuery.query))
}
