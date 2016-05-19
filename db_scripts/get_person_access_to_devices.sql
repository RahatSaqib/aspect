set @person_id = 63;

-- access to devices via country
select d.id
from device d
inner join location l on d.location_id = l.id
inner join person_country pc on l.country_id = pc.country_id and pc.person_id = @person_id

UNION

-- access to devices via state
select d.id
from device d
inner join location l on d.location_id = l.id
inner join person_state ps on l.state_id = ps.state_id and ps.person_id = @person_id

UNION

-- access to devices via lga
select d.id
from device d
inner join location l on d.location_id = l.id
inner join person_lga pl on l.lga_id = pl.lga_id and pl.person_id = @person_id

UNION

-- access to devices via location
select d.id
from device d
inner join location l on d.location_id = l.id
inner join person_location pl on l.id = pl.location_id and pl.person_id = @person_id;
