import { validate as validateEmail } from 'email-validator'

const emailAddress = function(value) {
  const validateChain = {
    email: value,
    optional: () => {
      validateChain.isOptional = true
      return validateChain
    },
    isValid: () =>
      (!validateChain.email && validateChain.isOptional) ||
      validateEmail(value),
  }
  return validateChain
}

export default emailAddress
