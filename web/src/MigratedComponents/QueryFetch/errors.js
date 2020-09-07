import { defineMessages } from 'react-intl'
import {
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../../error/CommonErrorNotifications'

const defaultErrors = endpoint => ({
  403: errorInsufficientScope(
    defineMessages({
      title: {
        id: 'errorResponseMessages.fetchGraphDataFromConfig.GET.403.title',
        defaultMessage: 'Insufficient Permissions',
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
