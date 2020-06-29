-- sites and devices
select 	concat('{"externalId": "', description, '",') as externalId,
concat('"longitude": ', ifnull(longitude, 'null'), ',') as longitude,
concat('"latitude": ', ifnull(latitude, 'null'), ',') as latitude,
concat('"stateName": "', ifnull(s.name, ''), '",') as stateName,
concat('"lgaName": "', ifnull(l.name, ''), '",') as lgaName,
concat('"name": "', description, '",') as name,
concat('"shortName": "', shortName, '",') as shortName,
concat('"timeZoneId": "', timeZoneId, '",') as timeZoneId,
concat('"devices": [{"name": "',  d.description, '", "shortName": "', d.shortName, '", "macAddress": "', dev.ComputerId, '", "hostId": "', d.HostId, '", "serial": "', dev.Serial, '", "gxAlertDeviceId": "', dev.DeviceId, '"}]},')
from deployment d
inner join device dev on d.DeploymentId = dev.CurrentDeploymentId
left outer join state s on d.StateId = s.StateId
left outer join lga l on d.LgaId = l.LgaId
where d.CountryId = @CountryId
and d.Description not like '%SystemOne%'
and d.Description not like '%Stefan%'
and d.Description not like '%Bryan%'
order by d.Description;

-- custom fields
select * from customfieldlimittotesttype;
select concat('{"title": "', Label, '",') as title,
concat('"type": "', `Type`, '",') as `type`,
concat('"order": ', DisplayOrder, ',') as `order`,
concat('"dbColumn": "', DbColumn, '",') as dbColumn,
concat('"testType": null },') as title
from customfield
where CountryId = @CountryId
order by DisplayOrder;

-- contacts
select	concat('{"personName": "', p.Name, '",') as personName,
		concat('"personTitle": "', Title, '",') as personTitle,
        concat('"jobFunctions": ', case when r.Token = 'deployment' then '["Lab User"]' else case when r.Token = 'state' or r.Token = 'lga' then '["Regional Officer"]' else'["Admin"]' end end, ',' ) as jobFunctions,
        concat('"personEmailAddress": "', Email, '",') as personEmailAddress,
        concat('"username": "', u.name, '",') as username,
        concat('"timezone": "', TimeZoneId, '",') as timezone,
        concat('"hidePatientId": ', case when hidePatientId then 'true' else 'false' end, ',') as hidePatientId,
        concat('"hideSampleId": ', case when hideSampleId then 'true' else 'false' end, ',') as hideSampleId,
        concat('"hideNotes": ', case when hideNotes then 'true' else 'false' end, ',') as hideNotes,
        concat('"getPasswordFromGxAlert":', 'true', ',') as getPasswordFromGxAlert,
        concat('"geographies":', CONCAT('[', IFNULL(GROUP_CONCAT('{ "stateName": "', s.name, '"},'), ''), IFNULL(GROUP_CONCAT('{ "lgaName": "', l.name, '"},'), ''), ']')) as geographies,
        '},' as closingCurly
from person p
inner join role r on p.RoleId = r.RoleId
left outer join my_aspnet_users u on p.UserId = u.id
left outer join personstate ps on p.PersonId = ps.PersonId
left outer join state s on ps.StateId = s.StateId
left outer join personlga pl on p.PersonId = pl.PersonId
left outer join lga l on pl.LgaId = l.LgaId
where p.CountryId = @CountryId
group by p.name, p.Title, r.Token, p.Email, u.name, p.TimeZoneId, hidePatientId, hideSampleId, hideNotes
order by p.Name;