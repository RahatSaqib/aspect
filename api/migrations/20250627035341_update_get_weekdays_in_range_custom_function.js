module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw('DROP FUNCTION IF EXISTS GetWeekdaysInRangeCustom')

  await knex.raw(`
create function GetWeekdaysInRangeCustom(endDate date,
                                        startDate date,
                                        excludedDays varchar(20),
                                        daysPerYear int,
                                        daysPerQuarter int,
                                        daysPerMonth int) returns int
    deterministic
begin 

    declare monthDifference INT;
    declare startDay INT;
    declare standardPeriodDays INT;
    declare totalDays int;
    declare excludedDaysCount int default 0;
    declare currentDate datetime;
    declare daysToExclude varchar(20);


    set startDay = day(startDate);

    -- Check if start date is first of month and end date is last of month
    if startDay = 1 and date(endDate) = last_day(endDate) then
        set monthDifference = timestampdiff(month, startDate, endDate) + 1;

        set standardPeriodDays = case monthDifference
                                     when 1 then daysPerMonth
                                     when 3 then daysPerQuarter
                                     when 12 then daysPerYear
                                     else null
            end;
        if standardPeriodDays is not null then
            return standardPeriodDays;
        end if;
    end if;


    set daysToExclude = coalesce(excludedDays, '1,7');
    set totalDays = datediff(endDate, startDate) + 1;
    set currentDate = startDate;

    while currentDate <= endDate
        do
            if find_in_set(dayofweek(currentDate), daysToExclude) then
                set excludedDaysCount = excludedDaysCount + 1;
            end if;
            set currentDate = date_add(currentDate, interval 1 day);
        end while;

    return totalDays - excludedDaysCount;
end;`)
}

async function down(knex) {
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
