import React, { useCallback, useMemo } from 'react'
import isNumber from 'lodash/isNumber'
import { useSelector } from 'react-redux'
import AuthContext from './AuthProvider.Context'

const AuthProvider = ({ children }) => {
  const userComposed = useSelector(({ user }) => user)
  const user = useMemo(() => userComposed.toJS(), [userComposed])

  const jwtExp = user.jwt.exp

  let isLoggedOut = false

  const isCountry = useCallback(
    countryAbbreviation => {
      return localStorage.getItem('<showPkDashboard>') || user?.countryAbbreviation === countryAbbreviation
    },
    [user.countryAbbreviation]
  )

  if (isNumber(jwtExp)) {
    const isExpired = jwtExp < new Date().getTime() / 1000
    if (isExpired) {
      isLoggedOut = true
    }
  } else {
    isLoggedOut = true
  }
  const userData = Object.freeze({ ...user, userPermissions: user.jwt.permissions, isLoggedOut, isCountry })

  return <AuthContext.Provider value={userData}>{children}</AuthContext.Provider>
}

export default AuthProvider
