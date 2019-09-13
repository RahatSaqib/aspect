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
  }
  return explicitDelimiters
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

function baseOneIndex(array) {
  return [null, ...array]
}

function arrayToString(array, joinWith = ' ') {
  const joinedValues = array.filter(value => !_.isEmpty(value)).join(joinWith)
  return joinedValues === '' ? null : joinedValues
}

function astmE1394RecordToJson(
  astmRecordString,
  delimiters = {
    fieldDelimiter: '|',
    repeatDelimiter: '\\',
    componentDelimiter: '^',
    escapeDelimiter: '&',
  }
) {
  const {
    fieldDelimiter,
    repeatDelimiter,
    componentDelimiter,
    escapeDelimiter,
  } = delimiters
  const recordBeforeChecksum = astmRecordString.substr(
    0,
    astmRecordString.indexOf('\\r\\x')
  )
  return _.omit(
    {
      value: astmRecordString === '' ? null : astmRecordString,
      ...baseOneIndex(
        splitWithEscape(
          recordBeforeChecksum,
          fieldDelimiter,
          escapeDelimiter
        ).map(repeatedValueString => {
          const repeatedValues = splitWithEscape(
            repeatedValueString,
            repeatDelimiter,
            escapeDelimiter
          ).map(repeatedValue => {
            const componentValues = splitWithEscape(
              repeatedValue,
              componentDelimiter,
              escapeDelimiter
            ).map(component => component.trim())
            if (componentValues.length > 1) {
              const value = arrayToString(componentValues)
              return _.omit(
                {
                  value: value === '' ? null : value,
                  ...baseOneIndex(componentValues).map(value => ({
                    value: value === '' ? null : value,
                  })),
                },
                '0'
              )
            }
            return {
              value: componentValues[0] === '' ? null : componentValues[0],
            }
          })
          if (repeatedValues.length > 1) {
            const value = arrayToString(
              repeatedValues.map(repeatedValue =>
                _.isUndefined(repeatedValue.value)
                  ? repeatedValue
                  : repeatedValue.value
              ),
              '\n'
            )
            return _.omit(
              {
                items: repeatedValues.map((repeatedValue, index) =>
                  (index + 1).toString()
                ),
                value: value === '' ? null : value,
                ...baseOneIndex(repeatedValues),
              },
              '0'
            )
          }
          return repeatedValues[0] === '' ? null : repeatedValues[0]
        })
      ),
    },
    '0'
  )
}

function astmE1394CommentRecordToJson(
  commentsObject,
  astmCommentRecordString,
  delimiters = {
    fieldDelimiter: '|',
    repeatDelimiter: '\\',
    componentDelimiter: '^',
    escapeDelimiter: '&',
  }
) {
  const comment = astmE1394RecordToJson(astmCommentRecordString, delimiters)
  const commentRecordId = `${comment['1'].value}${comment['2'].value}`
  commentsObject[commentRecordId] = comment
  commentsObject.comments = [
    ...(commentsObject.comments || []),
    commentRecordId,
  ]
  return commentsObject
}

