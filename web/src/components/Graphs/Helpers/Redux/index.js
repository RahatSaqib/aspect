import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'

const onRequested = (action, mutState, cb) => {
  if (mutState.hasIn(['requestedAtSet', action.requestedAt])) {
    mutState.set('requestedAtSet', mutState.requestedAtSet.delete(action.requestedAt))
    if (cb) cb()
  }
}

const removeEmptyParams = params => {
  Object.keys(params).forEach(key => isEmpty(params[key]) && delete params[key])
  return params
}

const sanitiseParams = params =>
  omit(params, [
    'averages',
    'dataKey',
    'endpoint',
    'component',
    'componentClass',
    'displayMethod',
    'keyToConsume',
    'indexBy',
    'filter',
    'legend',
    'formatDate',
    'parentId',
    'id',
    'api',
  ])

export { onRequested, removeEmptyParams, sanitiseParams }
