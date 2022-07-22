import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Autocomplete, TextField } from '@material-ui/core'
import { useQuery } from 'react-query'
import { defineMessages } from 'react-intl'
import fetchWrapperForQueries from '../QueryFetch'
import { REPORT_SELECT_LIST } from '../QueryFetch/Report/index'
import useI18n from '../../Hooks/i18n/useI18n'

const messages = {
  ...defineMessages({
    reportName: {
      id: 'filter.popover.reportName',
      defaultMessage: 'Report',
    },
    enterReportName: {
      id: 'filter.popover.enterReportName',
      defaultMessage: 'Enter report name...',
    },
  }),
}

const ReportAutoCompleteField = ({ name, value, onChange }) => {
  const { formatMessage } = useI18n()
  const [selectedValue, setSelectedValue] = useState(value === '' ? undefined : value)
  const { isLoading, data: { data: reportData } = false } = useQuery([REPORT_SELECT_LIST.KEY], async () =>
    fetchWrapperForQueries({ endpoint: REPORT_SELECT_LIST.ENDPOINT })
  )

  const onSelect = (_, value) => {
    setSelectedValue(value)
    onChange(value)
  }

  return reportData ? (
    <Autocomplete
      name={name}
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
        <TextField
          {...params}
          label={formatMessage(messages.reportName)}
          placeholder={formatMessage(messages.enterReportName)}
          InputLabelProps={{ shrink: true }}
          variant="standard"
          style={{ width: 250 }}
        />
      )}
    />
  ) : null
}

export default ReportAutoCompleteField

ReportAutoCompleteField.defaultProps = {
  name: undefined,
  value: undefined,
  onChange: () => {},
}
ReportAutoCompleteField.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
}
