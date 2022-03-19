module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw(`CREATE FUNCTION GetWeekdaysInRange(endDate datetime, startDate datetime)
    RETURNS int
    DETERMINISTIC
    BEGIN
      -- Calculate the number of weekdays between two dates
      -- See here: https://stackoverflow.com/a/6762805
      RETURN 5 * (DATEDIFF(endDate, date_sub(startDate, interval 1 day)) DIV 7) + MID('0123444401233334012222340111123400001234000123440', 7 * WEEKDAY(date_sub(startDate, interval 1 day)) + WEEKDAY(endDate) + 1, 1);
    END`)
}

async function down(knex) {
  await knex.raw('DROP FUNCTION GetWeekdaysInRange')
}
