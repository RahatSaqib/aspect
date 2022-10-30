import React, { createContext, useContext, useMemo } from 'react'
import { useSelector } from 'react-redux'

const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  const userComposed = useSelector(({ user }) => user)
  const auth = useMemo(() => userComposed.toJS(), [userComposed])

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

const useAuthState = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthState must be used within a AuthProvider')
  }

  return { ...context, userPermissions: context.jwt.permissions }
}

export { AuthProvider, useAuthState }
