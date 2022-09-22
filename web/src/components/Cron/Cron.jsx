import React, { useState } from 'react'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import cronstrue from 'cronstrue'
import DisplayCard from './components/DisplayCard'
import Daily from './Daily'
import Monthly from './Monthly'
import Weekly from './Weekly'

const options = [
  { name: 'Daily', Component: Daily, value: ['0', '0', '00', '1/1', '*', '?', '*'] },
  { name: 'Weekly', Component: Weekly, value: ['0', '0', '00', '?', '*', '*', '*'] },
  { name: 'Monthly', Component: Monthly, value: ['0', '0', '00', '1', '1/1', '?', '*'] },
]

const getHumanValue = cronExpression => {
  const val = cronstrue.toString(cronExpression.toString().replace(/,/g, ' ').replace(/!/g, ','))
  if (val.search('undefined') === -1) {
    return val
  }
  return '-'
}

const Cron = ({ showResultText, showResultCron, onChange }) => {
  const [cronExpression, setCronExpression] = useState(options[0].value)
  const [selectedTab, setSelectedTab] = useState(0)

  const onTabChange = idx => {
    setSelectedTab(idx)
    setCronExpression(options[idx].value)
    onChange(options[idx].value)
  }

  const onValueChange = val => {
    if (val && val.length) {
      setCronExpression(val)
    } else {
      setCronExpression(['0', '0', '00', '1/1', '*', '?', '*'])
      val = ['0', '0', '00', '1/1', '*', '?', '*']
    }

    let newVal = ''
    newVal = val.toString().replace(/,/g, ' ')
    newVal = newVal.replace(/!/g, ',')
    onChange(newVal, getHumanValue(newVal))
  }
  const Selector = options[selectedTab].Component

  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Tabs value={selectedTab} aria-label="simple tabs example">
            {options.map((option, idx) => (
              <Tab key={idx} label={option.name} onClick={() => onTabChange(idx)} />
            ))}
          </Tabs>
        </Grid>

        <Grid item xs={12}>
          <Selector cronExpression={cronExpression} onChange={onValueChange} />
        </Grid>

        <Grid item xs={12}>
          <DisplayCard
            textResult={showResultText && getHumanValue(cronExpression)}
            cronResult={showResultCron && cronExpression.toString().replace(/,/g, ' ').replace(/!/g, ',')}
          />
        </Grid>
      </Grid>
    </>
  )
}

export default Cron
