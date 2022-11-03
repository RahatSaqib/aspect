import cronstrue from 'cronstrue'
import isEmpty from 'lodash/isEmpty'

const getCronHumanValue = (cronExpression, locale) => {
  try {
    if (!isEmpty(cronExpression)) {
      const val = cronstrue.toString(cronExpression.toString().replace(/,/g, ' ').replace(/!/g, ','), { locale })
      if (val.search('undefined') === -1) {
        return val
      }
    }

    return '-'
  } catch (ex) {
    const days = cronExpression.split(' ')[5]

    return `${cronstrue.toString(cronExpression.replace(days, '*').toString().replace(/,/g, ' ').replace(/!/g, ','), {
      locale,
    })} ${days}`
  }
}

export { getCronHumanValue }
