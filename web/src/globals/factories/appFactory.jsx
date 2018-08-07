import _ from 'lodash'
import React from 'react'
import { compose } from 'recompose'
import { AppContainer } from 'react-hot-loader'
import { bindActionCreators } from 'redux'
import { Provider, connect } from 'react-redux'
import { addLocaleData, IntlProvider } from 'react-intl'

import en from 'react-intl/locale-data/en'
import fr from 'react-intl/locale-data/fr'

import translation from '../../shared/i18n/translation'
import { getTimezoneById } from '../../shared/utils/timezone'
import RefreshToken from '../../auth/login/RefreshToken'
import { reasonTypes } from '../../auth/loggedOutReasons'
import { refreshStart } from '../../auth/AuthRedux'
import IdleDetection from '../../idle/components/IdleDetection'
import LocalStorage from '../sideEffects/LocalStorage'
import { actions as idleActions } from '../../idle/IdleRedux'
import uiProvidersFactory from './uiProvidersFactory'
import routerFactory from './routerFactory'

addLocaleData([...en, ...fr])

const formatsByTimezoneId = timezoneId => {
  const formats = {}

  const timezone = getTimezoneById(timezoneId)
  if (timezone) {
    formats.date = {
      'user-timezone': {
        timeZone: timezone,
      },
      '2-digit-date-time': {
        // https://github.com/yahoo/react-intl/wiki/Components#date-formatting-components
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
    }
    formats.time = {
      'user-timezone': {
        timeZone: timezone,
      },
    }
  }
  return formats
}

const mapStateToProps = state => {
  let isLoggedOut = false
  let { loggedOutReason } = state.user

  const jwtExp = state.user.jwt.exp
  if (_.isNumber(jwtExp)) {
    const isExpired = jwtExp < Date.now() / 1000

    if (isExpired) {
      isLoggedOut = true
      loggedOutReason = reasonTypes.expiredJWT
    }
  } else {
    isLoggedOut = true
  }
  return {
    // For IntlProvider
    culture: state.user.culture,
    timezoneId: state.user.timezoneId,
    // For other SideEffect components
    access: state.user.access,
    refresh: state.user.refresh,
    clientId: state.user.clientId,
    dateFormat: state.user.dateFormat,
    drawerOpen: state.user.drawerOpen,
    // For render()
    isLoggedOut,
    loggedOutReason,
    features: state.user.features,
  }
}

const mapDispatchToProps = bindActionCreators.bind(null, {
  refreshStart,
  idleStart: idleActions.start,
  idleStop: idleActions.stop,
})

export const appFactory = compose(
  render => ({ store }) => (
    <AppContainer>
      <Provider store={store}>{render()}</Provider>
    </AppContainer>
  ),
  uiProvidersFactory,
  render => {
    const App = ({
      // For IntlProvider
      culture,
      timezoneId,
      // For other SideEffect components
      access,
      refresh,
      clientId,
      dateFormat,
      drawerOpen,
      refreshStart,
      idleStart,
      idleStop,
      // For render()
      ...restProps
    }) => (
      <IntlProvider
        key={/* https://git.io/viGEA */ culture}
        locale={culture === 'en-US' ? 'en' : culture}
        messages={translation[culture]}
        formats={formatsByTimezoneId(timezoneId)}
      >
        <div id="I-am-reactroot">
          <RefreshToken refreshStart={refreshStart} />
          <IdleDetection
            isLoggedOut={restProps.isLoggedOut}
            idleStart={idleStart}
            idleStop={idleStop}
          />
          <LocalStorage
            access={access}
            refresh={refresh}
            clientId={clientId}
            culture={culture}
            timezoneId={timezoneId}
            dateFormat={dateFormat}
            drawerOpen={drawerOpen}
          />
          {render(restProps)}
        </div>
      </IntlProvider>
    )

    return React.createFactory(
      connect(mapStateToProps, mapDispatchToProps)(App)
    )
  },
  routerFactory
)

export default appFactory
