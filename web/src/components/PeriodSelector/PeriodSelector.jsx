import React, { useState, useRef, useEffect } from 'react'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'
import { TreeItem, TreeView } from '@mui/lab'
import { TextField, Box, ClickAwayListener, Grow, Paper, Popper, Typography } from '@mui/material'
import { DesktopDatePicker } from '@mui/x-date-pickers'
import { useIntl } from 'react-intl'
import messages from '../../messages/allMessages'
import { getAspectDisplayPreferences } from '../LocalStorage'
import { dayOptions, weekOptions, monthOptions, quarterOptions, yearOptions, customYearOptions } from './periodOptions'

const { dayMonthFormat } = getAspectDisplayPreferences()

function PeriodSelector({
  minDate,
  maxDate,
  onChange,
  label,
  noAny,
  noDay,
  noWeek,
  noMonth,
  noQuarter,
  noYear,
  noCustom,
  customMaxYear,
}) {
  const intl = useIntl()
  const { formatMessage, format } = intl
  const day = dayOptions(intl)
  const week = weekOptions(intl)
  const month = monthOptions(intl)
  const quarter = quarterOptions(intl)
  const year = customMaxYear ? customYearOptions(intl, customMaxYear) : yearOptions(intl)

  const [open, setOpen] = useState(false)
  const [range, setRange] = useState({ minDate, maxDate })
  const [valueLabel, setValueLabel] = useState(
    minDate && maxDate
      ? [...day, ...week, ...month, ...quarter, ...year].find(
          o =>
            o.value.minDate.getTime() === new Date(minDate).getTime() &&
            o.value.maxDate.getTime() === new Date(maxDate).getTime()
        )?.label || customFormat(new Date(minDate), new Date(maxDate), format)
      : formatMessage(messages.any)
  )
  const anchorRef = useRef(null)

  const handleToggle = () => setOpen(prevOpen => !prevOpen)

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
        placement="bottom"
        popperOptions={{ placement: 'bottom', strategy: 'fixed', modifiers: [{ name: 'flip', enabled: false }] }}
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
                  {noAny ? null : (
                    <TreeItem
                      label={<TreeLabel label={formatMessage(messages.any)} />}
                      nodeId="any"
                      onClick={() => {
                        setValueLabel(formatMessage(messages.any))
                        onChange({ minDate: null, maxDate: null })
                        handleToggle()
                      }}
                    />
                  )}
                  {noDay ? null : (
                    <TreeItem label={<TreeLabel label={formatMessage(messages.day)} />} nodeId="day">
                      {day.map(option => (
                        <TreeItem
                          label={<TreeLabel label={option.label} />}
                          nodeId={`day-${option.id}`}
                          key={`day-${option.id}`}
                          onClick={() => {
                            setValueLabel(option.label)
                            onChange(option.value)
                            handleToggle()
                          }}
                        />
                      ))}
                    </TreeItem>
                  )}
                  {noWeek ? null : (
                    <TreeItem label={<TreeLabel label={formatMessage(messages.week)} />} nodeId="week">
                      {week.map(option => (
                        <TreeItem
                          label={<TreeLabel label={option.label} />}
                          nodeId={`week-${option.id}`}
                          key={`week-${option.id}`}
                          onClick={() => {
                            setValueLabel(option.label)
                            onChange(option.value)
                            handleToggle()
                          }}
                        />
                      ))}
                    </TreeItem>
                  )}
                  {noMonth ? null : (
                    <TreeItem label={<TreeLabel label={formatMessage(messages.month)} />} nodeId="month">
                      {month.map(option => (
                        <TreeItem
                          label={<TreeLabel label={option.label} />}
                          nodeId={`month-${option.id}`}
                          key={`month-${option.id}`}
                          onClick={() => {
                            setValueLabel(option.label)
                            onChange(option.value)
                            handleToggle()
                          }}
                        />
                      ))}
                    </TreeItem>
                  )}
                  {noQuarter ? null : (
                    <TreeItem label={<TreeLabel label={formatMessage(messages.quarter)} />} nodeId="quarter">
                      {quarter.map(option => (
                        <TreeItem
                          label={<TreeLabel label={option.label} />}
                          nodeId={`quarter-${option.id}`}
                          key={`quarter-${option.id}`}
                          onClick={() => {
                            setValueLabel(option.label)
                            onChange(option.value)
                            handleToggle()
                          }}
                        />
                      ))}
                    </TreeItem>
                  )}
                  {noYear ? null : (
                    <TreeItem label={<TreeLabel label={formatMessage(messages.year)} />} nodeId="year">
                      {year.map(option => (
                        <TreeItem
                          label={<TreeLabel label={option.label} />}
                          nodeId={`year-${option.id}`}
                          key={`year-${option.id}`}
                          onClick={() => {
                            setValueLabel(option.label)
                            onChange(option.value)
                            handleToggle()
                          }}
                        />
                      ))}
                    </TreeItem>
                  )}
                  {noCustom ? null : (
                    <TreeItem label={<TreeLabel label={formatMessage(messages.custom)} />} nodeId="custom">
                      <TreeItem
                        label={
                          <CustomMinDatePicker
                            formatMessage={formatMessage}
                            range={range}
                            setValueLabel={setValueLabel}
                            setRange={setRange}
                            onChange={onChange}
                            handleToggle={handleToggle}
                          />
                        }
                        nodeId="custom-start"
                      />
                      <TreeItem
                        label={
                          <CustomMaxDatePicker
                            formatMessage={formatMessage}
                            range={range}
                            setValueLabel={setValueLabel}
                            setRange={setRange}
                            onChange={onChange}
                            handleToggle={handleToggle}
                          />
                        }
                        nodeId="custom-end"
                      />
                    </TreeItem>
                  )}
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

export const customFormat = (start, end, format) => {
  return `${format(start, dayMonthFormat)} - ${format(end, dayMonthFormat)}`
}

const CustomMinDatePicker = ({ range, setValueLabel, setRange, onChange, handleToggle }) => {
  const { formatMessage, format } = useIntl()

  return (
    <div style={{ width: '95%' }}>
      <DesktopDatePicker
        label={formatMessage(messages.fromDate)}
        value={range.minDate || null}
        onChange={minDate => {
          if (minDate) {
            if (range.maxDate !== null) {
              setValueLabel(customFormat(minDate, range.maxDate, format))
              setRange({ ...range, minDate })
              onChange({ minDate, maxDate: range.maxDate })
              handleToggle()
            } else {
              setRange({ ...range, minDate })
            }
          }
        }}
        renderInput={params => <TextField {...params} disabled onKeyDown={e => e.preventDefault()} />}
      />
    </div>
  )
}

const CustomMaxDatePicker = ({ range, setValueLabel, setRange, onChange, handleToggle }) => {
  const { formatMessage, format } = useIntl()

  return (
    <div style={{ width: '95%' }}>
      <DesktopDatePicker
        label={formatMessage(messages.toDate)}
        value={range.maxDate}
        minDate={range.minDate}
        onChange={maxDate => {
          if (maxDate) {
            if (range.minDate !== null) {
              setValueLabel(customFormat(range.minDate, maxDate, format))
              setRange({ ...range, maxDate })
              onChange({ minDate: range.minDate, maxDate })
              handleToggle()
            } else {
              setRange({ ...range, maxDate })
            }
          }
        }}
        renderInput={params => <TextField {...params} disabled onKeyDown={e => e.preventDefault()} />}
      />
    </div>
  )
}
