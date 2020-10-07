const _ = require('lodash')

const getValue = (widget, field) => _.get(widget, field)

const setAlertValueOnWidget = widget => {
  const { alert } = _.get(widget, 'options.extraFields')

  if (!alert) return

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
  let display = false
  switch (alert.whenIs) {
    case 'greaterThan':
      display = dependencyValue > comparedTo
      break
    case 'lessThan':
      display = dependencyValue < comparedTo
      break
    case 'between':
      display =
        dependencyValue > alert.comparedTo[0] &&
        dependencyValue < alert.comparedTo[1]
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
