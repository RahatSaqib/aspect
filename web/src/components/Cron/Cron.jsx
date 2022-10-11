import React, { useEffect, useState } from 'react'
import { Card, CardContent, Tab, Tabs } from '@mui/material'
import classNames from 'classnames/bind'
import PropTypes from 'prop-types'
import useI18n from '../../hooks/useI18n'
import { cronMessages as messages } from '../../messages'
import DisplayCard from './components/DisplayCard'
import Daily from './Daily'
import Monthly from './Monthly'
import Quarterly from './Quarterly'
import styles from './styles.css'
import { getCronHumanValue } from './utils'
import Weekly from './Weekly'

const classes = classNames.bind(styles)
const DEFAULT_VALUE = ['0', '0', '00', '1/1', '*', '?', '*']
const options = [
  { name: 'daily', Component: Daily, value: DEFAULT_VALUE },
  { name: 'weekly', Component: Weekly, value: ['0', '0', '00', '?', '*', '*', '*'] },
  { name: 'monthly', Component: Monthly, value: ['0', '0', '00', '1', '1/1', '?', '*'] },
  { name: 'quarterly', Component: Quarterly, value: ['0', '0', '00', '1', '*/3', '?', '*'] },
]

const Cron = ({ showResultText, showResultCron, onChange, value }) => {
  const { locale, formatMessage } = useI18n()
  const [cronExpression, setCronExpression] = useState(DEFAULT_VALUE)
  const [selectedTab, setSelectedTab] = useState(0)

  useEffect(() => {
    if (value) setCronExpression(value.toString().split(' '))
  }, [value])
  const onTabChange = idx => {
    setSelectedTab(idx)
    if (!value) {
      setCronExpression(options[idx].value)
      let newVal = ''
      newVal = options[idx].value.toString().replace(/,/g, ' ')
      newVal = newVal.replace(/!/g, ',')
      onChange(newVal, getCronHumanValue(newVal, locale))
    }
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
    onChange(newVal, getCronHumanValue(newVal, locale))
  }
  const Selector = options[selectedTab].Component

  return (
    <Card style={{ maxWidht: '100%' }}>
      <CardContent>
        <Tabs value={selectedTab} className={classes('Tab_Margin')}>
          {options.map((option, idx) => (
            <Tab fullWidth key={idx} label={formatMessage(messages[option.name])} onClick={() => onTabChange(idx)} />
          ))}
        </Tabs>

        <Selector key={options[selectedTab].name} cronExpression={cronExpression} onChange={onValueChange} />
        <DisplayCard
          textResult={showResultText && getCronHumanValue(cronExpression, locale)}
          cronResult={showResultCron && cronExpression.toString().replace(/,/g, ' ').replace(/!/g, ',')}
        />
      </CardContent>
    </Card>
  )
}

Cron.propTypes = {
  showResultText: PropTypes.bool,
  showResultCron: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

Cron.defaultProps = {
  showResultText: true,
  showResultCron: false,
  value: null,
}
export default Cron
