import { defineMessages } from 'react-intl'

const messagesByOperators = defineMessages({
  greaterThan: {
    id: 'widgetAlerts.greaterThan',
    defaultMessage: 'The {representing} is greater than {comparedTo}',
  },
  lessThan: {
    id: 'widgetAlerts.lessThan',
    defaultMessage: 'The {representing} is greater than {comparedTo}',
  },
  between: {
    id: 'widgetAlerts.between',
    defaultMessage:
      'The {representing} is between {comparedToFrom} and {comparedToTo}',
  },
  containedIn: {
    id: 'widgetAlerts.containerIn',
    defaultMessage: 'The {representing} is one of {comparedTo}',
  },
})

const valueRepresentations = defineMessages({})

const format = (
  formatFunc,
  { whenIs, representing: representingKey, comparedTo }
) => {
  let comparationStrings

  switch (whenIs) {
    case 'between':
      comparationStrings = {
        comparedToFrom: comparedTo[0],
        comparedToTo: comparedTo[1],
      }
      break
    case 'containedIn':
      comparationStrings = {
        comparedTo: comparedTo.join(', '),
      }
      break
    default:
      comparationStrings = { comparedTo }
      break
  }

  const representing = formatFunc(valueRepresentations[representingKey])

  return formatFunc(messagesByOperators[whenIs], {
    representing,
    ...comparationStrings,
  })
}

export default format
