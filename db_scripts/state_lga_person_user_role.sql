/*
INSERT INTO `aspect`.`country`(`name`, `abbreviation`, `a3`,`culture`,`country_code`,`state_label`,`lga_label`,`timezone`,`port_number`,`export_columns`,`month_starts_on_day`,`tag_prefix`,`tag_regex_sampleId`,`tag_regex_patientId`,`tag_regex_notes`,`patient_phone_regex`,`notes_sms_text`,`inventory_days_threshold`,`week_starts_on_day`,`test_eqa_regex`)
SELECT `Name`, `Abbreviation`, `A3`, `Culture`, `CountryCode`, `StateLabel`, `LgaLabel`, `TimeZoneId`, `PortNumber`, `ExportColumns`, `MonthStartsOnDay`, `TagPrefix`, `TagRegexSampleId`, `TagRegexPatientId`, `TagRegexNotes`, `PhoneRegex`, `NotesSmsText`, `InventoryDaysThreshold`, `WeekStartsOnDay`, `TestEqaRegex`
FROM `bigpicture`.`country`;
*/


-- This script migrates states, lgas, users, and persons by country

-- country id to import into aspect
set @bigPictureCountryId = 1;

-- ID of that country in aspect
set @aspectCountryId = 1;



INSERT INTO `aspect`.`state`
(`country_id`, `name`, `abbreviation`)
select @aspectCountryId, name, abbreviation
from bigpicture.state
where countryId = @bigPictureCountryId
and not exists (select id from aspect.state where country_id = @aspectCountryId);



INSERT INTO aspect.lga(state_id, name)
select sa.id, l.name
from bigpicture.lga l
inner join bigpicture.state s on l.StateId = s.StateId
inner join aspect.state sa on s.name = sa.name and sa.country_id = @aspectCountryId
where s.countryId = @bigPictureCountryId
and not exists (select l.id from aspect.lga l inner join aspect.state s on l.state_id = s.id where country_id = @aspectCountryId);



INSERT INTO aspect.user(name, password, password_key, approved,
						last_active, last_login, last_password_change, 
						created_on, locked_out, failed_password_attempts)
select u.name, password, passwordkey, isApproved, m.lastactivitydate, lastlogindate, lastpasswordchangeddate, creationdate,
		islockedout, failedpasswordattemptcount
from bigpicture.my_aspnet_users u
inner join bigpicture.my_aspnet_membership m on u.id = m.userId
inner join bigpicture.person p on u.id = p.userId and p.countryId = @bigPictureCountryId
and u.name not in (select name from aspect.user);


insert into aspect.user_role (user_id, role_id)
select au.id, ar.id
from bigpicture.my_aspnet_usersinroles uir
inner join bigpicture.my_aspnet_users u on uir.userId = u.id
inner join bigpicture.my_aspnet_roles r on uir.roleId = r.id
inner join bigpicture.person p on u.id = p.userId

inner join aspect.user au on u.name = au.name
inner join aspect.role ar on r.name = ar.name

where p.countryId = @bigPictureCountryId
and au.id not in (select aur.user_id from aspect.user_role aur);




INSERT INTO aspect.person (	user_id, name, title, email, email2, phone, cell, country_id, state_id, 
							lga_id, person_level_id, notes, last_country_id, timezone, hide_patient_id, 
 							hide_sample_id, hide_notes, culture, accepted_license_on, created_on, 
							created_by, updated_on, updated_by)                             

select  distinct au.id, p.name, p.title, p.email, p.emailalt, p.phone, p.cell, @aspectCountryId, sa.id,
 		al.id, pl.id, notes, lastviewedcountryid, timezoneid, hidePatientId,
         hideSampleId, hideNotes, culture, AcceptedLicenseOn, createdon,
 		auc.id, updatedOn, auu.id
        
from bigpicture.person p

left outer join bigpicture.my_aspnet_users u on p.userId = u.id
left outer join aspect.user au on u.name = au.name

left outer join bigpicture.state s on p.stateId = s.stateId and s.countryId = @bigPictureCountryId
left outer join aspect.state sa on s.name = sa.name and sa.country_id = @aspectCountryId

left outer join bigpicture.lga l on p.lgaId = l.lgaId 
left outer join aspect.lga al on l.name = al.name

left outer join bigpicture.role r on p.roleId = r.roleId
left outer join aspect.person_level pl on pl.name = r.name

inner join bigpicture.my_aspnet_users uc on p.createdBy = uc.id
inner join aspect.user auc on uc.name = auc.name

inner join bigpicture.my_aspnet_users uu on p.updatedBy = uu.id
inner join aspect.user auu on uu.name = auu.name

where p.countryId = @bigPictureCountryId
and au.id not in (select user_id from aspect.person where country_id = @aspectCountryId);



