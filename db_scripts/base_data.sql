-- This script migrates basic data that is shared among all countries

insert into aspect.person_level (name, sort_order, token, level)
select name, sortorder, token, level
from bigpicture.role r
where r.name not in (select name from aspect.person_level);

insert into aspect.role (name)
select name from bigpicture.my_aspnet_roles r
where r.name not in (select name from aspect.role);
