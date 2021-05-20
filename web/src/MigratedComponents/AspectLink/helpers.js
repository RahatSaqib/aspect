const buildLink = (baseUrl, params = {}) => {
  let urlQuery = ''
  Object.keys(params).forEach(pKey => {
    const pValue = params[pKey]
    urlQuery += `${pKey}=${pValue}&`
  })
  urlQuery = `${baseUrl}?${urlQuery.slice(0, -1)}`
  return urlQuery
}

export {
  buildLink
}