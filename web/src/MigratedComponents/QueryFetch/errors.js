import { defineMessages } from 'react-intl'
import {
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
  errorForbidden,
} from '../../error/CommonErrorNotifications'

const defaultErrors = endpoint => ({
  401: errorInsufficientScope(
    defineMessages({
      title: {
        id: 'errorResponseMessages.fetchGraphDataFromConfig.GET.403.title',
        defaultMessage: 'Insufficient Permissions',
      },
    })
  ),
  403: errorForbidden(
    defineMessages({
      title: {
        id: 'errorResponseMessages.fetchGraphDataFromConfig.GET.403.title',
        defaultMessage: 'Access denied',
      },
    })
  ),
  default: errorPleaseTryAgainInAFewMinutes(
    defineMessages({
      title: {
        id: 'errorResponseMessages.fetchGraphDataFromConfig.GET.default.title',
        defaultMessage: `Error Fetching Endpoint: ${endpoint}`,
      },
    })
  ),
})

export default defaultErrors
