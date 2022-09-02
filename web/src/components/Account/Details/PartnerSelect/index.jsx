import React, { useEffect, useState } from 'react'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import set from 'lodash/set'
import { useQuery } from 'react-query'
import { PureSelect } from '../../../Form/PureFormik/Inputs'
import fetchWrapperForQueries from '../../../QueryFetch'

const PartnerSelect = props => {
  const PARTNER_LIST = {
    KEY: 'partner-select-list',
    ENDPOINT: '/job-function/select-list',
  }
  const [newProps, setNewProps] = useState(props)
  const { inputProps, form } = newProps
  const {
    isError,
    isLoading,
    data: partnersData,
    error,
  } = useQuery(PARTNER_LIST.KEY, async () => {
    const res = await fetchWrapperForQueries({
      endpoint: PARTNER_LIST.ENDPOINT,
    })
    return map(res?.data, ({ name, id }) => ({
      label: name,
      value: id,
    }))
  })

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    if (!isLoading && partnersData) {
      const { length } = partnersData
      const { id } = inputProps
      if (length > 0) {
        set(newProps, 'inputProps', {
          options: partnersData,
          initialValue: partnersData[0]?.value,
        })
        set(newProps, 'form.values', {
          ...form.values,
          [id]: partnersData[0]?.value,
        })
        if (length === 1) {
          set(newProps, 'inputProps.disabled', true)
          form.setFieldValue(id, partnersData[0]?.value)
        }
      }
      if (!isEqual(props, newProps)) {
        setNewProps(newProps)
      }
    }
  }, [partnersData, props, newProps, inputProps, form, isLoading])

  return !isLoading ? (
    <div style={inputProps?.disabled ? { display: 'none' } : {}}>
      <PureSelect {...newProps} />
    </div>
  ) : null
}

export default PartnerSelect
