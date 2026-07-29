import pick from 'lodash/pick'

// Whether a value carries from one report dialog to the next ("set geography once,
// run many") is decided by the server: it derives `shared` on every definition from
// SHARED_PARAMETER_TYPES in api/src/report/params.js. Defs from an API that does not
// send the flag yet degrade to nothing shared — each report keeps its own values.
export const isSharedParameter = def => Boolean(def.shared)

// dateRange is virtual: it reads/writes the minDate/maxDate wire keys
export const sharedWireKeys = parameters =>
  parameters
    .filter(isSharedParameter)
    .reduce((keys, def) => (def.type === 'dateRange' ? [...keys, 'minDate', 'maxDate'] : [...keys, def.name]), [])

// Subset of `values` a report shares across reports. Used on BOTH ends of the
// cross-report cache: with the submitting report's parameters to decide what gets
// published, and with the target report's parameters to decide what gets picked.
export const pickSharedValues = (parameters, values) => pick(values || {}, sharedWireKeys(parameters))
