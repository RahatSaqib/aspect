import React, { useState, useEffect } from 'react'
import { Checkbox, FormControlLabel, Stack, Typography, Divider } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import FormGroup from '@mui/material/FormGroup'
import { useIntl } from 'react-intl'
import messages from '../../messages/allMessages'
import Summary from '../Summary'

const CheckBoxList = ({ selectedList = [], disabledList = [], isChanging, onSelect, isLoading, listData = [] }) => {
  const [selectAll, setSelectAll] = useState(false)
  const { formatMessage } = useIntl()

  useEffect(() => {
    setSelectAll(selectedList.length === listData.length && listData.length > 0)
  }, [selectedList, listData.length])

  const handleSelect = e => {
    const { checked } = e.target
    setSelectAll(checked)
    onSelect(checked)
  }

  return (
    <Summary
      title={
        <Stack
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {isChanging ? <CircularProgress size={15} /> : null}
        </Stack>
      }
      description={
        <>
          {isLoading ? (
            <Stack
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={15} />
              <Typography>Loading</Typography>
            </Stack>
          ) : (
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectAll}
                    indeterminate={selectedList.length > 0 && selectedList.length < listData.length}
                    onChange={handleSelect}
                    disabled={isChanging}
                  />
                }
                label={formatMessage(messages.selectAllUnselectAll)}
              />
              <Divider sx={{ marginY: 2 }} />
              {listData.map(({ name, id }) => (
                <FormControlLabel
                  id={id}
                  label={name}
                  key={id}
                  control={
                    <Checkbox
                      disabled={isChanging || disabledList.includes(id)}
                      checked={selectedList.includes(id) || disabledList.includes(id)}
                      onChange={e => onSelect(e.target.checked, id)}
                    />
                  }
                />
              ))}
            </FormGroup>
          )}
        </>
      }
      cols="1"
    />
  )
}

export default CheckBoxList
