import React, { Suspense, lazy } from 'react'
import Loading from './components/Loading'
import { useAuthState } from './providers/AuthProvider'

const LogoutApp = lazy(() => import('./App.LogoutApp'))
const LogInApp = lazy(() => import('./App.LogInApp'))

const MainApp = () => {
  const { hasToAcceptLicenseId, isLoggedOut } = useAuthState()

  return (
    <Suspense fallback={<Loading />}>{isLoggedOut || hasToAcceptLicenseId ? <LogoutApp /> : <LogInApp />}</Suspense>
  )
}

export default MainApp
