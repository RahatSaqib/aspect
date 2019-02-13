import PropTypes from 'prop-types'
import React, { useState } from 'react'
import classNames from 'classnames'
import _ from 'lodash'

import Select from '@material-ui/core/Select'
import Input from '@material-ui/core/Input'
import { withStyles } from '@material-ui/core/styles'

import dateFnFormat from 'date-fns/format'
import getDate from 'date-fns/getDate'
import getDaysInMonth from 'date-fns/getDaysInMonth'
import getHours from 'date-fns/getHours'
import getMinutes from 'date-fns/getMinutes'
import getMonth from 'date-fns/getMonth'
import getYear from 'date-fns/getYear'
import setDate from 'date-fns/setDate'
import setHours from 'date-fns/setHours'
import setMinutes from 'date-fns/setMinutes'
import setMonth from 'date-fns/setMonth'
import setYear from 'date-fns/setYear'
import subtractYears from 'date-fns/subYears'

const styles = () => ({
  input: {
    flexGrow: 1,
  },
  selectRoot: {
    minWidth: 'auto',
  },
  selectInput: {
    paddingRight: 0,
    width: '100%',
    textAlign: 'center',
    textAlignLast: 'center',
  },
  selectIcon: {
    display: 'none',
  },
  selectControl: {
    display: 'flex',
    flexFlow: 'row nowrap',
    margin: '0 0 8px 0',
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    margin: '0 5px',
  },
})

const accessOptions = {
  setYear,
  getYear,
  setMonth,
  getMonth,
  setDate,
  getDate,
  setHours,
  getHours,
  setMinutes,
  getMinutes,
}

const displayOptions = {
  Y: {
    name: 'Year',
    options: () => {
      const now = new Date()
      const startYear = getYear(subtractYears(now, 10))
      const endYear = getYear(subtractYears(now, -10))

      const years = []
      for (let i = startYear; i <= endYear; i++) {
        years.push({ value: i, label: dateFnFormat(new Date(i, 0, 1), 'YYYY') })
      }
      return years
    },
  },
  M: {
    name: 'Month',
    options: () => {
      const months = []
      for (let i = 0; i < 12; i++) {
        months.push({
          value: i,
          label: dateFnFormat(new Date(1970, i, 1), 'MMM'),
        })
      }
      return months
    },
  },
  D: {
    name: 'Date',
    options: date => {
      const daysInMonth = getDaysInMonth(date)
      const days = []
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({ value: i, label: dateFnFormat(new Date(1970, 0, i), 'DD') })
      }
      return days
    },
  },
  H: {
    name: 'Hours',
    options: () => {
      const hours = []
      for (let i = 0; i < 24; i++) {
        hours.push({
          value: i,
          label: dateFnFormat(new Date(1970, 0, 1, i, 0), 'HH'),
        })
      }
      return hours
    },
  },
  m: {
    name: 'Minutes',
    options: () => {
      const minutes = []
      for (let i = 0; i < 60; i++) {
        minutes.push({
          value: i,
          label: dateFnFormat(new Date(1970, 0, 1, 0, i), 'mm'),
        })
      }
      return minutes
    },
  },
}

const renderSelect = ({
  classesMap,
  value,
  optionsDate,
  name,
  options,
  handleChange,
}) => (
  <Select
    native
    classes={{
      root: classesMap.selectRoot,
      select: classesMap.selectInput,
      icon: classesMap.selectIcon,
    }}
    input={<Input className={classesMap.input} />}
    key={name}
    name={name}
    onChange={handleChange(accessOptions[`set${name}`])}
    value={value ? accessOptions[`get${name}`](value) : ''}
  >
    <option value="" hidden>
      {name}
    </option>
    {options(optionsDate).map(({ value, label }) => (
      <option key={value} value={value}>
        {label}
      </option>
    ))}
  </Select>
)

const DateTimeInput = ({
  classes: classesMap,
  className,
  onChange,
  value,
  displayFormat,
}) => {
  const [dateTime, setDateTime] = useState(value)
  const [optionsDate, setOptionsDate] = useState(value || new Date())

  const handleChange = set => ({ target: { value } }) => {
    const changedDate = set(optionsDate, value)
    setOptionsDate(changedDate)
    setDateTime(changedDate)
  }

  const handleBlur = event => {
    const { currentTarget } = event
    setTimeout(() => {
      if (!currentTarget.contains(document.activeElement)) {
        onChange(optionsDate)
      }
    }, 0)
  }

  return (
    <div
      className={classNames(className, classesMap.selectControl)}
      onBlur={handleBlur}
    >
      {_.map(displayFormat, (display, i) => {
        const { name, options } = displayOptions[display] || ''
        if (name) {
          return renderSelect({
            classesMap,
            value: dateTime || value,
            optionsDate,
            name,
            options,
            handleChange,
          })
        }
        return (
          <div key={`${display}-${i}`} className={classesMap.separator}>
            <div>{display}</div>
          </div>
        )
      })}
    </div>
  )
}

DateTimeInput.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  className: PropTypes.string,
  displayFormat: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.object, // eslint-disable-line react/forbid-prop-types
}

DateTimeInput.defaultProps = {
  className: '',
  displayFormat: 'Y/M/D',
  label: '',
  value: null,
}

export default withStyles(styles)(DateTimeInput)
