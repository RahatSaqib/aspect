import isNumber from 'lodash/isNumber'
import React from 'react'
import { compose } from 'recompose'
import { bindActionCreators } from 'redux'
import { Provider, connect } from 'react-redux'
import { IntlProvider } from 'react-intl'
import { ReactQueryDevtools } from 'react-query/devtools'
import { QueryClient, QueryClientProvider } from 'react-query'

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
import { AuthProvider } from '../../Providers/AuthProvider'
import { I18nProvider } from '../../Providers/I18nProvider'

const queryClient = new QueryClient()

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  whyDidYouRender(React, {
    trackAllPureComponents: false,
  })
}

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
  if (isNumber(jwtExp) && state.globals.lastServerResponseTime) {
    const isExpired = jwtExp < state.globals.lastServerResponseTime.getTime() / 1000
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
    countryId: state.user.countryId,
    displayPreferences: state.user.displayPreferences,
    drawerOpen: state.user.drawerOpen,
    countryAbbreviation: state.user.countryAbbreviation,
    hasToAcceptLicenseId: state.user.jwt.hasToAcceptLicenseId,
    // For render()
    isLoggedOut,
    loggedOutReason,
    permissions: state.user.jwt.permissions,
  }
}

const mapDispatchToProps = bindActionCreators.bind(null, {
  refreshStart,
  idleStart: idleActions.start,
  idleStop: idleActions.stop,
})

export const appFactory = compose(
  render =>
    ({ store }) =>
      (
        <Provider store={store}>
          <AuthProvider>{render()}</AuthProvider>
        </Provider>
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
      displayPreferences,
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
        onError={() => {}} // to not show console.error with MISSING_TRANSLATION
      >
        <I18nProvider>
          <div id="I-am-reactroot">
            <RefreshToken refreshStart={refreshStart} />
            <IdleDetection isLoggedOut={restProps.isLoggedOut} idleStart={idleStart} idleStop={idleStop} />
            <LocalStorage
              access={access}
              refresh={refresh}
              clientId={clientId}
              culture={culture}
              timezoneId={timezoneId}
              displayPreferences={displayPreferences}
              drawerOpen={drawerOpen}
            />
            <QueryClientProvider client={queryClient}>
              {process.env.NODE_ENV !== 'production' ? <ReactQueryDevtools initialIsOpen /> : null}

              {render(restProps)}
            </QueryClientProvider>
          </div>
        </I18nProvider>
      </IntlProvider>
    )

    return React.createFactory(connect(mapStateToProps, mapDispatchToProps)(App))
  },
  routerFactory
)

export default appFactory
