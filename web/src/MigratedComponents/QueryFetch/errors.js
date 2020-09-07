import { defineMessages } from 'react-intl'
import {
  errorPleaseTryAgainInAFewMinutes,
  errorInsufficientScope,
} from '../../error/CommonErrorNotifications'

export const errors = {
  403: errorInsufficientScope(
    defineMessages({
      title: {
        id: 'errorResponseMessages.fetchGraphDataFromConfig.GET.403.title',
        defaultMessage: 'Insufficient Permissions',
      },
    })
  ),
}

export const mergeErrors = (endpoint, customErrorNotifications) => {
  return {
    ...errors,
    default: errorPleaseTryAgainInAFewMinutes(
      defineMessages({
        title: {
          id:
            'errorResponseMessages.fetchGraphDataFromConfig.GET.default.title',
          defaultMessage: `Error Fetching Endpoint: ${endpoint}`,
        },
      })
    ),
    ...customErrorNotifications,
  }
}
