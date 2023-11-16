import React, { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, Tab, Tabs } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { cronMessages as messages } from '../../messages'
import DisplayCard from './components/DisplayCard'
import Daily from './Daily'
import Monthly from './Monthly'
import Quarterly from './Quarterly'
import styles from './styles.module.css'
import getCronHumanValue from './utils'
import Weekly from './Weekly'

const options = [
  { name: 'daily', Component: Daily, value: ['0', '0', '*/1', '*', '*'] },
  { name: 'weekly', Component: Weekly, value: ['0', '0', '*/1', '*', 'MON'] },
  { name: 'monthly', Component: Monthly, value: ['0', '0', '1', '*', '*'] },
  { name: 'quarterly', Component: Quarterly, value: ['0', '0', '1', '*/3', '*'] },
]
const getInitialTabIndex = value => {
  if (!value) return 0
  const index = options.findIndex(it => it.name === value.frequency)
  return index < 0 ? 0 : index
}

const Cron = ({ showResultText, showResultCron, onChange, value }) => {
  const { locale, formatMessage } = useIntl()
  const [selectedTabIndex, setSelectedTabIndex] = useState(getInitialTabIndex(value))

  useEffect(() => {
    if (!value) {
      onChange(options[0].value, options[0].name)
      setSelectedTabIndex(0)
    }
  }, [locale, onChange, value])

  const onTabChange = useCallback(
    (event, tabIndex) => {
      setSelectedTabIndex(tabIndex)
      onChange(options[tabIndex].value, options[tabIndex].name)
    },
    [onChange]
  )

  const onValueChange = cronExpression => {
    onChange(cronExpression, options[selectedTabIndex].name)
  }

  const CronExpressionWizard = options[selectedTabIndex].Component

  /**
   * don't render JSX if no `value` set up
   */
  if (!value) return null
  /**
   * render JSX if `value` is defined
   */

  return (
    <Card style={{ maxWidth: '100%' }}>
      <CardContent>
        <Tabs value={selectedTabIndex} onChange={onTabChange} className={styles.Tab_Margin}>
          {options.map(option => (
            <Tab fullWidth key={option.name} label={formatMessage(messages[option.name])} />
          ))}
        </Tabs>

        <CronExpressionWizard cronExpression={value.cronExpression} onChange={onValueChange} />

        <DisplayCard
          textResult={showResultText ? getCronHumanValue(value?.cronExpression, locale) : null}
          cronResult={showResultCron ? value.cronExpression.join(' ') : null}
        />
      </CardContent>
    </Card>
  )
}

Cron.propTypes = {
  showResultText: PropTypes.bool,
  showResultCron: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
}

Cron.defaultProps = {
  showResultText: true,
  showResultCron: false,
  value: undefined,
}

export default Cron
