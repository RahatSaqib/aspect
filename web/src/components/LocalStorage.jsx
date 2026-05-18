import Immutable from 'immutable'
import identity from 'lodash/identity'
import isUndefined from 'lodash/isUndefined'
import { compose, pure, lifecycle } from 'recompose'
import { getTimezoneById } from '../utils/utils/timezone'

let displayPreferences = Immutable.Map({
  dateFormat: 'yyyy-MM-dd',
  timeFormat: 'HH:mm:ss',
  dateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
  dayMonthFormat: 'MM/dd',
})
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
    load: it => Immutable.Map(JSON.parse(it)),
    update: it => {
      displayPreferences = displayPreferences.merge(it)
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

const LocalStorage = () => false

export default enhance(LocalStorage)
