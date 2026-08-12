import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { getClientId, getClientName } from '../../utils/utils/browser'
import { SEND_RESET_PASSWORD_TOKEN_ENDPOINT } from './authKeys'

const sendResetPasswordToken = emailAddress =>
  fetchWrapperForQueries({
    endpoint: `${SEND_RESET_PASSWORD_TOKEN_ENDPOINT}/${encodeURIComponent(emailAddress)}`,
    method: 'POST',
    params: {
      clientId: localStorage.getItem('asClientId') || getClientId(),
      clientName: getClientName(),
    },
    showErrorNotifications: false,
  })

const useSendResetPasswordToken = () => useMutation(emailAddress => sendResetPasswordToken(emailAddress))

export default useSendResetPasswordToken
