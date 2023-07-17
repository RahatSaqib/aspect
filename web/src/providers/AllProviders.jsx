import React from 'react'
import { ThemeProvider } from '@mui/material'
import { jssPreset } from '@mui/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { create } from 'jss'
import { IntlProvider } from 'react-intl'
import { JssProvider } from 'react-jss'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useSelector, Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import history from '../history'
import store from '../store/store'
import getTheme from '../theme'
import translation from '../utils/i18n/translation.json'
import LocalStorage from '../utils/LocalStorage'
import { getTimezoneById } from '../utils/utils/timezone'
import { AuthProvider } from './AuthProvider'
import { FilterProvider } from './FilterProvider'
import { I18nProvider, dateFNSLocales } from './I18nProvider'
import { RoutesPermissionProvider } from './RoutePermissions'

const jss = create({ ...jssPreset(), insertionPoint: 'insertion-point-jss' })

const AppWithProviders = ({ children }) => {
  const { culture, timezoneId, access, refresh, clientId, displayPreferences } = useSelector(({ user }) => user)

  return (
    <JssProvider jss={jss}>
      <IntlProvider
        locale={culture === 'en-US' ? 'en' : culture}
        messages={translation[culture]}
        formats={formatsByTimezoneId(timezoneId)}
        onError={() => {}}
      >
        <ThemeProvider theme={getTheme(culture)}>
          <I18nProvider>
            <LocalStorage
              access={access}
              refresh={refresh}
              clientId={clientId}
              culture={culture}
              timezoneId={timezoneId}
              displayPreferences={displayPreferences}
            />
            <QueryClientProvider client={new QueryClient()}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFNSLocales[culture]}>
                <BrowserRouter history={history}>
                  <AuthProvider>
                    <FilterProvider>
                      <RoutesPermissionProvider>{children}</RoutesPermissionProvider>
                    </FilterProvider>
                  </AuthProvider>
                </BrowserRouter>
              </LocalizationProvider>
            </QueryClientProvider>
          </I18nProvider>
        </ThemeProvider>
      </IntlProvider>
    </JssProvider>
  )
}

const formatsByTimezoneId = timezoneId => {
  const formats = {}

  const timezone = getTimezoneById(timezoneId)
  if (timezone) {
    formats.date = {
      'user-timezone': { timeZone: timezone },
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
    formats.time = { 'user-timezone': { timeZone: timezone } }
  }
  return formats
}

const AllProviders = ({ children }) => {
  return (
    // Provider is left out so AppProviders can consume stuff from redux
    <Provider store={store}>
      <AppWithProviders>{children}</AppWithProviders>
    </Provider>
  )
}

export default AllProviders
