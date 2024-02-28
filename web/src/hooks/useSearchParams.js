import { useMemo } from 'react'

const useSearchParams = (locationSearch, baseBackUrl) => {
  const callerSearchParams = useMemo(() => {
    const callerSearchParams = new URLSearchParams(locationSearch).toString()
    if (callerSearchParams) {
      const searchParamsToReturn = new URLSearchParams()
      searchParamsToReturn.set('searchParams', callerSearchParams)
      return `?${searchParamsToReturn.toString()}`
    }
    return ''
  }, [locationSearch])

  const backUrl = useMemo(() => {
    const searchParams = new URLSearchParams(locationSearch).get('searchParams')
    let url = baseBackUrl
    if (searchParams) {
      url += `?${searchParams}`
    }
    return url
  }, [locationSearch, baseBackUrl])

  return { callerSearchParams, backUrl }
}

export default useSearchParams
