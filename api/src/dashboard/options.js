const _ = require('lodash')

// /**
//  * Receiving a widget and a value/field to search on it, this function will return the value of the field if exists. If it doesn't, will return the value itself.
//  * For example, if the valueField provided is 'count', the field with that name will be searched in the widget. If the field exist, the value assigned to it will be returned. If not, 'count' is returned as the value.
//  * @param {object} widget widget where the field will be searched.
//  * @param {any} n The power, must be a natural number.
//  * @return {number} x raised to the n-th power.
//  */
const getValue = (widget, valueField) => _.get(widget, valueField)

const getAlertValue = widget => {
  const { alert } = widget.options.extraFields

  // As 'dependsOn' is always a field, we get the value of it
  const dependencyValue = getValue(widget, alert.dependsOn)

  let comparedTo = null
  // If 'comparedTo' is a string, at first we assume it represents a field
  if (typeof alert.comparedTo === 'string')
    comparedTo = getValue(widget, alert.comparedTo)
  // If 'comparedTo' is still null, it's because it's not a field - it's a value
  if (comparedTo === null) comparedTo = alert.comparedTo

  alert.comparedTo = comparedTo

  // Depending the action to take, we make a different comparation and get the value of the alert
  let value = false
  switch (alert.whenIs) {
    case 'greaterThan':
      value = dependencyValue > comparedTo
      break
    case 'lessThan':
      value = dependencyValue < comparedTo
      break
    case 'between':
      value =
        dependencyValue > alert.comparedTo[0] &&
        dependencyValue < alert.comparedTo[1]
      break
    case 'containedIn':
      value = _.includes(alert.comparedTo, dependencyValue)
      break
    default:
      value = false
  }

  widget.alert = { config: alert, value }
}

const optionsByFunc = {
  alert: getAlertValue,
}

const addExtraData = widget => {
  if (widget.options && widget.options.extraFields) {
    _.keys(widget.options.extraFields).forEach(k => {
      const func = _.get(optionsByFunc, k)
      func(widget)
    })
  }
}

module.exports = { addExtraData }
