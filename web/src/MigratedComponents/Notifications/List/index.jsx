import React from 'react'

import {
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../../filter/utils'
import BrowseFilters from '../../../globals/components/BrowseFilters'
import AspectTable from '../../Table'

const data = [
  {
    id: 7,
    name: 'Send device offline email to NTP after 7 days',
    totalTriggers: 107,
    alertCount: 107,
    contactsCount: 1,
    contacts: 'ntp',
    lastTriggeredOn: '2020-10-11T12:02:34.000Z',
  },
  {
    id: 6,
    name: 'Send device offline email to Admin after 7 days',
    totalTriggers: 146483,
    alertCount: 146483,
    contactsCount: 37,
    contacts:
      'Admin User,Agripah Kadye,Andrew Nyambo,Barbara Manyame,Brian Dhlandhlara',
    lastTriggeredOn: '2020-10-11T12:02:34.000Z',
  },
  {
    id: 5,
    name: 'Send device no results email to NTP after 7 days',
    totalTriggers: 1,
    alertCount: 1,
    contactsCount: 1,
    contacts: 'ntp',
    lastTriggeredOn: '2020-10-07T20:47:11.000Z',
  },
  {
    id: 4,
    name: 'Send device no results email to Admin after 7 days',
    totalTriggers: 1369,
    alertCount: 1369,
    contactsCount: 37,
    contacts:
      'Admin User,Agripah Kadye,Andrew Nyambo,Barbara Manyame,Brian Dhlandhlara',
    lastTriggeredOn: '2020-10-07T20:47:11.000Z',
  },
  {
    id: 1,
    name: 'New Results Available',
    totalTriggers: 1315,
    alertCount: null,
    contactsCount: 0,
    contacts: null,
    lastTriggeredOn: '2020-10-12T07:00:00.000Z',
  },
  {
    id: 3,
    name: 'MTB+ Rif+ Result',
    totalTriggers: 48434,
    alertCount: null,
    contactsCount: 61,
    contacts:
      'Adam Chindore,Admore Murwira,BARBARA MOYO,Barnabas Kuchocha,Cathrine Banana',
    lastTriggeredOn: '2020-10-08T17:05:24.000Z',
  },
  {
    id: 2,
    name: 'MTB+ Result',
    totalTriggers: 956236,
    alertCount: null,
    contactsCount: 61,
    contacts:
      'Adam Chindore,Admore Murwira,BARBARA MOYO,Barnabas Kuchocha,Cathrine Banana',
    lastTriggeredOn: '2020-10-12T08:15:22.000Z',
  },
]

function NotificationList() {
  const FILTERS_CONFIG = [{ notificationName: true, requiredPermissions: [] }]
  const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
  return (
    <div>
      {/* <BrowseFilters
        history={history}
        location={location}
        intl={intl}
        config={reduceFiltersConfig(FILTERS_CONFIG, userPermissions)}
      /> */}
      <AspectTable />
    </div>
  )
}

export default NotificationList
