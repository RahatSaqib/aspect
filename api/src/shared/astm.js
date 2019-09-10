const _ = require('lodash')
const {
  getAllStringsEnclosedBetweenCharacters,
  splitWithEscape,
  stringContains,
  stringReplace,
  escapeReservedRegexCharacters,
} = require('./string')

function getDelimiters(
  astmMessage,
  explicitDelimiters = {
    fieldDelimiter: '|',
    repeatDelimiter: '\\',
    componentDelimiter: '^',
    escapeDelimiter: '&',
  }
) {
  if (_.isEmpty(explicitDelimiters)) {
    if (astmMessage.indexOf('H') > -1) {
      const delimitersString = astmMessage.substr(
        astmMessage.indexOf('H') + 1,
        4
      )
      if (
        astmMessage[astmMessage.indexOf(delimitersString) + 4] ===
        delimitersString[0]
      ) {
        return {
          fieldDelimiter: delimitersString[0],
          repeatDelimiter: delimitersString[1],
          componentDelimiter: delimitersString[2],
          escapeDelimiter: delimitersString[3],
        }
      }
    }
    return {
      fieldDelimiter: '|',
      repeatDelimiter: '\\',
      componentDelimiter: '^',
      escapeDelimiter: '&',
    }
  } else {
    return explicitDelimiters
  }
}

function getFieldValue(
  record,
  fieldNumber,
  repeatedValueNumber,
  componentNumber,
  delimiters
) {
  let fieldValue = _.get(
    splitWithEscape(
      record,
      delimiters.fieldDelimiter,
      delimiters.escapeDelimiter
    ),
    (fieldNumber || 1) - 1,
    ''
  )
  if (
    repeatedValueNumber &&
    stringContains(
      fieldValue,
      delimiters.repeatDelimiter,
      delimiters.escapeDelimiter
    )
  ) {
    fieldValue = _.get(
      splitWithEscape(
        fieldValue,
        delimiters.repeatDelimiter,
        delimiters.escapeDelimiter
      ),
      (repeatedValueNumber || 1) - 1,
      fieldValue
    )
  }
  return _.get(
    splitWithEscape(
      fieldValue,
      delimiters.componentDelimiter,
      delimiters.escapeDelimiter
    ),
    (componentNumber || 1) - 1,
    fieldValue
  )
}

// A simple ASTM parser. astmPosition is a string in the format "H,5,1,1"
function getAstmField(
  astmMessage,
  astmPosition,
  delimiters = {
    fieldDelimiter: '|',
    repeatDelimiter: '\\',
    componentDelimiter: '^',
    escapeDelimiter: '&',
  }
) {
  if (!astmMessage || !astmPosition) {
    return null
  }
  delimiters = getDelimiters(astmMessage, delimiters)

  const astmArray = astmPosition.split(',').map(p => p.trim())

  if (astmArray.length !== 4) {
    return null
  }
  const recordType = astmArray[0]
  const fieldNumberAndRepetition = astmArray[1]
  const recordTypeOccurrance = astmArray[2]
  const componentNumber = astmArray[3]

  // first, get correct record/line
  const line = _.find(
    astmMessage.split(/\r|\n/),
    l =>
      l.indexOf(
        `${recordType}${delimiters.fieldDelimiter}${
          recordType === 'H' ? '' : recordTypeOccurrance
        }`
      ) === 0
  )
  if (!line) {
    return null
  }

  // now, get correct field value of the line
  const fieldNumber = fieldNumberAndRepetition.match(/^\d*$/)
    ? recordType === 'H'
      ? fieldNumberAndRepetition - 1
      : fieldNumberAndRepetition
    : recordType === 'H'
    ? fieldNumberAndRepetition.substr(
        0,
        fieldNumberAndRepetition.indexOf('[')
      ) - 1
    : fieldNumberAndRepetition.substr(0, fieldNumberAndRepetition.indexOf('['))
  const repeatedValueNumber = _.get(
    getAllStringsEnclosedBetweenCharacters(fieldNumberAndRepetition, '[', ']'),
    0
  )
  return getFieldValue(
    line,
    fieldNumber,
    repeatedValueNumber,
    componentNumber,
    delimiters
  )
}

