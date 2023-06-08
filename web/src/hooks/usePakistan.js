import { useMemo } from 'react'
import { useAuthState } from '../providers/AuthProvider'

export function usePakistan() {
  const { countryAbbreviation } = useAuthState()

  const isPakistan = useMemo(
    () => true, //localStorage.getItem('<showPkDashboard>') || countryAbbreviation === 'PK',
    [countryAbbreviation]
  )

  return { isPakistan }
}
