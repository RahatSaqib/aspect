import React from 'react'
import Card from '@mui/material/Card'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Grid from '@mui/material/Grid'
import useI18n from '../../hooks/useI18n'
import { cronMessages as messages } from '../../messages/index'
import ChooseTime from './components/ChooseTime'

const Weekly = ({ cronExpression, onChange }) => {
  const { formatMessage } = useI18n()

  const changeHours = e => {
    const val = [...cronExpression]
    val[0] = '0'
    val[2] = `${e.target.value}`
    onChange(val)
  }
  const changeMinutes = e => {
    const val = [...cronExpression]
    val[0] = '0'
    val[1] = `${e.target.value}`
    onChange(val)
  }
  const onCheck = e => {
    const val = [...cronExpression]
    val[0] = '0'
    if (e.target.checked) {
      val[2] = `${val[2]}`.split('/').length > 1 ? '0' : val[2].toString()
      val[3] = '?'
      val[4] = '*'
      if (val[5] === '*' || val[5] === '?' || val[5] === 'MON-FRI') {
        val[5] = e.target.value
      } else {
        val[5] = `${val[5]}!${e.target.value}`
      }
    } else {
      val[5] = val[5].split('!')
      if (val[5].length > 1) {
        val[5].splice(val[5].indexOf(e.target.value), 1)
        val[5] = val[5].toString().replace(/,/g, '!')
      } else {
        val[5] = '*'
      }
    }

    onChange(val)
  }

  return (
    <>
      <Card style={{ padding: 10, margin: 10 }}>
        <Grid container style={{ padding: 10, margin: 10 }}>
          <Grid item justifyContent="flex-start" style={{ padding: 10, margin: 10 }}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    type="checkbox"
                    value="MON"
                    onChange={onCheck}
                    checked={cronExpression[5].search('MON') !== -1}
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
                    checked={cronExpression[5].search('TUE') !== -1}
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
                    checked={cronExpression[5].search('WED') !== -1}
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
                    checked={cronExpression[5].search('THU') !== -1}
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
                    checked={cronExpression[5].search('FRI') !== -1}
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
                    checked={cronExpression[5].search('SUN') !== -1}
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
                    checked={cronExpression[5].search('SAT') !== -1}
                  />
                }
                label={formatMessage(messages.saturday)}
              />
            </FormGroup>
          </Grid>
          <Grid item>
            <Grid>
              <ChooseTime
                hour={cronExpression[2]}
                minute={cronExpression[1]}
                changeMinutes={changeMinutes}
                changeHours={changeHours}
              />
            </Grid>
          </Grid>
        </Grid>
      </Card>
    </>
  )
}

export default Weekly
