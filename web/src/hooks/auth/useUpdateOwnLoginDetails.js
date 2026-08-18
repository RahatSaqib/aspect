import { defineMessages } from 'react-intl'
import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { updateSessionTokens } from '../../store/authStore'
import { errorPleaseTryAgainInAFewMinutes, inlineWarning } from '../../utils/error/CommonErrorNotifications'
import { getClientId, getClientName } from '../../utils/utils/browser'
import { PERSON_KEY } from '../person/personKeys'
import { UPDATE_LOGIN_DETAILS_ENDPOINT } from './authKeys'

const updateOwnLoginDetails = ({ currentPassword, newUsername, newPassword }) =>
  fetchWrapperForQueries({
    endpoint: UPDATE_LOGIN_DETAILS_ENDPOINT,
    method: 'PUT',
    params: {
      currentPassword,
      newUsername,
      newPassword: newPassword || null,
      clientId: localStorage.getItem('asClientId') || getClientId(),
      clientName: getClientName(),
      clientType: 'web',
    },
    customErrorNotifications: {
      403: inlineWarning(
        defineMessages({
          title: {
            id: 'errorResponseMessages.saveLoginDetails.PUT.403.title',
            defaultMessage: 'Invalid Password',
          },
          message: {
            id: 'errorResponseMessages.saveLoginDetails.PUT.403.message',
            defaultMessage: 'The current password that you have entered is incorrect.',
          },
          resolution: {
            id: 'errorResponseMessages.saveLoginDetails.PUT.403.resolution',
            defaultMessage: 'Please try re-entering your password or contact us to reset your login details',
          },
        })
      ),
      409: inlineWarning(
        defineMessages({
          title: {
            id: 'errorResponseMessages.saveLoginDetails.PUT.409.title',
            defaultMessage: 'This Username is Unavailable',
          },
          message: {
            id: 'errorResponseMessages.saveLoginDetails.PUT.409.message',
            defaultMessage: 'The username that you have entered is already in use by another user on the system',
          },
          resolution: {
            id: 'errorResponseMessages.saveLoginDetails.PUT.409.resolution',
            defaultMessage: 'Please try another username',
          },
        })
      ),
      default: errorPleaseTryAgainInAFewMinutes(
        defineMessages({
          title: {
            id: 'errorResponseMessages.saveLoginDetails.PUT.default.title',
            defaultMessage: 'Saving Login Details Failed',
          },
        })
      ),
    },
  })

const useUpdateOwnLoginDetails = personId => {
  const queryClient = useQueryClient()
  return useMutation(updateOwnLoginDetails, {
    onSuccess: json => {
      updateSessionTokens({
        access: json.access,
        refresh: json.refresh,
        clientId: json.clientId,
      })
      queryClient.invalidateQueries([PERSON_KEY, 'person', personId])
    },
  })
}

export default useUpdateOwnLoginDetails
