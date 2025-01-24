module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw('DROP FUNCTION IF EXISTS GetWeekdaysInRange')
  await knex.raw('DROP FUNCTION IF EXISTS GetWeekdaysInRangeCustom')

  await knex.raw(`
    CREATE FUNCTION GetWeekdaysInRangeCustom(endDate DATETIME, startDate DATETIME, excludedDays VARCHAR(20))
    RETURNS INT
    DETERMINISTIC
    BEGIN
      DECLARE totalDays INT;
      DECLARE excludedDaysCount INT DEFAULT 0;
      DECLARE currentDate DATETIME;
      DECLARE daysToExclude VARCHAR(20);
      
      SET daysToExclude = COALESCE(excludedDays, '5,6');
      SET totalDays = DATEDIFF(endDate, startDate) + 1;
      SET currentDate = startDate;
      
      WHILE currentDate <= endDate DO
        IF FIND_IN_SET(DAYOFWEEK(currentDate), daysToExclude) THEN
          SET excludedDaysCount = excludedDaysCount + 1;
        END IF;
        SET currentDate = DATE_ADD(currentDate, INTERVAL 1 DAY);
      END WHILE;

      RETURN totalDays - excludedDaysCount;
    END
  `)

  // Create the 2-parameter version that calls the 3-parameter version
  await knex.raw(`
    CREATE FUNCTION GetWeekdaysInRange(endDate DATETIME, startDate DATETIME)
    RETURNS INT
    DETERMINISTIC
    BEGIN
      RETURN GetWeekdaysInRangeCustom(endDate, startDate, NULL);
    END
  `)
}

async function down(knex) {
  // Drop both functions
  await knex.raw('DROP FUNCTION IF EXISTS GetWeekdaysInRange')
  await knex.raw('DROP FUNCTION IF EXISTS GetWeekdaysInRangeCustom')

  // Restore original version
  await knex.raw(`
    CREATE FUNCTION GetWeekdaysInRange(endDate datetime, startDate datetime)
    RETURNS int
    DETERMINISTIC
    BEGIN
      RETURN 5 * (DATEDIFF(endDate, date_sub(startDate, interval 1 day)) DIV 7) + MID('0123444401233334012222340111123400001234000123440', 7 * WEEKDAY(date_sub(startDate, interval 1 day)) + WEEKDAY(endDate) + 1, 1);
    END
  `)
}
