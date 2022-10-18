const _ = require('lodash')

const getRawValue = value => {
  // If value is a string and represents a percentage, then return only the number
  if (typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value)) return parseInt(value.replace('%', ''), 10)

  return value
}

const getValue = (widget, field) => _.get(widget, field)

const setAlertValueOnWidget = widget => {
  const alert = _.get(widget, 'options.extraFields.alert')

  if (!alert) return

  // As 'dependsOn' is always a field, we get the raw value of it
  const dependencyValue = getRawValue(getValue(widget, alert.dependsOn))

  let comparedTo = null
  // If 'comparedTo' is a string, at first we assume it represents a field
  if (typeof alert.comparedTo === 'string') alert.comparedTo = getValue(widget, alert.comparedTo) || alert.comparedTo

  comparedTo = getRawValue(alert.comparedTo)

  // Depending the action to take, we make a different comparation and get the value of the alert
  let display = false
  switch (alert.whenIs) {
    case 'greaterThan':
      display = dependencyValue > comparedTo
      break
    case 'lessThan':
      display = dependencyValue < comparedTo
      break
    case 'between':
      display = dependencyValue > alert.comparedTo[0] && dependencyValue < alert.comparedTo[1]
      break
    case 'containedIn':
      display = _.includes(alert.comparedTo, dependencyValue)
      break
    default:
      display = false
  }

  // Sets the alert into the widget
  widget.alert = { config: alert, display }
}

const optionsByFunc = {
  alert: setAlertValueOnWidget,
}

const addExtraData = widget => {
  if (_.get(widget, 'options.extraFields')) {
    _.keys(widget.options.extraFields).forEach(k => {
      const func = _.get(optionsByFunc, k)
      func(widget)
    })
  }
}

module.exports = { addExtraData }
