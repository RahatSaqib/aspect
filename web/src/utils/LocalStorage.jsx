import window from 'global/window'
import Immutable from 'immutable'
import identity from 'lodash/identity'
import isString from 'lodash/isString'
import isUndefined from 'lodash/isUndefined'
import { compose, pure, lifecycle } from 'recompose'

const { localStorage } = window

const AS_ACCESS = 'asAccess'
const AS_REFRESH = 'asRefresh'
const AS_CLIENT_ID = 'asClientId'
const AS_CULTURE = 'asCulture'
const AS_TIMEZONE = 'asTimezoneId'
const AS_DISPLAY_PREFERENCES = 'asDisplayPreferences'

const DEFAULT_DISPLAY_PREFERENCES = {
  dateFormat: 'yyyy-MM-dd',
  timeFormat: 'HH:mm:ss',
  dateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
  dayMonthFormat: 'MM/dd',
}

export const getAspectAccess = () => localStorage.getItem(AS_ACCESS)
export const getTimezoneId = () => localStorage.getItem(AS_TIMEZONE)
export const getCurrentCulture = () => localStorage.getItem(AS_CULTURE)

export const setTimezoneId = timezoneId => localStorage.setItem(AS_TIMEZONE, timezoneId)
export const setCurrentCulture = culture => localStorage.setItem(AS_CULTURE, culture)

const INITIAL_DISPLAY_PREFERENCES = Immutable.Map(DEFAULT_DISPLAY_PREFERENCES)

let displayPreferences = INITIAL_DISPLAY_PREFERENCES
export const getAspectDisplayPreferences = () => displayPreferences

export const getAspectHydrateData = () => {
  const { result, data } = storageMappings.reduce(
    (acc, { storageKey, propsKey, load = identity }) => {
      const value = localStorage.getItem(storageKey)
      if (isString(value)) {
        acc.data[propsKey] = load(value)
      } else {
        acc.result = false
      }
      return acc
    },
    { result: true, data: {} }
  )

  return result && data
}

const storageMappings = [
  {
    storageKey: AS_ACCESS,
    propsKey: 'access',
  },
  {
    storageKey: AS_REFRESH,
    propsKey: 'refresh',
  },
  {
    storageKey: AS_CLIENT_ID,
    propsKey: 'clientId',
  },
  {
    storageKey: AS_CULTURE,
    propsKey: 'culture',
  },
  {
    storageKey: AS_TIMEZONE,
    propsKey: 'timezoneId',
  },
  {
    storageKey: AS_DISPLAY_PREFERENCES,
    propsKey: 'displayPreferences',
    load: it => Immutable.Map(JSON.parse(it)),
    update: it => {
      displayPreferences = INITIAL_DISPLAY_PREFERENCES.merge(it)
      return JSON.stringify(displayPreferences.toJS())
    },
  },
]

const enhance = compose(
  pure,
  lifecycle({
    handleStorage(props) {
      storageMappings.forEach(({ storageKey, propsKey, update = identity }) => {
        const value = props[propsKey]
        if (isUndefined(value) && propsKey !== 'clientId') {
          localStorage.removeItem(storageKey)
        } else if (update(value)) {
          localStorage.setItem(storageKey, update(value))
        }
      })
    },

    componentDidMount() {
      this.handleStorage(this.props)
    },

    componentDidUpdate() {
      this.handleStorage(this.props)
    },
  })
)

export const LocalStorage = () => false

export default enhance(LocalStorage)
