const GENEXPERT_DEVICE_TYPE_EXTERNAL_ID = 'CepheidGeneXpert'

function positiveInt(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Builds the GeneXpert module suffix for Bangladesh device names.
 *
 * Examples:
 *   - capacity 4, 4x 6c only        -> "(4m 6c)"
 *   - capacity 16, 4x 6c + 12x 10c    -> "(16m, 4x6c, 12x10c)"
 *   - no capacity, 4x 6c only         -> "(4x6c)"
 *   - capacity 16 only                -> "(16m)"
 *
 * Empty, null, and zero values are omitted. When no field has a positive
 * value the suffix is an empty string.
 */
function buildGeneXpertModuleSuffix({ moduleBayCapacity, gx6cModulesCount, gx10cModulesCount }) {
  const capacity = positiveInt(moduleBayCapacity)
  const count6c = positiveInt(gx6cModulesCount)
  const count10c = positiveInt(gx10cModulesCount)

  if (!capacity && !count6c && !count10c) {
    return ''
  }

  const has6c = count6c != null
  const has10c = count10c != null
  const hasMultipleModuleTypes = has6c && has10c
  const parts = []

  if (capacity) {
    parts.push(`${capacity}m`)
  }

  if (hasMultipleModuleTypes) {
    if (count6c) {
      parts.push(`${count6c}x6c`)
    }
    if (count10c) {
      parts.push(`${count10c}x10c`)
    }
  } else if (has6c) {
    parts.push(capacity ? '6c' : `${count6c}x6c`)
  } else if (has10c) {
    parts.push(capacity ? '10c' : `${count10c}x10c`)
  }

  if (!parts.length) {
    return ''
  }

  if (capacity && !hasMultipleModuleTypes && (has6c || has10c)) {
    return `(${parts.join(' ')})`
  }

  return `(${parts.join(', ')})`
}

module.exports = {
  GENEXPERT_DEVICE_TYPE_EXTERNAL_ID,
  buildGeneXpertModuleSuffix,
}
