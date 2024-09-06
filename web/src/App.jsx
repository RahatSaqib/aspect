import React, { Suspense, lazy } from 'react'
import { Loading } from './cleanComponents'
import useAuthState from './hooks/useAuthState'
import 'react-toastify/dist/ReactToastify.css'

const LogoutApp = lazy(() => import('./App.LogoutApp'))
const LogInApp = lazy(() => import('./App.LogInApp'))

const MainApp = () => {
  const { jwt, isLoggedOut } = useAuthState()

  return (
    <Suspense fallback={<Loading centered />}>
      {jwt.hasToAcceptLicenseId || isLoggedOut ? <LogoutApp /> : <LogInApp />}
    </Suspense>
  )
}

export default MainApp
