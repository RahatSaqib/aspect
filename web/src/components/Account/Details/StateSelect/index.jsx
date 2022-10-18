import React, { useState, useEffect } from 'react'
import { useFormikContext } from 'formik'
import filter from 'lodash/filter'
import map from 'lodash/map'
import { useQuery } from 'react-query'
import { PureSelect } from '../../../Form/PureFormik/Inputs'
import fetchWrapperForQueries from '../../../QueryFetch'

const StateSelect = props => {
  const [country, setCountry] = useState()
  const { inputProps } = props
  const { values } = useFormikContext()
  const STATES_LIST = {
    KEY: 'states-select-list',
  }

  useEffect(() => {
    const { countryId } = values
    if (country !== countryId) {
      setCountry(countryId)
    }
  }, [values, country])

  const {
    isError,
    data: statesData,
    error,
  } = useQuery(
    [STATES_LIST.KEY, country],
    async () => {
      const { data: countries } = await fetchWrapperForQueries({
        endpoint: `/geography/country-select-list/${country}`,
      })
      const { states } = filter(countries, { id: country })[0] || false
      const out = map(states, ({ name, id }) => ({ label: name, value: id }))
      return out
    },
    { enabled: !!country }
  )

  if (isError) {
    throw new Error(error)
  }

  inputProps.options = statesData

  return <PureSelect {...props} />
}

export default StateSelect
