import React, { useState, useEffect } from 'react'
import { useFormikContext } from 'formik'
import { useQuery } from 'react-query'
import filter from 'lodash/filter'
import map from 'lodash/map'
import fetchWrapperForQueries from '../../../QueryFetch'
import { PureSelect } from '../../../Form/PureFormik/Inputs'

const LGASelect = props => {
  const [country, setCountry] = useState()
  const [state, setState] = useState()
  const { inputProps } = props
  const { values } = useFormikContext()
  const COUNTY_SELECT = {
    KEY: 'county-select-list',
  }

  useEffect(() => {
    const { countryId, stateId } = values
    if (country !== countryId) {
      setCountry(countryId)
    }
    if (state !== stateId) {
      setState(stateId)
    }
  }, [values, state, country])

  const {
    isError,
    data: countiesData,
    error,
  } = useQuery(
    [COUNTY_SELECT.KEY, state],
    async () => {
      const { data: countries } = await fetchWrapperForQueries({
        endpoint: `/geography/country-select-list/${country}/${state}`,
      })
      const { lgas } = filter(countries[0].states, { id: state })[0] || false
      return map(lgas, ({ name, id }) => ({ label: name, value: id }))
    },
    { enabled: !!country && !!state }
  )

  if (isError) {
    throw new Error(error)
  }

  inputProps.options = countiesData

  return <PureSelect {...props} />
}

export default LGASelect
