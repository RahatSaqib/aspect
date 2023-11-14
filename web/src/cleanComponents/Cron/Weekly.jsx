import React, { useCallback, useState } from 'react'
import { Checkbox, FormControlLabel, FormGroup, Stack } from '@mui/material'
import { useIntl } from 'react-intl'
import { cronMessages as messages } from '../../messages/index'
import ChooseTime from './components/ChooseTime'
import styles from './styles.module.css'

const WEEK_DAYS = [
  {
    i18nKey: messages.sunday,
    abbr: 'SUN',
  },
  {
    i18nKey: messages.monday,
    abbr: 'MON',
  },
  {
    i18nKey: messages.tuesday,
    abbr: 'TUE',
  },
  {
    i18nKey: messages.wednesday,
    abbr: 'WED',
  },
  {
    i18nKey: messages.thursday,
    abbr: 'THU',
  },
  {
    i18nKey: messages.friday,
    abbr: 'FRI',
  },
  {
    i18nKey: messages.saturday,
    abbr: 'SAT',
  },
]
const initDaysOfTheWeek = cronExpression => {
  return WEEK_DAYS.map(it => {
    if (cronExpression[4] === '*') {
      return it.abbr
    }
    return cronExpression[4].includes(it.abbr) ? it.abbr : ''
  })
}

const Weekly = ({ cronExpression, onChange }) => {
  const { formatMessage } = useIntl()
  const [daysOfTheWeek, setDaysOfTheWeek] = useState(initDaysOfTheWeek(cronExpression))
  // ------------------------------
  const changeHours = useCallback(
    event => {
      const val = [...cronExpression]
      val[1] = `${event.target.value}`
      onChange(val)
    },
    [cronExpression, onChange]
  )
  // ------------------------------
  const changeMinutes = useCallback(
    event => {
      const val = [...cronExpression]
      val[0] = `${event.target.value}`
      onChange(val)
    },
    [cronExpression, onChange]
  )
  // ------------------------------
  const onCheck = useCallback(
    event => {
      const weekDayIndex = +event.target.value
      const val = [...cronExpression]
      const daysOfTheWeekClone = [...daysOfTheWeek]
      const weekDay = WEEK_DAYS[weekDayIndex]

      daysOfTheWeekClone[weekDayIndex] = event.target.checked ? weekDay.abbr : ''

      setDaysOfTheWeek(daysOfTheWeekClone)

      val[4] =
        daysOfTheWeekClone.filter(value => value === '').length === 7
          ? '*'
          : daysOfTheWeekClone.filter(value => value !== '').join(',')

      onChange(val)
    },
    [cronExpression, daysOfTheWeek, onChange]
  )
  // ------------------------------
  const isChecked = useCallback(abbr => cronExpression[4].search(abbr) !== -1, [cronExpression])

  return (
    <Stack direction="column" spacing={2} alignItems="flex-start" justifyContent="flex-start">
      <Stack direction="row" spacing={1} alignItems="center">
        <FormGroup row className={styles.Check_Group}>
          {WEEK_DAYS.map((it, index) => (
            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  type="checkbox"
                  value={index}
                  onChange={onCheck}
                  checked={isChecked(it.abbr)}
                />
              }
              key={it.abbr}
              label={formatMessage(it.i18nKey)}
            />
          ))}
        </FormGroup>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <ChooseTime
          hour={cronExpression[1]}
          minute={cronExpression[0]}
          changeMinutes={changeMinutes}
          changeHours={changeHours}
        />
      </Stack>
    </Stack>
  )
}

export default Weekly
