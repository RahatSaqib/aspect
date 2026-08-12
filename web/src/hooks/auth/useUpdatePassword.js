import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { getClientId, getClientName } from '../../utils/utils/browser'
import { UPDATE_PASSWORD_ENDPOINT } from './authKeys'

const updatePassword = ({ resetPasswordToken, newPassword }) =>
  fetchWrapperForQueries({
    endpoint: `${UPDATE_PASSWORD_ENDPOINT}/${encodeURIComponent(resetPasswordToken)}`,
    method: 'PUT',
    params: {
      newPassword,
      clientId: localStorage.getItem('asClientId') || getClientId(),
      clientName: getClientName(),
    },
    showErrorNotifications: false,
  })

const useUpdatePassword = () => useMutation(params => updatePassword(params))

export default useUpdatePassword
