import React, { Suspense, lazy } from 'react'
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LoggedOutLayout, Loading } from './components'
import useAuthState from './hooks/useAuthState'
import License from './oldPages/auth/license/License'
import ResetPassword from './oldPages/auth/resetPassword/ResetPassword'

const LoadableLogin = lazy(() => import('./oldPages/auth/login/Login'))

const LogoutApp = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { countryId, countryAbbreviation, jwt, isLoggedOut, loggedOutReason, userPermissions } = useAuthState()

  const props = {
    countryId,
    countryAbbreviation,
    hasToAcceptLicenseId: jwt.hasToAcceptLicenseId,
    isLoggedOut,
    loggedOutReason,
    permissions: userPermissions,
    location,
    navigate,
  }

  return (
    <LoggedOutLayout>
      <Suspense fallback={<Loading centered />}>
        <Routes>
          <Route
            path="/login"
            element={
              !isLoggedOut && jwt.hasToAcceptLicenseId ? (
                <Navigate replace to="/license" state={{ referrer: location, licenseId: jwt.hasToAcceptLicenseId }} />
              ) : (
                <LoadableLogin {...props} />
              )
            }
          />
          <Route path="/reset-password" element={<ResetPassword {...props} />} />
          <Route path="/license" element={<License {...props} />} />
          <Route path="*" element={<Navigate replace to="/login" state={{ referrer: location }} />} />
        </Routes>
      </Suspense>
    </LoggedOutLayout>
  )
}

export default LogoutApp
