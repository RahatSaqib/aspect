export function errorPleaseTryAgainInAFewMinutes(titleDescriptor) {
  return {
    severity: 'error',
    title: titleDescriptor,
    resolution: {
      id: 'errorResponseMessages.common.tryAgainLater.resolution',
      defaultMessage: 'Please try again in a few minutes'
    }
  }
}

export function inlineWarning(titleDescriptor, messageDescriptor, resolutionDescriptor) {
  return {
    severity: 'warn',
    showAs: 'inline',
    title: titleDescriptor,
    message: messageDescriptor,
    resolution: resolutionDescriptor
  }
}

export function filterFieldsRejectedError(titleDescriptor) {
  return {
    severity: 'error',
    showAs: 'inline',
    title: titleDescriptor,
    message: {
      id: 'errorResponseMessages.common.filterError.message',
      defaultMessage: '<p>The server rejected the values specified in these filter fields.</p><p>Our technical team has been notified and will attend to the problem as soon as possible.</p>'
    },
    resolution: {
      id: 'errorResponseMessages.common.filterError.resolution',
      defaultMessage: '<p>In the meantime, you could try one of the following and search again:</p><ul><li>Adjust the values in these filter fields</li><li>Change the column that you are sorting on in the list</li><li>Change the page number that you are viewing</li></ul>'
    }
  }
}
