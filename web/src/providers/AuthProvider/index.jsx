import React, { createContext, useContext, useMemo } from 'react'
import isNumber from 'lodash/isNumber'
import { useSelector } from 'react-redux'

const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  const userComposed = useSelector(({ user }) => user)
  const auth = useMemo(() => userComposed.toJS(), [userComposed])
  const globals = useSelector(({ globals }) => globals.toJS())

  const { lastServerResponseTime } = globals
  const jwtExp = auth.jwt.exp

  let isLoggedOut = false
  if (isNumber(jwtExp) && lastServerResponseTime) {
    const isExpired = jwtExp < lastServerResponseTime.getTime() / 1000
    if (isExpired) {
      isLoggedOut = true
    }
  } else {
    isLoggedOut = true
  }
  const user = {
    ...auth,
    userPermissions: auth.jwt.permissions,
    isLoggedOut,
  }

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>
}

const useAuthState = () => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuthState must be used within a AuthProvider')
  }

  return context
}

export { AuthProvider, useAuthState }
