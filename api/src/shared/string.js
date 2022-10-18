const _ = require('lodash')

function convertStringToFloat(stringValue) {
  const convertedValue = parseFloat(stringValue)
  if (_.isNaN(convertedValue)) {
    return null
  }
  return convertedValue
}

function escapeReservedRegexCharacters(stringToEscape) {
  const reservedCharacters = [
    '.',
    '\\',
    '+',
    '*',
    '?',
    '[',
    '^',
    ']',
    '$',
    '(',
    ')',
    '{',
    '}',
    '=',
    '!',
    '<',
    '>',
    '|',
    ':',
    '-',
  ]
  let escapedString = ''
  for (let i = 0; i < stringToEscape.length; i++) {
    if (
      reservedCharacters.includes(stringToEscape[i]) &&
      (i === 0 ||
        stringToEscape[i - 1] !== '\\' ||
        (stringToEscape[i] === '\\' &&
          i < stringToEscape.length - 1 &&
          !reservedCharacters.includes(stringToEscape[i + 1])))
    ) {
      escapedString += '\\'
    }
    escapedString += stringToEscape[i]
  }
  return escapedString
}

function getAllStringsEnclosedBetweenCharacters(
  stringContainingQuotes,
  startQuoteCharacter = "'",
  endQuoteCharacter = null
) {
  startQuoteCharacter = escapeReservedRegexCharacters(startQuoteCharacter)
  if (!endQuoteCharacter) {
    endQuoteCharacter = startQuoteCharacter
  } else {
    endQuoteCharacter = escapeReservedRegexCharacters(endQuoteCharacter)
  }
  const regex = new RegExp(`${startQuoteCharacter}([\\s\\S]*?)${endQuoteCharacter}`, 'g')
  const result = []
  let current = regex.exec(stringContainingQuotes)
  while (current) {
    result.push(current.pop())
    current = regex.exec(stringContainingQuotes)
  }
  return result
}

function splitWithEscape(stringToSplit, splitOnCharacter, escapeCharacter) {
  const s = escapeReservedRegexCharacters(splitOnCharacter)
  const e = escapeReservedRegexCharacters(escapeCharacter)
  const regex = new RegExp(`([^${e}])${s}|^${s}`, 'g')
  const safeDelimiter = '\u000B'
  let stringBeingSplit = stringToSplit.replace(regex, `$1${safeDelimiter}`)
  while (regex.test(stringBeingSplit)) {
    stringBeingSplit = stringBeingSplit.replace(regex, `$1${safeDelimiter}`)
  }
  return stringBeingSplit.split(safeDelimiter).map(item => item.replace(new RegExp(e, 'g'), ''))
}

function splitCsvWithTrim(csv, defaultValue) {
  return csv ? csv.split(',').map(name => name.trim()) : [defaultValue]
}

function nullIfEmpty(value) {
  return value === '' ? null : value
}

function isNumeric(value) {
  return !isNaN(value) // eslint-disable-line no-restricted-globals
}

module.exports = {
  convertStringToFloat,
  getAllStringsEnclosedBetweenCharacters,
  splitWithEscape,
  splitCsvWithTrim,
  escapeReservedRegexCharacters,
  nullIfEmpty,
  isNumeric,
}
