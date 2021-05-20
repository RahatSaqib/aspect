const encodeQueryFromObject = obj => {
  let encodedQuery = ''
  Object.keys(obj || {}).forEach(oKey => {
    encodedQuery += `${oKey}=${obj[oKey]}&`
  })
  return encodeURIComponent(encodedQuery)
}

const buildLink = (baseUrl, params = {}) => {
  let urlQuery = ''
  Object.keys(params).forEach(pKey => {
    let pValue
    if (typeof params[pKey] === 'object') {
      pValue = `${pKey}=${encodeQueryFromObject(params[pKey])}&`
    } else
      pValue = `${encodeURIComponent(`${pKey}=${params[pKey]}`)}&`
    urlQuery += pValue
  })
  urlQuery = `${baseUrl}?${urlQuery}`
  return urlQuery
}

export {
  buildLink
}