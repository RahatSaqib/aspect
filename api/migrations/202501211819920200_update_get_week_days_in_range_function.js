module.exports = require('../src/db').migration(up, down)

async function up(knex) {
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
}

async function down(knex) {
  await knex.raw('DROP FUNCTION IF EXISTS GetWeekdaysInRangeCustom')
}
