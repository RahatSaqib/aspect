import {validate as validateEmail} from 'email-validator'

function emailAddress(value) {
  let validateChain = {
    email: value,
    optional: () => {
      validateChain.isOptional = true
      return validateChain
    },
    isValid: () => {
      return (!validateChain.email && validateChain.isOptional) || validateEmail(value)
    }
  }
  return validateChain
}

export default {
  emailAddress: emailAddress
}
