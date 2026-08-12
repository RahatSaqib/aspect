import React from 'react'
import { ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ReactQueryDevtools } from 'react-query/devtools'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import LocalStorage from '../components/LocalStorage'
import { useAuthStore } from '../store/authStore'
import getTheme from '../theme'
import AlertProvider from './AlertProvider'
import AnalyticsProvider from './AnalyticsProvider'
import AuthProvider from './AuthProvider'
import FilterProvider from './FilterProvider'
import I18nProvider from './I18nProvider'
import dateFNSLocales from './I18nProvider/dateFNSLocales'
import QueryClientProvider from './QueryClientProvider'

const AppWithProviders = ({ children }) => {
  const { culture, timezoneId, access, refresh, clientId, displayPreferences } = useAuthStore()
  const previousCulture = localStorage.getItem('asCulture')

  return (
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
  )
}

const AllProviders = ({ children }) => <AppWithProviders>{children}</AppWithProviders>

export default AllProviders
