module.exports = require('../utils').seed(async knex => {
  // Initial instrument and module population seed
  await knex.raw(`insert into Instrument (deviceId, serial, macAddress, createdOn, createdBy, updatedOn, updatedBy)
select d.id                as deviceId,
       r.instrumentSerial  as serial,
       null as macAddress,
       now() as createdOn,
       1 as createdBy,
       now() as updatedOn,
       1 as updatedBy
from Device          as d
         join Result as r on d.id = r.deviceId
group by d.id, r.instrumentSerial
order by instrumentSerial, max(r.endedOn) desc;`)
}, __filename)
