const MIN_PASSWORD_LENGTH = 12
const PASSPHRASE_LENGTH = 16

function getPasswordComplexity(password = '') {
  const value = String(password)
  const classes = {
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    digit: /\d/.test(value),
    special: /[^A-Za-z0-9\s]/.test(value),
  }
  const classCount = Object.values(classes).filter(Boolean).length
  const { length } = value
  const acceptable =
    value.trim().length > 0 && length >= MIN_PASSWORD_LENGTH && (classCount >= 3 || length >= PASSPHRASE_LENGTH)

  return {
    acceptable,
    classCount,
    classes,
    length,
    missingClasses: Object.keys(classes).filter(name => !classes[name]),
  }
}

const isPasswordAcceptable = password => getPasswordComplexity(password).acceptable

module.exports = {
  MIN_PASSWORD_LENGTH,
  PASSPHRASE_LENGTH,
  getPasswordComplexity,
  isPasswordAcceptable,
}
