import React, { useState } from 'react'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import cronstrue from 'cronstrue'
import PropTypes from 'prop-types'
import useI18n from '../../hooks/useI18n'
import { cronMessages as messages } from '../../messages'
import DisplayCard from './components/DisplayCard'
import Daily from './Daily'
import Monthly from './Monthly'
import Quarterly from './Quarterly'
import Weekly from './Weekly'

const options = [
  { name: 'daily', Component: Daily, value: ['0', '0', '00', '1/1', '*', '?', '*'] },
  { name: 'weekly', Component: Weekly, value: ['0', '0', '00', '?', '*', '*', '*'] },
  { name: 'monthly', Component: Monthly, value: ['0', '0', '00', '1', '1/1', '?', '*'] },
  { name: 'quarterly', Component: Quarterly, value: ['0', '0', '00', '1', '*/3', '?', '*'] },
]

const Cron = ({ showResultText, showResultCron, onChange }) => {
  const { locale, formatMessage } = useI18n()
  const getHumanValue = cronExpression => {
    const val = cronstrue.toString(cronExpression.toString().replace(/,/g, ' ').replace(/!/g, ','), { locale })
    if (val.search('undefined') === -1) {
      return val
    }
    return '-'
  }

  const [cronExpression, setCronExpression] = useState(options[0].value)
  const [selectedTab, setSelectedTab] = useState(0)

  const onTabChange = idx => {
    setSelectedTab(idx)
    setCronExpression(options[idx].value)
    let newVal = ''
    newVal = options[idx].value.toString().replace(/,/g, ' ')
    newVal = newVal.replace(/!/g, ',')
    onChange(newVal, getHumanValue(newVal))
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
          <Tabs value={selectedTab}>
            {options.map((option, idx) => (
              <Tab key={idx} label={formatMessage(messages[option.name])} onClick={() => onTabChange(idx)} />
            ))}
          </Tabs>
        </Grid>

        <Grid item xs={12}>
          <Selector key={options[selectedTab].name} cronExpression={cronExpression} onChange={onValueChange} />
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

Cron.propTypes = {
  showResultText: PropTypes.bool,
  showResultCron: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
}

Cron.defaultProps = {
  showResultText: true,
  showResultCron: true,
}
export default Cron
