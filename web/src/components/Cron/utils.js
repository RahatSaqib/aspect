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
    console.log('🚀 ~ file: utils.js ~ line 16 ~ getCronHumanValue ~ cronExpression', cronExpression)
    const days = cronExpression[4]

    return `${cronstrue.toString(cronExpression.toString().replace(days, '*').replace(/,/g, ' ').replace(/!/g, ','), {
      locale,
    })} ${days}`
  }
}

export { getCronHumanValue }