/*
According to the Spec, ASTM E 1394 messages should be read with the
  following hierarchy in mind:
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

This function reads a set of ASTM 1394 messages, determines
 the delimiters used in each one, then restructures them
 into JSON objects to convey the hierarchy of the records
 in each message.

Example: The following ASTM 1394 Payload contains 2 messages,
         The first message contains a complete patient record
           with a comment, a test order containing 3 results.
           The test order has a comment and the 2nd result also
           has a comment. The message also contains a comment.
         The second message contains an incomplete patient
          record with a test order containing a result.

H|\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\r\x0392\r\n
C|1|I|Example Message Comment|G\r\x0343\r\n
P|1|||PIDSID13|Patient^Im^A\And^This^Is^My^Wife|19320122|F||Dr.Amesbury|ParkClinic\r\x033F\r\n
C|1|I|Example Patient Comment|G\r\x0343\r\n
O|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||F\r\x03D0\r\n
C|1|I|Example Order Comment|G\r\x0343\r\n
R|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<|F||19990715081030|I20100\r\x03E2\r\n
R|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE||||F||19990715081030|I20100\r\x0343\r\n
R|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU|||F||19990715081030|I20100\r\x0343\r\n
C|1|I|Example Result Comment|G\r\x0343\r\n
Q|1|^SID12345||^^^ALL||O\r\x0343\r\n
L|1\r\x033F\r\n
H|\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\r\x0392\r\n
P|1\r\x033F\r\n
O|1|TSHBIORAD 2|TSHBIORAD 2^A123^2|^^^0241^TSH^UNDILUTED^P|R|||Q|F\r\x03D0\r\n
R|1|^^^0241^TSH^UNDILUTED^P^0607M200^01824^40080^F|4.6011|mIU/mL|4.292500 TO 5.397300||F|ECB^RY|19990715081030|I20100\r\x03E2\r\n
L|1\r\x033F\r\n

This function should transform the payload so that nested
  records are better represented as JSON objects
[{
  value:
    'H|\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\\r\\x0392\\r\\n\nC|1|I|Example Message Comment|G\\r\\x0343\\r\\n\nP|1|||PIDSID13|Patient^Im^A\\And^This^Is^My^Wife|19320122|F||Dr.Amesbury|ParkClinic\\r\\x033F\\r\\n\nC|1|I|Example Patient Comment|G\\r\\x0343\\r\\n\nO|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||F\\r\\x03D0\\r\\n\nC|1|I|Example Order Comment|G\\r\\x0343\\r\\n\nR|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<|F||19990715081030|I20100\\r\\x03E2\\r\\n\nR|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE||||F||19990715081030|I20100\\r\\x0343\\r\\n\nR|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU|||F||19990715081030|I20100\\r\\x0343\\r\\n\nC|1|I|Example Result Comment|G\\r\\x0343\\r\\n\nQ|1|^SID12345||^^^ALL||O\\r\\x0343\\r\\n\nL|1\\r\\x033F\\r\\n',
  H: {
    '1': { value: 'H' },
    '2': {
      '1': { value: null },
      '2': {
        '1': { value: null },
        '2': { value: '|' },
        value: '|',
      },
      items: ['1', '2'],
      value: '|',
    },
    '3': { value: null },
    '4': {
      '1': { value: 'Name of Instrument' },
      '2': { value: '1.0.0.0' },
      value: 'Name of Instrument 1.0.0.0',
    },
    '5': { value: 'P' },
    '6': { value: '1' },
    '7': { value: '19930330133346' },
    value:
      'H|\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\\r\\x0392\\r\\n',
    P1: {
      '1': { value: 'P' },
      '2': { value: '1' },
      '3': { value: null },
      '4': { value: null },
      '5': { value: 'PIDSID13' },
      '6': {
        '1': {
          '1': { value: 'Patient' },
          '2': { value: 'Im' },
          '3': { value: 'A' },
          value: 'Patient Im A',
        },
        '2': {
          '1': { value: 'And' },
          '2': { value: 'This' },
          '3': { value: 'Is' },
          '4': { value: 'My' },
          '5': { value: 'Wife' },
          value: 'And This Is My Wife',
        },
        items: ['1', '2'],
        value: 'Patient Im A\nAnd This Is My Wife',
      },
      '7': { value: '19320122' },
      '8': { value: 'F' },
      '9': { value: null },
      '10': { value: 'Dr.Amesbury' },
      '11': { value: 'ParkClinic' },
      value:
        'P|1|||PIDSID13|Patient^Im^A\\And^This^Is^My^Wife|19320122|F||Dr.Amesbury|ParkClinic\\r\\x033F\\r\\n',
      O1: {
        '1': { value: 'O' },
        '2': { value: '1' },
        '3': { value: 'SID13' },
        '4': {
          '1': { value: 'SID3' },
          '2': { value: 'A123' },
          '3': { value: '5' },
          value: 'SID3 A123 5',
        },
        '5': {
          '1': { value: null },
          '2': { value: null },
          '3': { value: null },
          '4': { value: '123' },
          '5': { value: 'Assay1' },
          '6': { value: 'UNDILUTED' },
          '7': { value: 'P' },
          value: '123 Assay1 UNDILUTED P',
        },
        '6': { value: 'R' },
        '7': { value: null },
        '8': { value: '20010223081223' },
        '9': { value: null },
        '10': { value: 'F' },
        value:
          'O|1|SID13|SID3^A123^5|^^^123^Assay1^UNDILUTED^P|R||20010223081223||F\\r\\x03D0\\r\\n',
        R1: {
          '1': { value: 'R' },
          '2': { value: '1' },
          '3': {
            '1': { value: null },
            '2': { value: null },
            '3': { value: null },
            '4': { value: '0021' },
            '5': { value: 'B-hCG' },
            '6': { value: 'UNDILUTED' },
            '7': { value: 'P' },
            '8': { value: '47331M100' },
            '9': { value: '00788' },
            '10': { value: null },
            '11': { value: 'F' },
            value: '0021 B-hCG UNDILUTED P 47331M100 00788 F',
          },
          '4': { value: '<1.20' },
          '5': { value: 'mIU/mL' },
          '6': { value: '0.35 TO 4.94' },
          '7': {
            '1': { value: 'EXP' },
            '2': { value: '<' },
            value: 'EXP <',
          },
          '8': { value: 'F' },
          '9': { value: null },
          '10': { value: '19990715081030' },
          '11': { value: 'I20100' },
          value:
            'R|1|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^F|<1.20|mIU/mL|0.35 TO 4.94|EXP^<|F||19990715081030|I20100\\r\\x03E2\\r\\n',
        },
        results: ['R1', 'R2', 'R3'],
        R2: {
          '1': { value: 'R' },
          '2': { value: '2' },
          '3': {
            '1': { value: null },
            '2': { value: null },
            '3': { value: null },
            '4': { value: '0021' },
            '5': { value: 'B-hCG' },
            '6': { value: 'UNDILUTED' },
            '7': { value: 'P' },
            '8': { value: '47331M100' },
            '9': { value: '00788' },
            '10': { value: null },
            '11': { value: 'I' },
            value: '0021 B-hCG UNDILUTED P 47331M100 00788 I',
          },
          '4': { value: 'NEGATIVE' },
          '5': { value: null },
          '6': { value: null },
          '7': { value: null },
          '8': { value: 'F' },
          '9': { value: null },
          '10': { value: '19990715081030' },
          '11': { value: 'I20100' },
          value:
            'R|2|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^I|NEGATIVE||||F||19990715081030|I20100\\r\\x0343\\r\\n',
        },
        R3: {
          '1': { value: 'R' },
          '2': { value: '3' },
          '3': {
            '1': { value: null },
            '2': { value: null },
            '3': { value: null },
            '4': { value: '0021' },
            '5': { value: 'B-hCG' },
            '6': { value: 'UNDILUTED' },
            '7': { value: 'P' },
            '8': { value: '47331M100' },
            '9': { value: '00788' },
            '10': { value: null },
            '11': { value: 'P' },
            value: '0021 B-hCG UNDILUTED P 47331M100 00788 P',
          },
          '4': { value: '9245' },
          '5': { value: 'RLU' },
          '6': { value: null },
          '7': { value: null },
          '8': { value: 'F' },
          '9': { value: null },
          '10': { value: '19990715081030' },
          '11': { value: 'I20100' },
          value:
            'R|3|^^^0021^B-hCG^UNDILUTED^P^47331M100^00788^^P|9245|RLU|||F||19990715081030|I20100\\r\\x0343\\r\\n',
          C1: {
            '1': { value: 'C' },
            '2': { value: '1' },
            '3': { value: 'I' },
            '4': { value: 'Example Result Comment' },
            '5': { value: 'G' },
            value: '\nC|1|I|Example Result Comment|G\\r\\x0343\\r\\n',
          },
          comments: ['C1'],
        },
        C1: {
          '1': { value: 'C' },
          '2': { value: '1' },
          '3': { value: 'I' },
          '4': { value: 'Example Order Comment' },
          '5': { value: 'G' },
          value: '\nC|1|I|Example Order Comment|G\\r\\x0343\\r\\n',
        },
        comments: ['C1'],
      },
      orders: ['O1'],
      C1: {
        '1': { value: 'C' },
        '2': { value: '1' },
        '3': { value: 'I' },
        '4': { value: 'Example Patient Comment' },
        '5': { value: 'G' },
        value: 'C|1|I|Example Patient Comment|G\\r\\x0343\\r\\n',
      },
      comments: ['C1'],
    },
    patients: ['P1'],
    Q1: {
      '1': { value: 'Q' },
      '2': { value: '1' },
      '3': {
        '1': { value: null },
        '2': { value: 'SID12345' },
        value: 'SID12345',
      },
      '4': { value: null },
      '5': {
        '1': { value: null },
        '2': { value: null },
        '3': { value: null },
        '4': { value: 'ALL' },
        value: 'ALL',
      },
      '6': { value: null },
      '7': { value: 'O' },
      value: 'Q|1|^SID12345||^^^ALL||O\\r\\x0343\\r\\n',
    },
    enquiries: ['Q1'],
    C1: {
      '1': { value: 'C' },
      '2': { value: '1' },
      '3': { value: 'I' },
      '4': { value: 'Example Message Comment' },
      '5': { value: 'G' },
      value: 'C|1|I|Example Message Comment|G\\r\\x0343\\r\\n',
    },
    comments: ['C1'],
  },
  L: {
    '1': { value: 'L' },
    '2': { value: '1' },
    value: 'L|1\\r\\x033F\\r\\n',
  },
}, {
  value:
    'H|\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\\r\\x0392\\r\\n\nP|1\\r\\x033F\\r\\n\nO|1|TSHBIORAD 2|TSHBIORAD 2^A123^2|^^^0241^TSH^UNDILUTED^P|R|||Q|F\\r\\x03D0\\r\\n\nR|1|^^^0241^TSH^UNDILUTED^P^0607M200^01824^40080^F|4.6011|mIU/mL|4.292500 TO 5.397300||F|ECB^RY|19990715081030|I20100\\r\\x03E2\\r\\n\nL|1\\r\\x033F\\r\\n',
  H: {
    '1': { value: 'H' },
    '2': {
      '1': { value: null },
      '2': {
        '1': { value: null },
        '2': { value: '|' },
        value: '|',
      },
      items: ['1', '2'],
      value: '|',
    },
    '3': { value: null },
    '4': {
      '1': { value: 'Name of Instrument' },
      '2': { value: '1.0.0.0' },
      value: 'Name of Instrument 1.0.0.0',
    },
    '5': { value: 'P' },
    '6': { value: '1' },
    '7': { value: '19930330133346' },
    value:
      'H|\\^&|||Name of Instrument^1.0.0.0|P|1|19930330133346\\r\\x0392\\r\\n',
    P1: {
      '1': { value: 'P' },
      '2': { value: '1' },
      value: 'P|1\\r\\x033F\\r\\n',
      O1: {
        '1': { value: 'O' },
        '2': { value: '1' },
        '3': { value: 'TSHBIORAD 2' },
        '4': {
          '1': { value: 'TSHBIORAD 2' },
          '2': { value: 'A123' },
          '3': { value: '2' },
          value: 'TSHBIORAD 2 A123 2',
        },
        '5': {
          '1': { value: null },
          '2': { value: null },
          '3': { value: null },
          '4': { value: '0241' },
          '5': { value: 'TSH' },
          '6': { value: 'UNDILUTED' },
          '7': { value: 'P' },
          value: '0241 TSH UNDILUTED P',
        },
        '6': { value: 'R' },
        '7': { value: null },
        '8': { value: null },
        '9': { value: 'Q' },
        '10': { value: 'F' },
        value:
          'O|1|TSHBIORAD 2|TSHBIORAD 2^A123^2|^^^0241^TSH^UNDILUTED^P|R|||Q|F\\r\\x03D0\\r\\n',
        R1: {
          '1': { value: 'R' },
          '2': { value: '1' },
          '3': {
            '1': { value: null },
            '2': { value: null },
            '3': { value: null },
            '4': { value: '0241' },
            '5': { value: 'TSH' },
            '6': { value: 'UNDILUTED' },
            '7': { value: 'P' },
            '8': { value: '0607M200' },
            '9': { value: '01824' },
            '10': { value: '40080' },
            '11': { value: 'F' },
            value: '0241 TSH UNDILUTED P 0607M200 01824 40080 F',
          },
          '4': { value: '4.6011' },
          '5': { value: 'mIU/mL' },
          '6': { value: '4.292500 TO 5.397300' },
          '7': { value: null },
          '8': { value: 'F' },
          '9': {
            '1': { value: 'ECB' },
            '2': { value: 'RY' },
            value: 'ECB RY',
          },
          '10': { value: '19990715081030' },
          '11': { value: 'I20100' },
          value:
            'R|1|^^^0241^TSH^UNDILUTED^P^0607M200^01824^40080^F|4.6011|mIU/mL|4.292500 TO 5.397300||F|ECB^RY|19990715081030|I20100\\r\\x03E2\\r\\n',
        },
        results: ['R1'],
      },
      orders: ['O1'],
    },
    patients: ['P1'],
  },
  L: {
    '1': { value: 'L' },
    '2': { value: '1' },
    value: 'L|1\\r\\x033F\\r\\n',
  },
}]

This allows the user to lookup a value using path syntax
  Examples: const result3AssayCode = _.get(jsonResult[0], 'H.R3.3.3.4.value') // 0021
            const result3AssayName = _.get(jsonResult[0], 'H.R3.3.3.5.value') // B-hCG
*/
function astmE1394MessagesToJson(
  astmPayloadString,
  defaultDelimiters = {
    fieldDelimiter: '|',
    repeatDelimiter: '\\',
    componentDelimiter: '^',
    escapeDelimiter: '&',
  }
) {
  if (!astmPayloadString) {
    return null
  }
  const astmRecords = astmPayloadString.split(/\r|\n/)
  return astmRecords
    .reduce((astmMessages, astmRecord, index) => {
      if (/^H/.test(astmRecord)) {
        const delimiters = getDelimiters(astmRecord, defaultDelimiters)
        if (astmRecord[1] === delimiters.fieldDelimiter) {
          astmMessages = [
            ...astmMessages,
            {
              rawMessage: astmRecord,
              rawHeader: astmRecord,
              delimiters,
              patients: [],
              enquiries: [],
              comments: [],
            },
          ]
        }
      } else if (!_.isEmpty(astmMessages)) {
        const astmMessage = astmMessages[astmMessages.length - 1]
        const { delimiters } = astmMessage
        astmMessage.rawMessage += `\n${astmRecord}`
        if (
          new RegExp(
            `^P${escapeReservedRegexCharacters(delimiters.fieldDelimiter)}\\d`,
            'g'
          ).test(astmRecord)
        ) {
          astmMessage.patients = [
            ...astmMessage.patients,
            {
              rawMessage: `${astmRecord}`,
              orders: [],
              comments: [],
            },
          ]
        } else if (
          new RegExp(
            `^O${escapeReservedRegexCharacters(delimiters.fieldDelimiter)}\\d`,
            'g'
          ).test(astmRecord)
        ) {
          if (!_.isEmpty(astmMessage.patients)) {
            const patient =
              astmMessage.patients[astmMessage.patients.length - 1]
            patient.orders = [
              ...patient.orders,
              {
                rawMessage: `${astmRecord}`,
                results: [],
                comments: [],
              },
            ]
          }
        } else if (
          new RegExp(
            `^R${escapeReservedRegexCharacters(delimiters.fieldDelimiter)}\\d`,
            'g'
          ).test(astmRecord)
        ) {
          if (!_.isEmpty(astmMessage.patients)) {
            const patient =
              astmMessage.patients[astmMessage.patients.length - 1]
            if (!_.isEmpty(patient.orders)) {
              const order = patient.orders[patient.orders.length - 1]
              order.results = [
                ...order.results,
                {
                  rawMessage: `${astmRecord}`,
                  comments: [],
                },
              ]
            }
          }
        } else if (
          new RegExp(
            `^Q${escapeReservedRegexCharacters(delimiters.fieldDelimiter)}\\d`,
            'g'
          ).test(astmRecord)
        ) {
          astmMessage.enquiries = [
            ...astmMessage.enquiries,
            {
              rawMessage: `${astmRecord}`,
            },
          ]
        } else if (
          new RegExp(
            `^C${escapeReservedRegexCharacters(delimiters.fieldDelimiter)}\\d`,
            'g'
          ).test(astmRecord)
        ) {
          if (_.isEmpty(astmMessage.patients)) {
            astmMessage.comments = [
              ...astmMessage.comments,
              {
                rawMessage: `${astmRecord}`,
              },
            ]
          } else {
            const patient =
              astmMessage.patients[astmMessage.patients.length - 1]
            if (_.isEmpty(patient.orders)) {
              patient.comments = [
                ...patient.comments,
                {
                  rawMessage: `${astmRecord}`,
                },
              ]
            } else {
              const order = patient.orders[patient.orders.length - 1]
              if (_.isEmpty(order.results)) {
                order.comments = [
                  ...order.comments,
                  {
                    rawMessage: `\n${astmRecord}`,
                  },
                ]
              } else {
                const result = order.results[order.results.length - 1]
                result.comments = [
                  ...result.comments,
                  {
                    rawMessage: `\n${astmRecord}`,
                  },
                ]
              }
            }
          }
        } else if (
          new RegExp(
            `^L${escapeReservedRegexCharacters(delimiters.fieldDelimiter)}\\d`,
            'g'
          ).test(astmRecord)
        ) {
          astmMessage.rawTerminator = astmRecord
        } else if (index > 0) {
          const previousAstmRecord = astmRecords[index - 1]
          if (
            new RegExp(
              `^H${escapeReservedRegexCharacters(delimiters.fieldDelimiter)}`,
              'g'
            ).test(previousAstmRecord)
          ) {
            previousAstmRecord.rawHeader += astmRecord
          } else if (
            new RegExp(
              `^P${escapeReservedRegexCharacters(
                delimiters.fieldDelimiter
              )}\\d`,
              'g'
            ).test(previousAstmRecord)
          ) {
            if (!_.isEmpty(astmMessage.patients)) {
              const patient =
                astmMessage.patients[astmMessage.patients.length - 1]
              patient.rawMessage += `${astmRecord}`
            }
          } else if (
            new RegExp(
              `^O${escapeReservedRegexCharacters(
                delimiters.fieldDelimiter
              )}\\d`,
              'g'
            ).test(previousAstmRecord)
          ) {
            if (!_.isEmpty(astmMessage.patients)) {
              const patient =
                astmMessage.patients[astmMessage.patients.length - 1]
              if (!_.isEmpty(patient.orders)) {
                const order = patient.orders[patient.orders.length - 1]
                order.rawMessage += `${astmRecord}`
              }
            }
          } else if (
            new RegExp(
              `^R${escapeReservedRegexCharacters(
                delimiters.fieldDelimiter
              )}\\d`,
              'g'
            ).test(previousAstmRecord)
          ) {
            if (!_.isEmpty(astmMessage.patients)) {
              const patient =
                astmMessage.patients[astmMessage.patients.length - 1]
              if (!_.isEmpty(patient.orders)) {
                const order = patient.orders[patient.orders.length - 1]
                if (!_.isEmpty(order.results)) {
                  const result = order.results[order.results.length - 1]
                  result.rawMessage += `${astmRecord}`
                }
              }
            }
          } else if (
            new RegExp(
              `^Q${escapeReservedRegexCharacters(
                delimiters.fieldDelimiter
              )}\\d`,
              'g'
            ).test(previousAstmRecord)
          ) {
            if (!_.isEmpty(astmMessage.enquiries)) {
              const enquiry =
                astmMessage.enquiries[astmMessage.enquiries.length - 1]
              enquiry.rawMessage += `${astmRecord}`
            }
          } else if (
            new RegExp(
              `^C${escapeReservedRegexCharacters(
                delimiters.fieldDelimiter
              )}\\d`,
              'g'
            ).test(previousAstmRecord)
          ) {
            if (_.isEmpty(astmMessage.patients)) {
              if (!_.isEmpty(astmMessage.comments)) {
                const comment = astmMessage.comments[astmMessage.comments - 1]
                comment.rawMessage += `${astmRecord}`
              }
            } else {
              const patient =
                astmMessage.patients[astmMessage.patients.length - 1]
              if (_.isEmpty(patient.orders)) {
                if (!_.isEmpty(patient.comments)) {
                  const comment = patient.comments[patient.comments - 1]
                  comment.rawMessage += `${astmRecord}`
                }
              } else {
                const order = patient.orders[patient.orders.length - 1]
                if (_.isEmpty(order.results)) {
                  if (!_.isEmpty(order.comments)) {
                    const comment = order.comments[order.comments - 1]
                    comment.rawMessage += `${astmRecord}`
                  }
                } else {
                  const result = order.results[order.results.length - 1]
                  if (!_.isEmpty(result.comments)) {
                    const comment = result.comments[result.comments - 1]
                    comment.rawMessage += `${astmRecord}`
                  }
                }
              }
            }
          } else if (
            new RegExp(
              `^L${escapeReservedRegexCharacters(
                delimiters.fieldDelimiter
              )}\\d`,
              'g'
            ).test(previousAstmRecord)
          ) {
            astmMessage.rawTerminator += astmRecord
          }
        }
      }
      return astmMessages
    }, [])
    .map(astmMessage => {
      const { delimiters } = astmMessage
      return {
        value: astmMessage.rawMessage === '' ? null : astmMessage.rawMessage,
        H: {
          ...astmE1394RecordToJson(astmMessage.rawHeader, delimiters),
          ...astmMessage.patients.reduce(
            (patientsObject, patientAstmMessage) => {
              const patient = {
                ...astmE1394RecordToJson(
                  patientAstmMessage.rawMessage,
                  delimiters
                ),
                ...patientAstmMessage.orders.reduce(
                  (ordersObject, orderAstmMessage) => {
                    const order = {
                      ...astmE1394RecordToJson(
                        orderAstmMessage.rawMessage,
                        delimiters
                      ),
                      ...orderAstmMessage.results.reduce(
                        (resultsObject, resultAstmMessage) => {
                          const result = {
                            ...astmE1394RecordToJson(
                              resultAstmMessage.rawMessage,
                              delimiters
                            ),
                            ...resultAstmMessage.comments
                              .map(comment => comment.rawMessage)
                              .reduce(
                                (commentsObject, astmCommentRecordString) =>
                                  astmE1394CommentRecordToJson(
                                    commentsObject,
                                    astmCommentRecordString,
                                    delimiters
                                  ),
                                {}
                              ),
                          }
                          const resultRecordId = `${result['1'].value}${result['2'].value}`
                          resultsObject[resultRecordId] = result
                          resultsObject.results = [
                            ...(resultsObject.results || []),
                            resultRecordId,
                          ]
                          return resultsObject
                        },
                        {}
                      ),
                      ...orderAstmMessage.comments
                        .map(comment => comment.rawMessage)
                        .reduce(
                          (commentsObject, astmCommentRecordString) =>
                            astmE1394CommentRecordToJson(
                              commentsObject,
                              astmCommentRecordString,
                              delimiters
                            ),
                          {}
                        ),
                    }
                    const orderRecordId = `${order['1'].value}${order['2'].value}`
                    ordersObject[orderRecordId] = order
                    ordersObject.orders = [
                      ...(ordersObject.orders || []),
                      orderRecordId,
                    ]
                    return ordersObject
                  },
                  {}
                ),
                ...patientAstmMessage.comments
                  .map(comment => comment.rawMessage)
                  .reduce(
                    (commentsObject, astmCommentRecordString) =>
                      astmE1394CommentRecordToJson(
                        commentsObject,
                        astmCommentRecordString,
                        delimiters
                      ),
                    {}
                  ),
              }
              const patientRecordId = `${patient['1'].value}${patient['2'].value}`
              patientsObject[patientRecordId] = patient
              patientsObject.patients = [
                ...(patientsObject.patients || []),
                patientRecordId,
              ]
              return patientsObject
            },
            {}
          ),
          ...astmMessage.enquiries.reduce(
            (enquiriesObject, enquiryAstmMessage) => {
              const enquiry = astmE1394RecordToJson(
                enquiryAstmMessage.rawMessage,
                delimiters
              )
              const enquiryRecordId = `${enquiry['1'].value}${enquiry['2'].value}`
              enquiriesObject[enquiryRecordId] = enquiry
              enquiriesObject.enquiries = [
                ...(enquiriesObject.enquiries || []),
                enquiryRecordId,
              ]
              return enquiriesObject
            },
            {}
          ),
          ...astmMessage.comments
            .map(comment => comment.rawMessage)
            .reduce(
              (commentsObject, astmCommentRecordString) =>
                astmE1394CommentRecordToJson(
                  commentsObject,
                  astmCommentRecordString,
                  delimiters
                ),
              {}
            ),
        },
        L: astmE1394RecordToJson(astmMessage.rawTerminator, delimiters),
      }
    })
}

module.exports = {
  getAstmField,
  locateAstmE1394Value,
  getNumberOfAstmE1394Children,
  astmE1394MessagesToJson,
}
