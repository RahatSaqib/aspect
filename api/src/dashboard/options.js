const _ = require('lodash')

const getValue = (widget, field) => _.get(widget, field)

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

  // Sets the alert into the widget
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
