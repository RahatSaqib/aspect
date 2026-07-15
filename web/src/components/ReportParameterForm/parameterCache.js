import pick from 'lodash/pick'

// Parameter types whose values users expect to carry from one report dialog to the
// next ("set geography once, run many"). Everything else is report-local: the same
// wire key can mean different things per report (e.g. a report without results hides
// decommissioned devices while another shows them), so those values never travel
// between reports — each report keeps its own default or its own last-used value.
const SHARED_PARAMETER_TYPES = ['state', 'lga', 'site', 'assay', 'consumable', 'dateRange']

export const isSharedParameter = def => SHARED_PARAMETER_TYPES.includes(def.type)

// dateRange is virtual: it reads/writes the minDate/maxDate wire keys
export const sharedWireKeys = parameters =>
  parameters
    .filter(isSharedParameter)
    .reduce((keys, def) => (def.type === 'dateRange' ? [...keys, 'minDate', 'maxDate'] : [...keys, def.name]), [])

// Subset of `values` a report shares across reports. Used on BOTH ends of the
// cross-report cache: with the submitting report's parameters to decide what gets
// published, and with the target report's parameters to decide what gets picked.
export const pickSharedValues = (parameters, values) => pick(values || {}, sharedWireKeys(parameters))
