module.exports = require('../utils').seed(async knex => {
  // Initial instrument and module population seed
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
select deviceId,
       (select id from Instrument as i where i.serial = t.instrumentSerial and t.deviceid = i.deviceId) as instrumentId,
       moduleSerial                                                                                     as serial,
       trim(moduleName)                                                                                       as name,
       first                                                                                            as startedOn,
       last                                                                                             as lastSeenOn,
       case when moved then last else null end                                                          as removedOn
from (select d.id           as deviceId,
             r.instrumentSerial,
             r.moduleSerial,
             r.moduleName,
             min(r.endedOn) as first,
             max(r.endedOn) as last,
             case
                 when latest.moduleSerial is not null
                     then 1
                 else 0 end as moved
      from Device          as                                                                     d
               join Result as                                                                     r
                    on d.id = r.deviceId
               left join (select r_latest.moduleSerial,
                                 r_latest.instrumentSerial,
                                 r_latest.moduleName,
                                 r_latest.deviceId,
                                 r_latest.endedOn
                          from Result                                 r_latest
                                   inner join (select moduleSerial, max(endedOn) as maxEndedOn
                                               from Result
                                               group by moduleSerial) latest_dates
                                              on r_latest.moduleSerial = latest_dates.moduleSerial
                                                  and r_latest.endedOn = latest_dates.maxEndedOn
                          group by moduleSerial, instrumentSerial, moduleName, deviceId, endedOn) latest
                         on latest.moduleSerial = r.moduleSerial
                             and (latest.instrumentSerial <> r.instrumentSerial or
                                  latest.moduleName <> r.moduleName or
                                  latest.deviceId <> d.id)
      where r.instrumentSerial is not null and r.moduleSerial is not null
      group by d.id, r.instrumentSerial, r.moduleSerial, r.moduleName,
               latest.deviceId, latest.instrumentSerial, latest.moduleName
      order by r.instrumentSerial, r.moduleSerial) as t
order by moduleSerial, first;`)
}, __filename)
