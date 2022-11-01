import React from 'react'
import { ThemeProvider } from '@mui/material'
import { jssPreset } from '@mui/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { create } from 'jss'
import isNumber from 'lodash/isNumber'
import { IntlProvider } from 'react-intl'
import { JssProvider } from 'react-jss'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Provider, connect } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import { bindActionCreators } from 'redux'
import history from './history'
import IdleDetection from './oldComponents/IdleDetection'
import { reasonTypes } from './oldPages/auth/loggedOutReasons'
import RefreshToken from './oldPages/auth/login/RefreshToken'
import Pages from './Pages'
import { AuthProvider } from './providers/AuthProvider'
import { I18nProvider, dateFNSLocales } from './providers/I18nProvider'
import { refreshStart } from './store/AuthRedux'
import { actions as idleActions } from './store/IdleRedux'
import getTheme from './theme'
import translation from './utils/i18n/translation'
import LocalStorage from './utils/LocalStorage'
import { getTimezoneById } from './utils/utils/timezone'

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
const MUILocalizationProvider = ({ children, culture }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFNSLocales[culture]}>
      {children}
    </LocalizationProvider>
  )
}
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
  // dispatch to props
  refreshStart,
  idleStart,
  idleStop,
  // For render()
  countryId,
  countryAbbreviation,
  hasToAcceptLicenseId,
  isLoggedOut,
  loggedOutReason,
  permissions,
}) => (
  <IntlProvider
    key={/* https://git.io/viGEA */ culture}
    locale={culture === 'en-US' ? 'en' : culture}
    messages={translation[culture]}
    formats={formatsByTimezoneId(timezoneId)}
    onError={() => {}} // to not show console.error with MISSING_TRANSLATION
  >
    <ThemeProvider theme={getTheme(culture)}>
      <I18nProvider>
        <RefreshToken key="refreshTokenProvider" refreshStart={refreshStart} />
        <IdleDetection
          key="IdleDetectionProvider"
          isLoggedOut={isLoggedOut}
          idleStart={idleStart}
          idleStop={idleStop}
        />
        <LocalStorage
          key="localStorageProvider"
          access={access}
          refresh={refresh}
          clientId={clientId}
          culture={culture}
          timezoneId={timezoneId}
          displayPreferences={displayPreferences}
          drawerOpen={drawerOpen}
        />
        <QueryClientProvider key="queryClientProvider" client={new QueryClient()}>
          {process.env.NODE_ENV !== 'production' ? <ReactQueryDevtools initialIsOpen /> : null}
          <MUILocalizationProvider culture={culture}>
            <Router key="routerProvider" history={history}>
              <Pages
                key="pagesProvider"
                countryId={countryId}
                countryAbbreviation={countryAbbreviation}
                hasToAcceptLicenseId={hasToAcceptLicenseId}
                isLoggedOut={isLoggedOut}
                loggedOutReason={loggedOutReason}
                permissions={permissions}
              />
            </Router>
          </MUILocalizationProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  </IntlProvider>
)

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App)

const jss = create({
  ...jssPreset(),
  insertionPoint: 'insertion-point-jss',
})

const AppWithProviders = ({ store }) => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <JssProvider jss={jss}>
          <ConnectedApp />
        </JssProvider>
      </AuthProvider>
    </Provider>
  )
}

export default AppWithProviders
