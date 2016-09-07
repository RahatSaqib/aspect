-- This script migrates basic data that is shared among all countries

insert into aspect.person_level (name, sort_order, token, level)
select name, sortorder, token, level
from bigpicture.role r
where r.name not in (select name from aspect.person_level);


insert into aspect.role (name)
select name from bigpicture.my_aspnet_roles r
where r.name not in (select name from aspect.role);


insert into aspect.device_type(name, id1_query, id2_query, id3_query, id4_query)
values ('GeneXpert', 'ComputerId', 'concat(country.Abbreviation, ''_'', Serial, ''_'', HostId)',
        'concat(country.Abbreviation, ''_'', Serial)', 'concat(country.Abbreviation, ''_'', HostId)');