function getAstmE1394RecordWithChildren(astmMessage, recordPath, delimiters) {
  const messageLines = astmMessage.split(/\r|\n/)
  /*
  |----------------|---------|---------|---------|---------|---------|
  |  RECORD TYPE   | LEVEL 0 | LEVEL 1 | LEVEL 2 | LEVEL 3 | LEVEL 4 |
  |----------------|---------|---------|---------|---------|---------|
  | H (Header)     |    X    |         |         |         |         |
  | P (Patient)    |         |    X    |         |         |         |
  | O (Order)      |         |         |    X    |         |         |
  | Q (Enquiry)    |         |    X    |         |         |         |
  | C (Comment)    |         |    X    |    X    |    X    |    X    |
  | R (Result)     |         |         |         |    X    |         |
  | L (Terminator) |    X    |         |         |         |         |
  |----------------|---------|---------|---------|---------|---------|
  NOTE: Because Comments can exist at more than 1 level, to define
        where a comment exists within the message hierarchy, it will
        always be placed directly below it's immediate parent, therefore,
        a comment cannot terinate a record

  A Header (Level 0) +0
  B   Patient1 (Level 1) +1
  C     Order1 (Level 2) +1
  D       Result1 (Level 3) +1
  E     Order2 (Level 2) –1 at this point, saves A thru D
  F       Comment1 (Level 3) +1
  G     Order3 (Level 2) –1 at this point, saves E thru F
  H       Comment1 (Level 3) +1
  I   Patient2 (Level 1) –2 at this point, saves G thru H
  J     Order1 (Level 2) +1
  K       Result1 (Level 3) +1
  L         Comment1 (Level 4) +1
  M       Result2 (Level 3) –1 at this point, saves I thru L
  N       Result3 (Level 3) +0
  O     Order2 (Level 2) –1 at this point, saves M thru N
  P       Comment1 (Level 3) +1
  Q   Patient3 (Level 1) –2
  R     Order1 (Level 2) +1
  S       Result1 (Level 3) +1
  T Terminator (Level 0) –3 at this point, saves Q thru S
  */
  const recordTerminators = {
    H: ['L'],
    P: ['P', 'L'],
    O: ['O', 'P', 'L'],
    R: ['R', 'O', 'P', 'L'],
  }
  const recordTypesWithoutChildren = ['Q', 'C', 'L']
  return recordPath
    .split('.')
    .map(p => p.trim())
    .reduce((unfilteredLines, pathEntry) => {
      const recordId =
        pathEntry.length === 1
          ? `${pathEntry}`
          : `${pathEntry[0]}${delimiters.fieldDelimiter}${pathEntry.substr(1)}`
      const firstRecordIndex = _.findIndex(unfilteredLines, line =>
        new RegExp(
          `^${escapeReservedRegexCharacters(
            recordId
          )}(${escapeReservedRegexCharacters(
            delimiters.fieldDelimiter
          )}|\\\\)?`,
          'g'
        ).test(line)
      )
      const lastRecordIndex = recordTypesWithoutChildren.includes(pathEntry[0])
        ? firstRecordIndex + 1
        : _.findIndex(
            unfilteredLines,
            line =>
              _.some(
                recordTerminators[pathEntry[0]],
                terminator =>
                  line.indexOf(`${terminator}${delimiters.fieldDelimiter}`) ===
                  0
              ),
            firstRecordIndex + 1
          )
      return unfilteredLines.slice(firstRecordIndex, lastRecordIndex)
    }, messageLines)
}

/*
A more complex ASTM parser for hierarchical data structures
   recordPath           eg: H (for header) or P1.O1.R2.C1
                                              The first comment for the second result under patient 1's test order 1
   fieldNumber:         The location of the field, 1 based index
   repeatedValueNumber: Optional
                        The item within a repeated field, 1 based index.
                        When no repeatedValueNumber is specified in a repeated field,
                          the value returned will be an array of strings
   componentNumber:     Optional
                        The value within a field or repeated field value, 1 based index.
                        When no componentNumber is specified,
                          the value returned will have component delimiters replaced with a space and trimmed
   delimiters:          Optional
                        In rare cases where the delimiters used should be different from the standard ones
                          specified in E 1394-91 or the delimters specified in the message header
TODO: Deprecate getAstmField and replace with this */
function locateAstmE1394Value(
  astmMessage,
  recordPath,
  fieldNumber,
  repeatedValueNumber,
  componentNumber,
  delimiters = {
    fieldDelimiter: '|',
    repeatDelimiter: '\\',
    componentDelimiter: '^',
    escapeDelimiter: '&',
  }
) {
  if (!astmMessage || !recordPath || !fieldNumber) {
    return null
  }
  delimiters = getDelimiters(astmMessage, delimiters)
  // TODO: Reassemble wrapped lines
  const recordLines = getAstmE1394RecordWithChildren(
    astmMessage,
    recordPath,
    delimiters
  )
  if (_.isEmpty(recordLines)) {
    return null
  }
  const fieldStringValue = stringReplace(
    getFieldValue(
      recordLines[0],
      fieldNumber,
      repeatedValueNumber,
      componentNumber,
      delimiters
    ),
    delimiters.componentDelimiter,
    ' '
  ).trim()
  if (
    stringContains(
      fieldStringValue,
      delimiters.repeatDelimiter,
      delimiters.escapeDelimiter
    )
  ) {
    const fieldRepeatedValues = splitWithEscape(
      fieldStringValue,
      delimiters.repeatDelimiter,
      delimiters.escapeDelimiter
    ).map(value => value.trim())
    if (!repeatedValueNumber) {
      return fieldRepeatedValues
    }
    return _.get(fieldRepeatedValues, repeatedValueNumber)
  }
  return fieldStringValue
}

function getNumberOfAstmE1394Children(
  astmMessage,
  recordPath,
  childRecordType,
  delimiters = {
    fieldDelimiter: '|',
    repeatDelimiter: '\\',
    componentDelimiter: '^',
    escapeDelimiter: '&',
  }
) {
  if (!astmMessage || !recordPath) {
    return null
  }
  delimiters = getDelimiters(astmMessage, delimiters)
  // TODO: Reassemble wrapped lines
  const recordLines = getAstmE1394RecordWithChildren(
    astmMessage,
    recordPath,
    delimiters
  )
  if (_.isEmpty(recordLines)) {
    return null
  }
  return recordLines.filter(
    recordLine =>
      recordLine.indexOf(`${childRecordType}${delimiters.fieldDelimiter}`) === 0
  ).length
}

module.exports = {
  getAstmField,
  locateAstmE1394Value,
  getNumberOfAstmE1394Children,
}
