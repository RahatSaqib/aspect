import React, { useCallback, useMemo } from 'react'
import isNumber from 'lodash/isNumber'
import { useSelector } from 'react-redux'
import COUNTRY_ISO_MAPPING from '../../utils/consts/Countries/CONSTS'
import AuthContext from './AuthProvider.Context'

const AuthProvider = ({ children }) => {
  const user = useSelector(({ user }) => user)

  const jwtExp = user.jwt.exp

  let isLoggedOut = false

  const isCountry = useCallback(
    countryAbbreviation => {
      return user?.countryAbbreviation === countryAbbreviation
    },
    [user.countryAbbreviation]
  )

  const isPakistan = useMemo(() => user?.countryAbbreviation === COUNTRY_ISO_MAPPING.PAK, [user?.countryAbbreviation])

  if (isNumber(jwtExp)) {
    const isExpired = jwtExp < new Date().getTime() / 1000
    if (isExpired) {
      isLoggedOut = true
    }
  } else {
    isLoggedOut = true
  }
  const userData = Object.freeze({ ...user, userPermissions: user.jwt.permissions, isLoggedOut, isCountry, isPakistan })

  return <AuthContext.Provider value={userData}>{children}</AuthContext.Provider>
}

export default AuthProvider
