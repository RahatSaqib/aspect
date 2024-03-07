import { useEffect } from 'react'
import ReactGA from 'react-ga4'
import { useLocation } from 'react-router-dom'
import useAuthState from '../../hooks/useAuthState'

ReactGA.initialize(process.env.googleAnalyticsMeasurementId)

const PAGE_VIEW_EVENT = 'page_view'

export default function AnalyticsProvider({ children }) {
  const location = useLocation()
  const user = useAuthState()

  useEffect(() => {
    const params = user ? { user_name: user.jwt.name, user_country: user.countryAbbreviation } : {}
    ReactGA.event(PAGE_VIEW_EVENT, { page_location: location.pathname, ...params })
  }, [location.pathname, user])

  return children
}
