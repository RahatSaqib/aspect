import React, { Suspense, lazy } from 'react'
import Loading from './components/Loading'
import { useAuthState } from './providers/AuthProvider'

const LogoutApp = lazy(() => import('./App.LogoutApp'))
const LogInApp = lazy(() => import('./App.LogInApp'))

const MainApp = () => {
  const { jwt, isLoggedOut } = useAuthState()

  return (
    <Suspense fallback={<Loading />}>{jwt.hasToAcceptLicenseId || isLoggedOut ? <LogoutApp /> : <LogInApp />}</Suspense>
  )
}

export default MainApp
