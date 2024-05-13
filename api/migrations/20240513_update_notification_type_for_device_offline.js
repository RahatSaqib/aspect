/** 
 recurrenceFactor: This determines the recurrence of a notification type
 daysInactive: The number of inactive days for a device to be sent notification
*/
async function up(knex) {
  await knex.schema.table('NotificationType', function (table) {
    table.integer('recurrenceFactor').unsigned()
    table.integer('daysInactive').unsigned()
  })
}

async function down(knex) {
  await knex.schema.table('NotificationType', function (table) {
    table.dropColumn('recurrenceFactor')
    table.dropColumn('daysInactive')
  })
}

module.exports = {
  up,
  down,
}
