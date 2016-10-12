import {validate as validateEmail} from 'email-validator'

export function emailAddress(value) {
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
