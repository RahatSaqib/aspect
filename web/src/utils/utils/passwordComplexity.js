const MIN_PASSWORD_LENGTH = 12
const PASSPHRASE_LENGTH = 16

const PASSWORD_HINT_KEYS = {
  ADD_CHARACTER_TYPE_OR_LONGER: 'addCharacterTypeOrLonger',
  ADD_NUMBERS_SYMBOLS_OR_LONGER: 'addNumbersSymbolsOrLonger',
  ADD_UPPERCASE_SYMBOL_OR_LONGER: 'addUppercaseSymbolOrLonger',
  INITIAL: 'initial',
  MIN_LENGTH: 'minLength',
  MIN_LENGTH_AND_VARIETY: 'minLengthAndVariety',
}

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

function getPasswordHintKey(password = '') {
  if (!password) return PASSWORD_HINT_KEYS.INITIAL

  const complexity = getPasswordComplexity(password)
  if (complexity.acceptable) return null

  if (complexity.length < MIN_PASSWORD_LENGTH) {
    return complexity.classCount < 3 ? PASSWORD_HINT_KEYS.MIN_LENGTH_AND_VARIETY : PASSWORD_HINT_KEYS.MIN_LENGTH
  }

  const { classes } = complexity
  if (complexity.classCount === 1 && (classes.lowercase || classes.uppercase)) {
    return PASSWORD_HINT_KEYS.ADD_NUMBERS_SYMBOLS_OR_LONGER
  }
  if (complexity.classCount === 2 && classes.lowercase && classes.digit) {
    return PASSWORD_HINT_KEYS.ADD_UPPERCASE_SYMBOL_OR_LONGER
  }

  return PASSWORD_HINT_KEYS.ADD_CHARACTER_TYPE_OR_LONGER
}

export {
  MIN_PASSWORD_LENGTH,
  PASSPHRASE_LENGTH,
  PASSWORD_HINT_KEYS,
  getPasswordComplexity,
  getPasswordHintKey,
  isPasswordAcceptable,
}
