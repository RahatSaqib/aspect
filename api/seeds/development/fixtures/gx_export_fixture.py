import json
import pymysql
import pymysql.cursors

country_a3 = 'MMR'

mysql_gx = pymysql.connect(
    host='127.0.0.1',
    user='bigpicture',
    port=3306,
    password='n4fefepraWRU',
    db='bigpicture',
    cursorclass=pymysql.cursors.DictCursor)

q_country = '''
    select
        CountryId as id,
        Abbreviation as abbreviation,
        Name as name,
        A3 as a3,
        Culture as culture,
        CountryCode as countryCode,
        StateLabel as stateLabel,
        LgaLabel as lgaLabel,
        TimeZoneId as timezone,
        PortNumber as portNumber,
        ExportColumns as exportColumns,
        InventoryDaysThreshold as inventoryDaysThreshold,
        MonthStartsOnDay as monthStartsOnDay
    from country where a3=%s
'''

q_states = '''
    select
        Name as name,
        Abbreviation as abbreviation
    from state
    where CountryId=%s
    order by name
'''

q_lgas = '''
    select
        s.Abbreviation as state,
        l.Name as lga
    from lga l
        join state s on s.StateId = l.StateId
    where s.CountryId=%s
    order by s.Abbreviation, l.Name;
'''

q_locations = '''
    select
        l.id,
        l.name,
        l.shortname,
        s.Abbreviation as stateAbbreviation,
        lga.name as lgaName,
        l.city,
        l.street1,
        l.street2,
        l.zip,
        l.longitude,
        l.latitude,
        l.timezone_id as timezoneId,
        l.hours_start as hoursStart,
        l.hours_end as hoursEnd
    from location l
        left join state s on l.state_id = s.StateId
        left join lga lga on l.state_id = lga.LgaId
    where l.country_id=%s
    order by l.name
'''

q_devices = '''
    select
        dep.LocationId as locationId,
        dep.Description as name,
        dep.ShortName as shortname,
        dep.ComputerCulture as culture,
        dep.ComputerTimeZoneId as timezone,
        dep.Notes as notes,
        d.Serial as serial,
        d.HostId as hostId,
        d.ComputerId as macAddress
    from device d
        join deployment dep on d.CurrentDeploymentId=dep.DeploymentId
        where dep.CountryId=%s
        order by locationId, name
'''

with mysql_gx.cursor() as cursor:
    cursor.execute(q_country, country_a3)
    country = list(cursor)[0]

    country_id = country['id']
    cursor.execute(q_states, country_id)
    states = list(cursor)

    cursor.execute(q_lgas, country_id)
    lgas = list(cursor)

    states_map = {}
    for state in states:
        abbr = state['abbreviation']
        states_map[abbr] = dict(
            name=state['name'],
            abbreviation=abbr,
            lgas=[])
    for lga in lgas:
        states_map[lga['state']]['lgas'].append(dict(name=lga['lga']))

    geo = dict((key, country[key]) for key in (
        'abbreviation',
        'name',
        'a3',
        'culture',
        'countryCode',
        'stateLabel',
        'lgaLabel',
        'timezone',
        'portNumber',
        'exportColumns',
        'inventoryDaysThreshold',
        'monthStartsOnDay'))
    geo['states'] = [states_map[state['abbreviation']] for state in states]
    # print(json.dumps(geo, indent=2, sort_keys=True))
    # print('\n')

    cursor.execute(q_locations, country_id)
    locations = list(cursor)
    site_map = {}
    for location in locations:
        loc = dict((key, location[key]) for key in (
            'name',
            'shortname',
            'stateAbbreviation',
            'lgaName',
            'city',
            'street1',
            'street2',
            'zip',
            'longitude',
            'latitude',
            'timezoneId',
            'hoursStart',
            'hoursEnd'
        ))
        # TODO what should site externalId?
        loc['externalId'] = loc['shortname'] or loc['name']
        loc['devices'] = []
        site_map[location['id']] = loc

    cursor.execute(q_devices, country_id)
    devices = list(cursor)
    for device in devices:
        site_map[device['locationId']]['devices'].append(
            dict((key, device[key]) for key in (
                'name',
                'shortname',
                'serial',
                'hostId',
                'macAddress',
                'culture',
                'timezone',
                'notes'
            )))

    site_list = [site_map[location['id']] for location in locations]
    print(json.dumps(dict(sites=site_list), indent=2, sort_keys=True))
