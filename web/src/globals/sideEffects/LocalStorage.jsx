import window from 'global/window'
import _ from 'lodash'
import { compose, pure, lifecycle } from 'recompose'

const { localStorage } = window

const AS_ACCESS = 'asAccess'
const AS_REFRESH = 'asRefresh'
const AS_CLIENT_ID = 'asClientId'
const AS_CULTURE = 'asCulture'
const AS_TIMEZONE = 'asTimezoneId'
const AS_DATE_FORMAT = 'asDateFormat'
const AS_DRAWER_OPEN = 'asDrawerOpen'

export const getAspectHydrateData = () => {
  const { result, data } = storageMappings.reduce(
    (acc, { storageKey, propsKey, parse = _.identity }) => {
      const value = localStorage.getItem(storageKey)
      if (_.isString(value)) {
        acc.data[propsKey] = parse(value)
      } else {
        acc.result = false
      }
      return acc
    },
    { result: true, data: {} }
  )

  return result && data
}

export const getAspectAccess = () => localStorage.getItem(AS_ACCESS)
export const getAspectDateFormat = () => localStorage.getItem(AS_DATE_FORMAT)

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
    storageKey: AS_DATE_FORMAT,
    propsKey: 'dateFormat',
  },
  {
    storageKey: AS_DRAWER_OPEN,
    propsKey: 'drawerOpen',
    parse: it => it === 'true',
  },
]

const enhance = compose(
  pure,
  lifecycle({
    handleStorage(props) {
      storageMappings.forEach(({ storageKey, propsKey }) => {
        const value = props[propsKey]
        if (_.isUndefined(value)) {
          localStorage.removeItem(storageKey)
        } else {
          localStorage.setItem(storageKey, value)
        }
      })
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
