import React, { createContext, useContext, useMemo } from 'react'
import isNumber from 'lodash/isNumber'
import { useSelector } from 'react-redux'

const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  const userComposed = useSelector(({ user }) => user)
  const globalsComposed = useSelector(({ globals }) => globals)
  const user = useMemo(() => userComposed.toJS(), [userComposed])
  const globals = useMemo(() => globalsComposed.toJS(), [globalsComposed])

  const { lastServerResponseTime } = globals
  const jwtExp = user.jwt.exp

  let isLoggedOut = false

  const isPakistan = useMemo(
    () => localStorage.getItem('<showPkDashboard>') || user?.countryAbbreviation === 'PK',
    [user.countryAbbreviation]
  )

  if (isNumber(jwtExp) && lastServerResponseTime) {
    const isExpired = jwtExp < lastServerResponseTime.getTime() / 1000
    if (isExpired) {
      isLoggedOut = true
    }
  } else {
    isLoggedOut = true
  }
  const userData = Object.freeze({ ...user, userPermissions: user.jwt.permissions, isLoggedOut, isPakistan })

  return <AuthContext.Provider value={userData}>{children}</AuthContext.Provider>
}

const useAuthState = () => {
  const userData = useContext(AuthContext)

  if (userData === undefined) {
    throw new Error('useAuthState must be used within a AuthProvider')
  }

  return userData
}

export { AuthProvider, useAuthState }
