import React from 'react'
import { ThemeProvider } from '@mui/material'
import { jssPreset } from '@mui/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { create } from 'jss'
import { JssProvider } from 'react-jss'
import { ReactQueryDevtools } from 'react-query/devtools'
import { useSelector, Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import LocalStorage from '../components/LocalStorage'
import store from '../store/store'
import getTheme from '../theme'
import AlertProvider from './AlertProvider'
import AnalyticsProvider from './AnalyticsProvider'
import AuthProvider from './AuthProvider'
import FilterProvider from './FilterProvider'
import I18nProvider from './I18nProvider'
import dateFNSLocales from './I18nProvider/dateFNSLocales'
import QueryClientProvider from './QueryClientProvider'

const jss = create({ ...jssPreset(), insertionPoint: 'insertion-point-jss' })

const AppWithProviders = ({ children }) => {
  const { culture, timezoneId, access, refresh, clientId, displayPreferences } = useSelector(({ user }) => user)
  const previousCulture = localStorage.getItem('asCulture')

  return (
    <JssProvider jss={jss}>
      <I18nProvider timezoneId={timezoneId}>
        <ThemeProvider theme={getTheme(culture)}>
          <LocalStorage
            access={access}
            refresh={refresh}
            clientId={clientId}
            culture={previousCulture || culture}
            timezoneId={timezoneId}
            displayPreferences={displayPreferences}
          />
          <QueryClientProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFNSLocales[culture]}>
              <BrowserRouter>
                <AlertProvider>
                  <AuthProvider>
                    <FilterProvider>
                      <AnalyticsProvider>{children}</AnalyticsProvider>
                    </FilterProvider>
                  </AuthProvider>
                </AlertProvider>
              </BrowserRouter>
            </LocalizationProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
          <ToastContainer />
        </ThemeProvider>
      </I18nProvider>
    </JssProvider>
  )
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
