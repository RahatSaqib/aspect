import { defineMessages } from 'react-intl'

export function errorPleaseTryAgainInAFewMinutes(messageDescriptors, messageValues) {
  return {
    severity: 'error',
    ...defineMessages({
      resolution: {
        id: 'errorResponseMessages.common.tryAgainLater.resolution',
        defaultMessage: 'Please try again in a few minutes'
      }
    }),
    ...messageDescriptors,
    messageValues
  }
}

export function inlineErrorPleaseTryAgainInAFewMinutes(messageDescriptors, messageValues) {
  return {
    ...errorPleaseTryAgainInAFewMinutes(messageDescriptors, messageValues),
    showAs: 'inline'
  }
}

export function errorNotFound(messageDescriptors) {
  return {
    severity: 'error',
    ...defineMessages({
      message: {
        id: 'errorResponseMessages.common.notFound.message',
        defaultMessage: 'It might have been deleted or renamed'
      },
      resolution: {
        id: 'errorResponseMessages.common.notFound.resolution',
        defaultMessage: 'Please check that it still exists'
      }
    }),
    ...messageDescriptors
  }
}

export function inlineWarning(messageDescriptors) {
  return {
    severity: 'warn',
    showAs: 'inline',
    ...messageDescriptors
  }
}

export function filterFieldsRejectedError(messageDescriptors) {
  return {
    severity: 'error',
    showAs: 'inline',
    ...defineMessages({
      message: {
        id: 'errorResponseMessages.common.filterError.message',
        defaultMessage: '<p>The server rejected the values specified in these filter fields.</p><p>Our technical team has been notified and will attend to the problem as soon as possible.</p>'
      },
      resolution: {
        id: 'errorResponseMessages.common.filterError.resolution',
        defaultMessage: '<p>In the meantime, you could try one of the following and search again:</p><ul><li>Adjust the values in these filter fields</li><li>Change the column that you are sorting on in the list</li><li>Change the page number that you are viewing</li></ul>'
      }
    }),
    ...messageDescriptors
  }
}
