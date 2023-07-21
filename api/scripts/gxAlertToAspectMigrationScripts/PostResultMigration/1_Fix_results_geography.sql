-- Diagnostic
-- Query mismatches by externalId
select count(*) -- 348469
from Result as aspectResult
         join mig_all_results as gxAlertResult
              on gxAlertResult.uniqueId = aspectResult.externalId
                  or gxAlertResult.CartridgeSerial = aspectResult.consumableSerial
         left join Geography as aspectGeography
                   on aspectResult.geographyId = aspectGeography.id
         left join Lga as aspectLga
                   on aspectGeography.lgaId = aspectLga.id
         left join State as aspectState
                   on aspectState.id = aspectGeography.stateId
where not (gxAlertResult.state <=> aspectState.name)
   or not (gxAlertResult.lga <=> aspectLga.name);

-- All geographies mismatches between Aspect and Gxalert, group by case and with incidence.
select aspectState,
       aspectLga,
       gxState,
       gxLga,
       gxAlertState.name   stateFinal,
       gxAlertState.name   lgaFinal,
       gxAlertGeography.id geography,
       count               incidence
from (select gxAlertState.id        aspectTargetStateId,
             aspectState.name       aspectState,
             gxAlertLga.id          aspectTargetLgaId,
             aspectLga.name         aspectLga,
             gxAlertResult.state    gxState,
             gxAlertResult.lga      gxLga,
             count(aspectResult.id) count
      from Result as aspectResult
               join mig_all_results as gxAlertResult
                    on gxAlertResult.uniqueId = aspectResult.externalId
               left join Geography as aspectGeography
                         on aspectResult.geographyId = aspectGeography.id
               left join Lga as aspectLga
                         on aspectGeography.lgaId = aspectLga.id
               left join State as aspectState
                         on aspectState.id = aspectGeography.stateId
               left join State as gxAlertState
                         on gxAlertState.name = gxAlertResult.state
               left join Lga as gxAlertLga
                         on gxAlertLga.name = gxAlertResult.lga
      where not (gxAlertResult.state <=> aspectState.name)
         or not (gxAlertResult.lga <=> aspectLga.name)
      group by aspectState.name, aspectLga.name, gxAlertResult.state, gxAlertResult.lga) temp
         left join State as gxAlertState
                   on gxAlertState.name = temp.gxState
         left join Lga as gxAlertState
                   on gxAlertState.name = temp.gxLga
         left join Geography as gxAlertGeography
                   on gxAlertGeography.stateId = gxAlertState.id
                       and gxAlertGeography.lgaId = gxAlertState.id;

-- 👉 Start of process:

-- Create table with geography mismatches by ExternalId
create table mig_tmp_result_geography_pivot as
select aspectResult.id     resultId,
       gxAlertGeography.id geographyId
from Result as aspectResult
         join mig_all_results as gxAlertResult
              on gxAlertResult.UniqueId = aspectResult.externalId
         left join Geography as aspectGeography
                   on aspectResult.geographyId = aspectGeography.id
         left join Lga as aspectLga
                   on aspectGeography.lgaId = aspectLga.id
         left join State as aspectState
                   on aspectState.id = aspectGeography.stateId
         left join State as gxAlertState
                   on gxAlertState.name = gxAlertResult.state
         left join Lga as gxAlertLga
                   on gxAlertLga.name = gxAlertResult.lga
         left join aspectGeography as gxAlertGeography
                   on gxAlertGeography.stateId = gxAlertState.id
                       and gxAlertGeography.lgaId = gxAlertLga.id
where not (gxAlertResult.state <=> aspectState.name)
   or not (gxAlertResult.lga <=> aspectLga.name);

-- create index by resultId on tmp pivot table
create index ix_mig_tmp_result_geography_pivot_id
    on mig_tmp_result_geography_pivot (resultId);

-- complete with any mismatch that we can still find by consumableSerial
insert into mig_tmp_result_geography_pivot
select aspectResult.id as resultId,
       gxAlertGeography.id as geographyId
from Result as aspectResult
         join mig_all_results as gxAlertResult
              on gxAlertResult.CartridgeSerial = aspectResult.consumableSerial
         left join Geography as aspectGeography
                   on aspectResult.geographyId = aspectGeography.id
         left join Lga as aspectLga
                   on aspectGeography.lgaId = aspectLga.id
         left join State as aspectState
                   on aspectState.id = aspectGeography.stateId
         left join State as gxAlertState
                   on gxAlertState.name = gxAlertResult.state
         left join Lga as gxAlertLga
                   on gxAlertLga.name = gxAlertResult.lga
         left join Geography as gxAlertGeography
                   on gxAlertGeography.stateId = gxAlertState.id and gxAlertGeography.lgaId = gxAlertLga.id
         left join mig_tmp_result_geography_pivot as pivotTable
                   on pivotTable.resultId = aspectResult.id
where pivotTable.resultId is null
  and (not (gxAlertResult.state <=> aspectState.name)
    or not (gxAlertResult.lga <=> aspectLga.name));

-- update geographies
update Result
    join mig_tmp_result_geography_pivot pivotTable
    on pivotTable.resultId = Result.id
set Result.geographyId = pivotTable.geographyId;

-- drop temporary table
drop table mig_tmp_result_geography_pivot;