import React, { useEffect } from 'react'
import identity from 'lodash/identity'
import isUndefined from 'lodash/isUndefined'
import { getTimezoneById } from '../utils/utils/timezone'

let displayPreferences = {
  dateFormat: 'yyyy-MM-dd',
  timeFormat: 'HH:mm:ss',
  dateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
  dayMonthFormat: 'MM/dd',
}
export const getAspectDisplayPreferences = () => displayPreferences

const storageMappings = [
  { storageKey: 'asAccess', propsKey: 'access' },
  { storageKey: 'asRefresh', propsKey: 'refresh' },
  { storageKey: 'asClientId', propsKey: 'clientId' },
  { storageKey: 'asCulture', propsKey: 'culture' },
  { storageKey: 'asTimezoneId', propsKey: 'timezoneId', update: it => getTimezoneById(it) },
  {
    storageKey: 'asDisplayPreferences',
    propsKey: 'displayPreferences',
    load: it => JSON.parse(it),
    update: it => {
      displayPreferences = { ...displayPreferences, ...it }
      return JSON.stringify(displayPreferences)
    },
  },
]

const LocalStorage = props => {
  useEffect(() => {
    storageMappings.forEach(({ storageKey, propsKey, update = identity }) => {
      const value = props[propsKey]
      if (isUndefined(value) && propsKey !== 'clientId') {
        localStorage.removeItem(storageKey)
      } else if (update(value)) {
        localStorage.setItem(storageKey, update(value))
      }
    })
  })

  return null
}

export default React.memo(LocalStorage)
