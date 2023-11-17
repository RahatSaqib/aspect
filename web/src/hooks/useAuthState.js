import { useContext } from 'react'
import AuthContext from '../providers/AuthProvider/AuthProvider.Context'

const useAuthState = () => {
  const userData = useContext(AuthContext)

  if (userData === undefined) {
    throw new Error('useAuthState must be used within a AuthProvider')
  }

  return userData
}

export default useAuthState
