import map from 'lodash/map'

export function getInitialValues(rows, forceInitialValues) {
  const values = {}
  if (forceInitialValues || process.env.NODE_ENV === 'development') {
    map(rows, items => map(items, ({ id, initialValue }) => (values[id] = initialValue)))
  }
  return values
}

export function getInitialValueKeys(items) {
  const values = {}
  map(items, ({ id }) => (values[id] = ''))
  return values
}

export function getValidation(rows) {
  const output = {}
  map(rows, items => map(items, ({ id, validation }) => (output[id] = validation)))
  return output
}
