const toAssayIds = value => {
  if (value == null || value === '') return null
  if (Array.isArray(value)) {
    const ids = value
      .map(item => (item && typeof item === 'object' ? item.id : item))
      .map(Number)
      .filter(n => !Number.isNaN(n))
    return ids.length ? ids : null
  }
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

/** Coerce wire values to what the API params validator expects (numbers / id arrays). */
export const normalizeParameterValues = (parameters, values) => {
  const next = { ...values }
  ;(parameters || []).forEach(def => {
    if (def.type !== 'assay' || !(def.name in next)) return
    const raw = next[def.name]
    if (def.multiple) {
      const normalized = toAssayIds(raw)
      if (normalized == null) delete next[def.name]
      else next[def.name] = normalized
      return
    }
    if (raw == null || raw === '') {
      delete next[def.name]
      return
    }
    if (Array.isArray(raw)) {
      const [first] = toAssayIds(raw) || []
      if (first == null) delete next[def.name]
      else next[def.name] = first
      return
    }
    const n = Number(typeof raw === 'object' ? raw.id : raw)
    if (Number.isNaN(n)) delete next[def.name]
    else next[def.name] = n
  })
  // Drop cleared optional params (e.g. stateId: null after Clear) so query strings
  // never send encodeURIComponent(null) → "null", which fails Joi.number().
  Object.keys(next).forEach(key => {
    const value = next[key]
    if (value === undefined || value === null || value === '') delete next[key]
  })
  return next
}
