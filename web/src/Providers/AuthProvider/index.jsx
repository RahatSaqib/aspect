import React, { createContext, useContext } from 'react'
import { useSelector } from 'react-redux'

const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  const auth = useSelector(({ user }) => user.toJS().jwt)
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

const useAuthState = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthState must be used within a AuthProvider')
  }
  return context
}

export { AuthProvider, useAuthState }
