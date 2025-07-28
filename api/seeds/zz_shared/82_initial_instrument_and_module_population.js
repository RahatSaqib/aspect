module.exports = require('../utils').seed(async knex => {
  await knex.raw(`update Site set name = 'Test Site' where id > 0`)
  // ### Initial instrument and module population seed
  await knex.raw(`insert into Instrument (deviceId, serial, active, currentDeviceId)
select d.id                as deviceId,
       r.instrumentSerial  as serial,
       -- Add moved flag (1 if the instrument used in another device with later endedOn date)
       (case
            when exists (select 1
                         from Result          r2
                                  join Device d2 on d2.id = r2.deviceId
                         where r2.instrumentSerial = r.instrumentSerial
                           and r2.deviceId != d.id
                           and r2.endedOn > max(r.endedOn)) then 0
            else 1 end)    as active,
       (case
            when exists (select 1
                         from Result          r2
                                  join Device d2 on d2.id = r2.deviceId
                         where r2.instrumentSerial = r.instrumentSerial
                           and r2.deviceId != d.id
                           and r2.endedOn > max(r.endedOn)) then
                (select d2.id
                 from Result          r2
                          join Device d2 on d2.id = r2.deviceId
                 where r2.instrumentSerial = r.instrumentSerial
                   and r2.endedOn > max(r.endedOn)
                 order by r2.endedOn desc
                 limit 1)
            else null end) as currentDeviceId
from Device          as d
         join Result as r on d.id = r.deviceId
group by d.id, r.instrumentSerial
order by instrumentSerial, max(r.endedOn) desc;`)

  await knex.raw(`insert into Module (deviceId, instrumentId, serial, name, startedOn, lastSeenOn, removedOn)
select r.deviceId, 
       i.id as instrumentId, 
       trim(r.moduleSerial) as serial, 
       r.moduleName as name,
       min(r.endedOn) as startedOn,
       max(r.endedOn) as lastSeenOn,
       null as removedOn
from Result                   as r
         left join Instrument as i on r.deviceId = i.deviceId and r.instrumentSerial = i.serial
group by r.deviceId, i.id, r.moduleSerial, r.moduleName;`)
}, __filename)
