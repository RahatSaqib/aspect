import window from 'global/window'
import _ from 'lodash'
import Immutable from 'immutable'
import { compose, pure, lifecycle } from 'recompose'

const { localStorage } = window

const AS_ACCESS = 'asAccess'
const AS_REFRESH = 'asRefresh'
const AS_CLIENT_ID = 'asClientId'
const AS_CULTURE = 'asCulture'
const AS_TIMEZONE = 'asTimezoneId'
const AS_DRAWER_OPEN = 'asDrawerOpen'
const AS_DISPLAY_PREFERENCES = 'asDisplayPreferences'

const DEFAULT_DISPLAY_PREFERENCES = {
  dateFormat: 'M/D/YYYY', // YYYY-MM-DD
  timeFormat: 'h:mm:ss A', // HH:mm:ss
  dateTimeFormat: 'M/D/YYYY, h:mm:ss A', // YYYY-MM-DD HH:mm:ss
}

export const getAspectAccess = () => localStorage.getItem(AS_ACCESS)

const INITIAL_DISPLAY_PREFERENCES = Immutable.Map(DEFAULT_DISPLAY_PREFERENCES)
let displayPreferences = INITIAL_DISPLAY_PREFERENCES
export const getAspectDisplayPreferences = () => displayPreferences

export const getAspectHydrateData = () => {
  const { result, data } = storageMappings.reduce(
    (acc, { storageKey, propsKey, load = _.identity }) => {
      const value = localStorage.getItem(storageKey)
      if (_.isString(value)) {
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
    storageKey: AS_DRAWER_OPEN,
    propsKey: 'drawerOpen',
    load: it => it === 'true',
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
      storageMappings.forEach(
        ({ storageKey, propsKey, update = _.identity }) => {
          const value = props[propsKey]
          if (_.isUndefined(value)) {
            localStorage.removeItem(storageKey)
          } else {
            localStorage.setItem(storageKey, update(value))
          }
        }
      )
    },

    componentDidMount() {
      // TODO: Remove me, for legacy system
      localStorage.removeItem('jwt')
      localStorage.removeItem('jwt_expires')
      localStorage.removeItem('refresh')
      localStorage.removeItem('clientId')
      localStorage.removeItem('culture')
      localStorage.removeItem('timezone')
      // End-TODO
      this.handleStorage(this.props)
    },

    componentDidUpdate() {
      this.handleStorage(this.props)
    },
  })
)

export const LocalStorage = () => false

export default enhance(LocalStorage)
