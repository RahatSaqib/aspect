import React from 'react'
import { ThemeProvider } from '@mui/material'
import { jssPreset } from '@mui/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { create } from 'jss'
import isString from 'lodash/isString'
import { JssProvider } from 'react-jss'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { useSelector, Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import fetchWrapperForQueries from '../components/QueryFetch'
import LocalStorage from '../oldComponents/LocalStorage'
import store from '../store/store'
import getTheme from '../theme'
import AuthProvider from './AuthProvider'
import FilterProvider from './FilterProvider'
import I18nProvider from './I18nProvider'
import dateFNSLocales from './I18nProvider/dateFNSLocales'

const jss = create({ ...jssPreset(), insertionPoint: 'insertion-point-jss' })

const defaultQueryFn = async ({ queryKey, queryFn }) => {
  const key = isString(queryKey) ? queryKey : queryKey[0]
  switch (key) {
    case 'data.inventoryConsumableSummaryList':
      return fetchWrapperForQueries({ endpoint: '/dashboard/inventory-item' })
    case 'tbMtbDetectedQuarterlyTrends': {
      const [, { mergedParams }] = queryKey
      return fetchWrapperForQueries({ endpoint: '/result/trend-in-quarters-mtb-detected', params: mergedParams })
    }
    /**
     * TODO: add here all other queryKey's from all components which fetches data.
     * And streamline the key strings - making them self-descriptive
     */
    default:
      return queryFn
  }
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      /**
       * set staleTime from default 0 milliseconds to 4 hours
       * TODO: Discuss in a team if it makes sense to put this in env file
       * to configure staleTime per customer basis
       */
      staleTime: 1000 /* ms */ * 60 /* secs */ * 60 /* mins */ * 4 /* hours */,
    },
  },
})

const AppWithProviders = ({ children }) => {
  const { culture, timezoneId, access, refresh, clientId, displayPreferences } = useSelector(({ user }) => user)

  return (
    <JssProvider jss={jss}>
      <I18nProvider timezoneId={timezoneId}>
        <ThemeProvider theme={getTheme(culture)}>
          <LocalStorage
            access={access}
            refresh={refresh}
            clientId={clientId}
            culture={culture}
            timezoneId={timezoneId}
            displayPreferences={displayPreferences}
          />
          <QueryClientProvider client={queryClient}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFNSLocales[culture]}>
              <BrowserRouter>
                <AuthProvider>
                  <FilterProvider>{children}</FilterProvider>
                </AuthProvider>
              </BrowserRouter>
            </LocalizationProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
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
