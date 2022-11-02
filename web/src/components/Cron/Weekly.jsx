import React from 'react'
import { Checkbox, FormControlLabel, FormGroup, Stack } from '@mui/material'
import classNames from 'classnames/bind'
import useI18n from '../../hooks/useI18n'
import { cronMessages as messages } from '../../messages/index'
import ChooseTime from './components/ChooseTime'
import styles from './styles.css'

const classes = classNames.bind(styles)
const Weekly = ({ cronExpression, onChange }) => {
  const { formatMessage } = useI18n()

  const changeHours = e => {
    const val = [...cronExpression]
    val[1] = `${e.target.value}`
    onChange(val)
  }
  const changeMinutes = e => {
    const val = [...cronExpression]

    val[1] = `${e.target.value}`
    onChange(val)
  }
  const onCheck = e => {
    const val = [...cronExpression]
    if (e.target.checked) {
      val[1] = `${val[1]}`.split('/').length > 1 ? '0' : val[1].toString()
      val[2] = '?'
      if (val[4] === '*' || val[4] === '1-5') {
        val[4] = e.target.value
      } else {
        val[4] = `${val[4]}!${e.target.value}`
      }
    } else {
      val[4] = val[4].split('!')
      if (val[4].length > 1) {
        val[4].splice(val[4].indexOf(e.target.value), 1)
        val[4] = val[4].toString().replace(/,/g, '!')
      } else {
        val[4] = '*'
      }
    }

    onChange(val)
  }

  return (
    <Stack direction="column" spacing={2} alignItems="flex-start" justifyContent="flex-start">
      <Stack direction="row" spacing={1} alignItems="center">
        <div className={classes('Content')}>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  type="checkbox"
                  value="MON"
                  onChange={onCheck}
                  checked={cronExpression[4].search('1') !== -1}
                />
              }
              label={formatMessage(messages.monday)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  type="checkbox"
                  value="TUE"
                  onChange={onCheck}
                  checked={cronExpression[4].search('2') !== -1}
                />
              }
              label={formatMessage(messages.tuesday)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  type="checkbox"
                  value="WED"
                  onChange={onCheck}
                  checked={cronExpression[4].search('3') !== -1}
                />
              }
              label={formatMessage(messages.wednesday)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  type="checkbox"
                  value="THU"
                  onChange={onCheck}
                  checked={cronExpression[4].search('4') !== -1}
                />
              }
              label={formatMessage(messages.thursday)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  type="checkbox"
                  value="FRI"
                  onChange={onCheck}
                  checked={cronExpression[4].search('5') !== -1}
                />
              }
              label={formatMessage(messages.friday)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  type="checkbox"
                  value="SUN"
                  onChange={onCheck}
                  checked={cronExpression[4].search('6') !== -1}
                />
              }
              label={formatMessage(messages.sunday)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  type="checkbox"
                  value="SAT"
                  onChange={onCheck}
                  checked={cronExpression[4].search('7') !== -1}
                />
              }
              label={formatMessage(messages.saturday)}
            />
          </FormGroup>
        </div>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <ChooseTime
          hour={cronExpression[1]}
          minute={cronExpression[2]}
          changeMinutes={changeMinutes}
          changeHours={changeHours}
        />
      </Stack>
    </Stack>
  )
}

export default Weekly
