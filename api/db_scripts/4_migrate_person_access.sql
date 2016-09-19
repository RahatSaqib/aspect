-- be sure to run this one only once per country
-- otherwise, you'll get a duplicate key error (no big deal)

set @bpCountryId = 1;
set @aspectCountryId = 1;

-- Country
insert aspect.person_country (country_id, person_id, admin)
select @aspectCountryId, ap.id, ifnull(bpc.isAdmin, 0)
from bigpicture.personcountry bpc
inner join bigpicture.person bp on bpc.personid = bp.personid
inner join aspect.person ap on bp.email = ap.email 
where bpc.countryId = @bpcountryId
and bp.countryId = @bpCountryId
and bp.email is not null;

-- state
insert aspect.person_state (state_id, person_id)
select sa.id, ap.id
from bigpicture.personstate bps
inner join bigpicture.state s on bps.stateId = s.stateId
inner join bigpicture.person bp on bps.personid = bp.personid
inner join aspect.person ap on bp.email = ap.email 
inner join aspect.state sa on sa.name = s.name and sa.country_id = @aspectCountryId
where s.countryId = @bpcountryId
and bp.countryId = @bpCountryId
and bp.email is not null;


-- lga
insert aspect.person_lga (lga_id, person_id)
select la.id, ap.id
from bigpicture.personlga bpl
inner join bigpicture.lga l on bpl.lgaId = l.lgaId
inner join bigpicture.state s on l.stateId = s.stateId
inner join bigpicture.person bp on bpl.personid = bp.personid
inner join aspect.person ap on bp.email = ap.email 
inner join aspect.lga la on la.name = l.name
inner join aspect.state sa on la.state_id = sa.id and sa.country_id = @aspectCountryId
where s.countryId = @bpcountryId
and bp.countryId = @bpCountryId
and bp.email is not null;

-- location
insert aspect.person_location (location_id, person_id)
select dev.location_id, ap.id
from bigpicture.persondeployment bpd
inner join bigpicture.deployment d on d.DeploymentId = bpd.DeploymentId
inner join bigpicture.device bd on d.DeploymentId = bd.CurrentDeploymentId
inner join bigpicture.country c on d.Countryid = c.CountryId
inner join bigpicture.person bp on bpd.personid = bp.personid
inner join aspect.person ap on bp.email = ap.email 
inner join aspect.device dev on ifnull(dev.id1, 'asdfZY') = bd.ComputerId OR 
                                ifnull(dev.id2, 'asdfZY') = concat(concat(c.Abbreviation, '_'), concat(bd.Serial, concat('_', bd.HostId))) OR
                                ifnull(dev.id3, 'asdfZY') = concat(concat(c.Abbreviation, '_'), bd.Serial) OR
                                ifnull(dev.id4, 'asdfZY') = concat(concat(c.Abbreviation, '_'), bd.HostId)
where d.countryId = @bpcountryId
and bp.countryId = @bpCountryId
and bp.email is not null;
