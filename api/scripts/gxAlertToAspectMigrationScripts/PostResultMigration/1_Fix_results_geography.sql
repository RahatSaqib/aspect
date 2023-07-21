-- Diagnostic
-- Query mismatches by externalId
SELECT count(*) -- 348469
FROM Result r
         JOIN mig_all_results x ON x.uniqueId = r.externalId or x.CartridgeSerial = r.consumableSerial
         LEFT JOIN Geography g ON r.geographyId = g.id
         LEFT JOIN Lga l ON g.lgaId = l.id
         LEFT JOIN State s ON s.id = g.stateId
WHERE not (x.state <=> s.name)
   or not (x.lga <=> l.name);

-- All geographies mismatches between Aspect and Gxalert, group by case and with incidence.
select aspectState,
       aspectLga,
       gxState,
       gxLga,
       ts.name stateFinal,
       tl.name lgaFinal,
       tg.id   geography,
       count   incidence
from (select ts.id       aspectTargetStateId,
             s.name      aspectState,
             tl.id       aspectTargetLgaId,
             l.name      aspectLga,
             x.state     gxState,
             x.lga       gxLga,
             count(r.id) count
      from Result r
               join mig_all_results x on x.uniqueId = r.externalId
               left join Geography g on r.geographyId = g.id
               left join Lga l on g.lgaId = l.id
               left join State s on s.id = g.stateId
               left join State ts on ts.name = x.state
               left join Lga tl on tl.name = x.lga
      where not (x.state <=> s.name)
         or not (x.lga <=> l.name)
      group by s.name, l.name, x.state, x.lga) t
         left join State ts on ts.name = t.gxState
         left join Lga tl on tl.name = t.gxLga
         left join Geography tg on tg.stateId = ts.id and tg.lgaId = tl.id;

-- 👉 Start of process:

-- Create table with geography mismatches by ExternalId
create table mig_tmp_result_geography_pivot as
select r.id  resultId,
       tg.id geographyId
from Result r
         join mig_all_results x on x.UniqueId = r.externalId
         left join Geography g on r.geographyId = g.id
         left join Lga l on g.lgaId = l.id
         left join State s on s.id = g.stateId
         left join State ts on ts.name = x.state
         left join Lga tl on tl.name = x.lga
         left join Geography tg on tg.stateId = ts.id and tg.lgaId = tl.id
where not (x.state <=> s.name)
   or not (x.lga <=> l.name);

-- create index by resultId on tmp pivot table
create index ix_mig_tmp_result_geography_pivot_id
    on mig_tmp_result_geography_pivot (resultId);

-- complete with  any mismatch that we can still find by consumableSerial
insert into mig_tmp_result_geography_pivot
select r.id  resultId,
       tg.id geographyId
from Result r
         join mig_all_results x on x.CartridgeSerial = r.consumableSerial
         left join Geography g on r.geographyId = g.id
         left join Lga l on g.lgaId = l.id
         left join State s on s.id = g.stateId
         left join State ts on ts.name = x.state
         left join Lga tl on tl.name = x.lga
         left join Geography tg on tg.stateId = ts.id and tg.lgaId = tl.id
         left join mig_tmp_result_geography_pivot p on p.resultId = r.id
where p.resultId is null
  and (not (x.state <=> s.name)
    or not (x.lga <=> l.name));

-- update geographies
update Result
    join mig_tmp_result_geography_pivot t on t.resultId = Result.id
set Result.geographyId = t.geographyId;

-- drop temporary table
drop table mig_tmp_result_geography_pivot;