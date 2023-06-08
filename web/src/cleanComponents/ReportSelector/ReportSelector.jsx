import React, { useState } from 'react'
import { Autocomplete, TextField, LinearProgress } from '@mui/material'
import useReport from '../../hooks/report/useReport'

const ReportSelector = ({ label, value, onChange }) => {
  const [selectedValue, setSelectedValue] = useState(value === '' ? undefined : value)

  const { isLoading, data: reportData } = useReport()

  const onSelect = (_, value) => {
    setSelectedValue(value)
    onChange(value)
  }

  return isLoading ? (
    <LinearProgress />
  ) : (
    <Autocomplete
      isOptionEqualToValue={(o, val) => o.name === val.name}
      getOptionLabel={option => option.name ?? option}
      disableClearable
      filterOptions={(options, state) =>
        options.filter(o => o.name.toLowerCase().includes(state.inputValue.toLowerCase()))
      }
      value={selectedValue || null}
      loading={isLoading}
      fullWidth
      options={reportData || []}
      onChange={onSelect}
      renderInput={params => (
        <TextField {...params} fullWidth label={label} InputLabelProps={{ shrink: true }} variant="standard" />
      )}
    />
  )
}

export default ReportSelector
