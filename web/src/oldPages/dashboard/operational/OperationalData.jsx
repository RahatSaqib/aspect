/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import DetailHeader from '../../../components/DetailHeader'
import useI18n from '../../../hooks/useI18n'
import ColoredButton from '../../../oldComponents/themedReactToolbox/ColoredButton'
import messages from './messages'
import OperationalDailyStatus from './OperationalDailyStatus'
import OperationalDashBoard from './OperationalDashBoard'
import styles from './OperationalData.css'

const cssClasses = classnames.bind(styles)

export const OperationalData = () => {
  const { formatMessage } = useI18n()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <>
      <Helmet title={formatMessage(messages.title)} />
      {activeTab === 'dashboard' ? (
        <>
          <DetailHeader name={formatMessage(messages.dashboard)} disableBack>
            <ColoredButton
              mountain
              onClick={() => setActiveTab('dailyStatus')}
              label={formatMessage(messages.dailyStatusNav)}
            />
          </DetailHeader>
          <div className={cssClasses('Container')}>
            <OperationalDashBoard />
          </div>
        </>
      ) : (
        <>
          <DetailHeader name={formatMessage(messages.dailyStatus)} disableBack>
            <ColoredButton
              mountain
              onClick={() => setActiveTab('dashboard')}
              label={formatMessage(messages.dashboardNav)}
            />
          </DetailHeader>
          <div className={cssClasses('Container')}>
            <OperationalDailyStatus />
          </div>
        </>
      )}
    </>
  )
}

export default OperationalData
