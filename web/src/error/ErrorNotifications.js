export function errorPleaseTryAgainInAFewMinutes(titleDescriptor) {
  return {
    severity: 'error',
    title: titleDescriptor,
    resolution: {
      id: 'errorResponseMessages.common.default.resolution',
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
