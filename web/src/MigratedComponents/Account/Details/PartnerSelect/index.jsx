import React from 'react'
import { useQuery } from 'react-query'
import map from 'lodash/map'
import fetchWrapperForQueries from '../../../QueryFetch'
import { PureSelect } from '../../../Form/PureFormik/Inputs'

const PartnerSelect = props => {
  const PARTNER_LIST = {
    KEY: 'partner-select-list',
    ENDPOINT: '/job-function/select-list',
  }
  const { inputProps } = props
  const {
    isError,
    data: partnersData,
    error,
  } = useQuery(PARTNER_LIST.KEY, async () => {
    const res = await fetchWrapperForQueries({
      endpoint: PARTNER_LIST.ENDPOINT,
    })
    return map(res?.data, ({ name, id }) => ({ label: name, value: id }))
  })

  if (isError) {
    throw new Error(error)
  }

  inputProps.options = partnersData

  return <PureSelect {...props} />
}

export default PartnerSelect
