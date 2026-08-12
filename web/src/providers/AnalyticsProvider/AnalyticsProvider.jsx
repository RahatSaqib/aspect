import { useEffect } from 'react'
import ReactGA from 'react-ga4'
import { useLocation } from 'react-router-dom'
import config from '../../config'
import useAuthState from '../../hooks/useAuthState'

const MEASUREMENT_ID = config.googleAnalyticsMeasurementId
const PAGE_VIEW_EVENT = 'page_view'

if (MEASUREMENT_ID) ReactGA.initialize(MEASUREMENT_ID)

export default function AnalyticsProvider({ children }) {
  const location = useLocation()
  const user = useAuthState()

  useEffect(() => {
    if (user) {
      const jobFunction = user.jwt.jobFunctionNames[0]
      ReactGA.gtag('set', 'user_properties', {
        user_name: user.jwt.name,
        user_country: user.countryAbbreviation,
        ...(jobFunction ? { user_job_function: jobFunction } : {}),
      })
    }
  }, [user])

  useEffect(() => {
    ReactGA.event(PAGE_VIEW_EVENT, { page_location: location.pathname })
  }, [location.pathname])

  return children
}
