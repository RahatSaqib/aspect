import React, { useState, useRef, useEffect } from 'react'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'
import { TreeItem, TreeView } from '@mui/lab'
import { TextField, Box, ClickAwayListener, Grow, Paper, Popper, Typography } from '@mui/material'
import { DesktopDatePicker } from '@mui/x-date-pickers'
import useI18n from '../../hooks/useI18n'
import messages from './messages'
import { dayOptions, weekOptions, monthOptions, quarterOptions, yearOptions, customFormat } from './periodOptions'

function PeriodSelector({ minDate, maxDate, onChange, label }) {
  const intl = useI18n()
  const { formatMessage } = intl
  const day = dayOptions(intl)
  const week = weekOptions(intl)
  const month = monthOptions(intl)
  const quarter = quarterOptions(intl)
  const year = yearOptions(intl)

  const [open, setOpen] = useState(false)
  const [range, setRange] = useState({ minDate, maxDate })
  const [valueLabel, setValueLabel] = useState(
    minDate && maxDate
      ? [...day, ...week, ...month, ...quarter, ...year].find(
          o => o.value.minDate.getTime() === minDate.getTime() && o.value.maxDate.getTime() === maxDate.getTime()
        ).label
      : formatMessage(messages.any)
  )
  const anchorRef = useRef(null)

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleClose = event => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return
    }

    setOpen(false)
  }

  function handleListKeyDown(event) {
    if (event.key === 'Tab') {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const prevOpen = useRef(open)

  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus()
    }

    prevOpen.current = open
  }, [open])

  return (
    <div>
      <TextField variant="standard" ref={anchorRef} label={label} onClick={handleToggle} value={valueLabel} />
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="bottom-start"
        transition
        disablePortal
        sx={{ width: '25%', zIndex: 10, flexGrow: 1, overflowY: 'auto', maxHeight: '477px' }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <TreeView
                  defaultCollapseIcon={<ArrowDropDownIcon />}
                  defaultExpandIcon={<ArrowRightIcon />}
                  defaultEndIcon={<div style={{ width: 24 }} />}
                  onKeyDown={handleListKeyDown}
                >
                  <TreeItem label={<TreeLabel label={formatMessage(messages.any)} />} nodeId="1" />
                  <TreeItem label={<TreeLabel label={formatMessage(messages.day)} />} nodeId="2">
                    {day.map(option => (
                      <TreeItem
                        label={<TreeLabel label={option.label} />}
                        nodeId={`${option.id}`}
                        key={`${option.id}`}
                        onClick={() => {
                          setValueLabel(option.label)
                          onChange(option.value)
                          handleToggle()
                        }}
                      />
                    ))}
                  </TreeItem>
                  <TreeItem label={<TreeLabel label={formatMessage(messages.week)} />} nodeId="3">
                    {week.map(option => (
                      <TreeItem
                        label={<TreeLabel label={option.label} />}
                        nodeId={`${option.id}`}
                        key={`${option.id}`}
                        onClick={() => {
                          setValueLabel(option.label)
                          onChange(option.value)
                          handleToggle()
                        }}
                      />
                    ))}
                  </TreeItem>
                  <TreeItem label={<TreeLabel label={formatMessage(messages.month)} />} nodeId="4">
                    {month.map(option => (
                      <TreeItem
                        label={<TreeLabel label={option.label} />}
                        nodeId={`${option.id}`}
                        key={`${option.id}`}
                        onClick={() => {
                          setValueLabel(option.label)
                          onChange(option.value)
                          handleToggle()
                        }}
                      />
                    ))}
                  </TreeItem>
                  <TreeItem label={<TreeLabel label={formatMessage(messages.quarter)} />} nodeId="5">
                    {quarter.map(option => (
                      <TreeItem
                        label={<TreeLabel label={option.label} />}
                        nodeId={`${option.id}`}
                        key={`${option.id}`}
                        onClick={() => {
                          setValueLabel(option.label)
                          onChange(option.value)
                          handleToggle()
                        }}
                      />
                    ))}
                  </TreeItem>
                  <TreeItem label={<TreeLabel label={formatMessage(messages.year)} />} nodeId="6">
                    {year.map(option => (
                      <TreeItem
                        label={<TreeLabel label={option.label} />}
                        nodeId={`${option.id}`}
                        key={`${option.id}`}
                        onClick={() => {
                          setValueLabel(option.label)
                          onChange(option.value)
                          handleToggle()
                        }}
                      />
                    ))}
                  </TreeItem>
                  <TreeItem label={<TreeLabel label={formatMessage(messages.custom)} />} nodeId="7">
                    <TreeItem
                      label={
                        <div style={{ width: '95%' }}>
                          <DesktopDatePicker
                            label={formatMessage(messages.fromDate)}
                            value={range.minDate || null}
                            onChange={minDate => {
                              if (range.maxDate !== null) {
                                setValueLabel(customFormat(minDate, range.maxDate))
                                setRange({ ...range, minDate })
                                onChange({ minDate: minDate.toISOString(), maxDate: range.maxDate.toISOString() })
                                handleToggle()
                              } else {
                                setRange({ ...range, minDate })
                              }
                            }}
                            renderInput={params => <TextField {...params} />}
                          />
                        </div>
                      }
                      nodeId="71"
                    />
                    <TreeItem
                      label={
                        <div style={{ width: '95%' }}>
                          <DesktopDatePicker
                            label={formatMessage(messages.toDate)}
                            value={range.maxDate}
                            minDate={range.minDate}
                            onChange={maxDate => {
                              if (range.minDate !== null) {
                                setValueLabel(customFormat(range.minDate, maxDate))
                                setRange({ ...range, maxDate })
                                onChange({ minDate: range.minDate.toISOString(), maxDate: maxDate.toISOString() })
                                handleToggle()
                              } else {
                                setRange({ ...range, maxDate })
                              }
                            }}
                            renderInput={params => <TextField {...params} />}
                          />
                        </div>
                      }
                      nodeId="72"
                    />
                  </TreeItem>
                </TreeView>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  )
}

export default PeriodSelector

const TreeLabel = ({ label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
    <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
      {label}
    </Typography>
  </Box>
)
