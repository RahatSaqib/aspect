import React, { useState, useEffect } from 'react'
import { FormControl, MenuItem, InputLabel, Select } from '@mui/material'
import { useQuery } from 'react-query'
import { Loading } from '..'
import fetchWrapperForQueries from '../../components/QueryFetch'
import useI18n from '../../hooks/useI18n'
import { consumableMessages } from '../../messages'

const ConsumableSelector = ({ onChange }) => {
  const [innerValue, setInnerValue] = useState('')
  const [options, setOptions] = useState([])
  const { isLoading, data } = useQuery('data.inventoryConsumableSummaryList', async () =>
    fetchWrapperForQueries({ endpoint: '/dashboard/inventory-item' })
  )
  const { formatMessage } = useI18n()
  useEffect(() => {
    if (data) {
      const opt = data.data.inventoryConsumableSummaryList.sort((a, b) =>
        `${a.consumableName}`.localeCompare(b.consumableName)
      )
      setOptions(opt)
      setInnerValue(opt[0]?.consumableExternalId)
      onChange({ consumableExternalId: opt[0]?.consumableExternalId, consumableId: opt[0]?.consumableId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return isLoading ? (
    <Loading />
  ) : (
    <FormControl sx={{ width: '100%' }} variant="standard" size="small">
      <InputLabel id="select-consumable">{formatMessage(consumableMessages.consumable)}</InputLabel>
      <Select
        labelId="select-consumable"
        value={innerValue}
        onChange={e => {
          setInnerValue(e.target.value)
          const selection = options.filter(o => o.consumableExternalId === e.target.value)[0]
          onChange({
            consumableExternalId: selection.consumableExternalId,
            consumableId: selection.consumableId,
          })
        }}
      >
        {options.map(o => (
          <MenuItem key={o.consumableExternalId} value={o.consumableExternalId}>
            {o.consumableName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default ConsumableSelector
