set @bpCountryId = 1;
set @aspectCountryId = 1;

-- import locations
INSERT INTO aspect.location (name, shortname, identifier, country_id, state_id, lga_id, city,
  street1, street2, zip, longitude, latitude, timezone_id, hours_start, hours_end, 
  created_on, created_by, updated_on, updated_by)
select  ifnull(Description, dep.HostId) as Name, ShortName, dep.DeploymentId as Identifier, 
      @aspectCountryId as country_id, sa.id as state_id, sl.id as lga_id,
        city, street1, street2, zip, longitude, latitude,
        timezoneid, OperationStartTime, OperationEndTime,
        dep.insertedon, auc.id as created_by, dep.updatedOn, auu.id as updated_by
from bigpicture.deployment dep
left outer join bigpicture.state s on dep.StateId = s.StateId
left outer join aspect.state sa on sa.country_id = @aspectCountryId and sa.name = s.name
left outer join bigpicture.lga l on dep.LgaId = l.LgaId
left outer join bigpicture.state ls on l.stateId = ls.StateId and ls.countryid = @bpCountryId
left outer join aspect.lga sl on sl.name = l.name and ls.countryId = @bpCountryId
inner join aspect.user auc on dep.InsertedBy = auc.name
inner join aspect.user auu on dep.updatedby = auu.name
where dep.countryId = @bpCountryId
and ifnull(dep.Description, dep.HostId) not in (select name from aspect.location where country_id = @aspectCountryId);


-- import inventory location
INSERT INTO aspect.location (name, shortname, identifier, country_id, state_id, lga_id, city,
  street1, street2, zip, longitude, latitude, timezone_id, hours_start, hours_end, 
  created_on, created_by, updated_on, updated_by)
select  il.name, null, il.InventoryLocationId as Identifier, 
      @aspectCountryId as country_id, sa.id as state_id, sl.id as lga_id,
        city, street1, street2, zip, null, null, 
        'Eastern Standard Time', 540, 1020,
        il.insertedon, auc.id as created_by, il.updatedOn, auu.id as updated_by
from bigpicture.inventorylocation il
left outer join bigpicture.state s on il.StateId = s.StateId
left outer join aspect.state sa on sa.country_id = @aspectCountryId and sa.name = s.name
left outer join bigpicture.lga l on il.LgaId = l.LgaId
left outer join bigpicture.state ls on l.stateId = ls.StateId and ls.countryid = @bpCountryId
left outer join aspect.lga sl on sl.name = l.name and ls.countryId = @bpCountryId
inner join aspect.user auc on il.InsertedBy = auc.name
inner join aspect.user auu on il.updatedby = auu.name
where il.countryId = @bpCountryId
and il.name not in (select name from aspect.location where country_id = @aspectCountryId);


-- deployments/devices
INSERT INTO aspect.device (device_type_id, id1,id2,id3,id4,serial,host_id,computer_id,location_id,
  name,shortname,notes,hide_on_dashboard,last_ping_on,
  last_ping_from,computer_culture, computer_os, computer_timezone,
  last_calibrated, put_in_service, put_in_service_source, db_version,
  db_ok, lis_config,lis_ok,daily_details_on, aspect_client_version,
  custom_fields_enabled, custom_fields_sent_on, custom_fields_enabled_on_device,
  approved,approved_on,approved_by,created_on,created_by, updated_on, updated_by)
select adt.id, dev.ComputerId as id1, concat(concat(c.Abbreviation, '_'), concat(dev.Serial, concat('_', dep.HostId))) as id2, 
        concat(concat(c.Abbreviation, '_'), dev.Serial) as id3, 
        concat(concat(c.Abbreviation, '_'), dev.HostId) as id4,
        dev.Serial, dev.HostId, dev.ComputerId,
        l.id as location_id, ifnull(dep.description, dep.HostId) as name, dep.shortname, dep.notes,
        HideOnDashboard,
        lastpingon, lastpingfrom, ComputerCulture, computerosversion, 
        computertimezoneid, LastCalibrated, PutInService, PutInServiceSource,
        dbversion,  DataBAseDeviceOk as dbOk, lisconfig, LisConfigOk as lisOk, 
        lastdailydetailson, GxConnectVersion as aspectClientVersion, 
        EnableCustomFields, 
        SentCustomFieldsOn, CustomFieldsEnabledOnDevice,
        dep.approved, dep.approvedon, aua.id as approved_by,
        dep.insertedon, auc.id, dep.UpdatedOn, auu.id
from bigpicture.deployment dep
inner join aspect.location l on l.Identifier = dep.DeploymentId
inner join bigpicture.device dev on dep.DeploymentId = dev.CurrentDeploymentId
inner join aspect.country c on c.id = @aspectCountryId
left outer join aspect.user aua on dep.approvedby = aua.name
inner join aspect.user auc on dep.InsertedBy = auc.name
inner join aspect.user auu on dep.updatedby = auu.name
inner join bigpicture.devicetype dt on dev.devicetypeid = dt.devicetypeid
inner join aspect.device_type adt on dt.name = adt.name
where dep.countryId = @bpCountryid
and (dev.ComputerId is null OR dev.ComputerId not in (select id1 from aspect.device))
and (concat(concat(c.Abbreviation, '_'), concat(dev.Serial, concat('_', dep.HostId))) is null OR concat(concat(c.Abbreviation, '_'), concat(dev.Serial, concat('_', dep.HostId))) not in (select id2 from aspect.device))
and (concat(concat(c.Abbreviation, '_'), dev.Serial) is null OR concat(concat(c.Abbreviation, '_'), dev.Serial) not in (select id3 from aspect.device))
and (concat(concat(c.Abbreviation, '_'), dev.HostId) is null OR concat(concat(c.Abbreviation, '_'), dev.HostId) not in (select id4 from aspect.device));


-- deployment history
insert aspect.device_location_history (device_id, location_id, created_on, created_by)
select dev.id, dev.location_id, now(), 1
from aspect.device dev
where dev.id not in (select device_id from aspect.device_location_history);



-- router
insert into aspect.router (location_id, number, sim_reg_number, sim_reg_number_2, 
sim_phone_number, sim_phone_number_2, sim_provider, sim_provider_2, 
sim_suffix, sim_suffix_2, sim_prefix, sim_prefix_2, created_by, created_on, updated_by, updated_on)
select distinct dev.location_id, RouterNumber, SimCardRegistrationNumber, SimCardRegistrationNumber2,
        SimCardPhoneNumber, SimCardPhoneNumber2, SimCardProvider, SimCardProvider2, 
        SimCardSuffix, SimCardSuffix2, SimCardPrefix, SimCardPrefix2,
        1, now(), 1, now()
from bigpicture.deployment dep
inner join bigpicture.country c on dep.countryId = c.countryId
inner join bigpicture.device bpd on dep.DeploymentId = bpd.CurrentDeploymentId
inner join aspect.device dev on ifnull(dev.id1, 'asdfZY') = bpd.ComputerId OR 
                                ifnull(dev.id2, 'asdfZY') = concat(concat(c.Abbreviation, '_'), concat(bpd.Serial, concat('_', dep.HostId))) OR
                                ifnull(dev.id3, 'asdfZY') = concat(concat(c.Abbreviation, '_'), bpd.Serial) OR
                                ifnull(dev.id4, 'asdfZY') = concat(concat(c.Abbreviation, '_'), bpd.HostId)
inner join aspect.location l on dev.location_id = l.id
where dep.countryId = @bpCountryId
and l.country_id = @aspectCountryId
