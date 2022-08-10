import React from 'react'
import { useQuery } from 'react-query'
import map from 'lodash/map'
import fetchWrapperForQueries from '../../../QueryFetch'
import { PureSelect } from '../../../Form/PureFormik/Inputs'

const CountrySelect = props => {
  const COUNTRIES_LIST = {
    KEY: 'country-select-list',
    ENDPOINT: '/geography/country-select-list',
  }
  const { inputProps } = props
  const {
    isError,
    data: countriesData,
    error,
  } = useQuery(COUNTRIES_LIST.KEY, async () => {
    const res = await fetchWrapperForQueries({
      endpoint: COUNTRIES_LIST.ENDPOINT,
    })
    return map(res?.data, ({ name, id }) => ({ label: name, value: id }))
  })

  if (isError) {
    throw new Error(error)
  }

  inputProps.options = countriesData

  return <PureSelect {...props} />
}

CountrySelect.whyDidYouRender = false
export default CountrySelect
