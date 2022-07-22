import { validate as validateEmail } from 'email-validator'

const emailAddress = value => {
  const validateChain = {
    email: value,
    optional: () => {
      validateChain.isOptional = true
      return validateChain
    },
    isValid: () => (!validateChain.email && validateChain.isOptional) || validateEmail(value),
  }
  return validateChain
}

/**
 * validating only the scheme name, ://, spaces and double quotes
 * is usually enough.
 */
export const isUrl = value => /^(ftp|http|https):\/\/[^ "]+$/.test(value)

export default emailAddress
