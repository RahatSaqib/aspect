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

function structureAstmE1394(
  astmPayload,
  defaultDelimiters = {
    fieldDelimiter: '|',
    repeatDelimiter: '\\',
    componentDelimiter: '^',
    escapeDelimiter: '&',
  }
) {
  if (!astmPayload) {
    return null
  }
  const astmRecords = astmPayload.split(/\r|\n/)
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
      const {
        delimiters: {
          fieldDelimiter,
          repeatDelimiter,
          componentDelimiter,
          escapeDelimiter,
        },
      } = astmMessage
      const baseOneIndex = array => [null, ...array]
      const arrayToString = (array, joinWith = ' ') =>
        array.filter(value => !_.isEmpty(value)).join(joinWith)
      const parseFieldForComponents = fieldValue => {
        const componentValues = splitWithEscape(
          fieldValue,
          componentDelimiter,
          escapeDelimiter
        ).map(component => component.trim())
        if (componentValues.length > 1) {
          return {
            value: arrayToString(componentValues),
            ...baseOneIndex(componentValues),
          }
        }
        return componentValues[0]
      }
      const parseFieldForRepeats = repeatedValueString => {
        const repeatedValues = splitWithEscape(
          repeatedValueString,
          repeatDelimiter,
          escapeDelimiter
        ).map(repeatedValue => parseFieldForComponents(repeatedValue))
        if (repeatedValues.length > 1) {
          return {
            value: arrayToString(
              repeatedValues.map(repeatedValue =>
                _.isUndefined(repeatedValue.value)
                  ? repeatedValue
                  : repeatedValue.value
              ),
              '\n'
            ),
            ...baseOneIndex(repeatedValues),
          }
        }
        return repeatedValues[0]
      }
      const parseRecordForFields = recordString => {
        const recordBeforeChecksum = recordString.substr(
          0,
          recordString.indexOf('\\r\\x')
        )
        return baseOneIndex(
          splitWithEscape(
            recordBeforeChecksum,
            fieldDelimiter,
            escapeDelimiter
          ).map(fieldValue => parseFieldForRepeats(fieldValue))
        )
      }
      return {
        value: astmMessage.rawMessage,
        H: {
          value: astmMessage.rawHeader,
          ...parseRecordForFields(astmMessage.rawHeader),
        },
        L: {
          value: astmMessage.rawTerminator,
          ...parseRecordForFields(astmMessage.rawTerminator),
        },
        ...astmMessage.patients.reduce((patientsObject, patientAstmMessage) => {
          const patient = {
            value: patientAstmMessage.rawMessage,
            ...parseRecordForFields(patientAstmMessage.rawMessage),
            ...patientAstmMessage.orders.reduce(
              (ordersObject, orderAstmMessage) => {
                const order = {
                  value: orderAstmMessage.rawMessage,
                  ...parseRecordForFields(orderAstmMessage.rawMessage),
                  ...orderAstmMessage.results.reduce(
                    (resultsObject, resultAstmMessage) => {
                      const result = {
                        value: resultAstmMessage.rawMessage,
                        ...parseRecordForFields(resultAstmMessage.rawMessage),
                        ...resultAstmMessage.comments.reduce(
                          (commentsObject, commentAstmMessage) => {
                            const comment = {
                              value: commentAstmMessage.rawMessage,
                              ...parseRecordForFields(
                                commentAstmMessage.rawMessage
                              ),
                            }
                            const commentRecordId = `${comment['1']}${
                              comment['2']
                            }`
                            commentsObject[commentRecordId] = comment
                            commentsObject.comments = [
                              ...(commentsObject.comments || []),
                              commentRecordId,
                            ]
                            return commentsObject
                          },
                          {}
                        ),
                      }
                      const resultRecordId = `${result['1']}${result['2']}`
                      resultsObject[resultRecordId] = result
                      resultsObject.results = [
                        ...(resultsObject.results || []),
                        resultRecordId,
                      ]
                      return resultsObject
                    },
                    {}
                  ),
                  ...orderAstmMessage.comments.reduce(
                    (commentsObject, commentAstmMessage) => {
                      const comment = {
                        value: commentAstmMessage.rawMessage,
                        ...parseRecordForFields(commentAstmMessage.rawMessage),
                      }
                      const commentRecordId = `${comment['1']}${comment['2']}`
                      commentsObject[commentRecordId] = comment
                      commentsObject.comments = [
                        ...(commentsObject.comments || []),
                        commentRecordId,
                      ]
                      return commentsObject
                    },
                    {}
                  ),
                }
                const orderRecordId = `${order['1']}${order['2']}`
                ordersObject[orderRecordId] = order
                ordersObject.orders = [
                  ...(ordersObject.orders || []),
                  orderRecordId,
                ]
                return ordersObject
              },
              {}
            ),
            ...patientAstmMessage.comments.reduce(
              (commentsObject, commentAstmMessage) => {
                const comment = {
                  value: commentAstmMessage.rawMessage,
                  ...parseRecordForFields(commentAstmMessage.rawMessage),
                }
                const commentRecordId = `${comment['1']}${comment['2']}`
                commentsObject[commentRecordId] = comment
                commentsObject.comments = [
                  ...(commentsObject.comments || []),
                  commentRecordId,
                ]
                return commentsObject
              },
              {}
            ),
          }
          const patientRecordId = `${patient['1']}${patient['2']}`
          patientsObject[patientRecordId] = patient
          patientsObject.patients = [
            ...(patientsObject.patients || []),
            patientRecordId,
          ]
          return patientsObject
        }, {}),
        ...astmMessage.enquiries.reduce(
          (enquiriesObject, enquiryAstmMessage) => {
            const enquiry = {
              value: enquiryAstmMessage.rawMessage,
              ...parseRecordForFields(enquiryAstmMessage.rawMessage),
            }
            const enquiryRecordId = `${enquiry['1']}${enquiry['2']}`
            enquiriesObject[enquiryRecordId] = enquiry
            enquiriesObject.enquiries = [
              ...(enquiriesObject.enquiries || []),
              enquiryRecordId,
            ]
            return enquiriesObject
          },
          {}
        ),
        ...astmMessage.comments.reduce((commentsObject, commentAstmMessage) => {
          const comment = {
            value: commentAstmMessage.rawMessage,
            ...parseRecordForFields(commentAstmMessage.rawMessage),
          }
          const commentRecordId = `${comment['1']}${comment['2']}`
          commentsObject[commentRecordId] = comment
          commentsObject.comments = [
            ...(commentsObject.comments || []),
            commentRecordId,
          ]
          return commentsObject
        }, {}),
      }
    })
}

module.exports = {
  getAstmField,
  locateAstmE1394Value,
  getNumberOfAstmE1394Children,
  structureAstmE1394,
}
