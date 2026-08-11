/**
 * Browser replacement for node's `querystring.stringify`, which is not available outside node.
 * Node's semantics are kept on purpose so the query strings sent to the API do not change:
 * `undefined` and `null` serialise to an empty value (`sortCol=`) rather than the literal
 * strings "undefined"/"null", and arrays repeat the key (`status=1&status=2`).
 */
export default function stringifyQuery(params = {}) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => search.append(key, item === undefined || item === null ? '' : item))
      return
    }
    search.append(key, value === undefined || value === null ? '' : value)
  })

  return search.toString()
}
