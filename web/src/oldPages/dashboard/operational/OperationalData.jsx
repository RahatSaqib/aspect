import React, { useState } from 'react'
import LaunchIcon from '@mui/icons-material/Launch'
import { Helmet } from 'react-helmet'
import { DetailHeader } from '../../../cleanComponents'
import useI18n from '../../../hooks/useI18n'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import messages from './messages'
import OperationalDailyStatus from './OperationalDailyStatus'
import OperationalDashBoard from './OperationalDashBoard'
import styles from './OperationalData.module.css'

export const OperationalData = () => {
  const { formatMessage } = useI18n()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <>
      <Helmet title={formatMessage(messages.title)} />
      {activeTab === 'dashboard' ? (
        <>
          <DetailHeader name={formatMessage(messages.dashboard)} disableBack>
            <AspectButton
              color="primary"
              variant="outlined"
              inverse
              endIcon={<LaunchIcon />}
              onClick={() => setActiveTab('dailyStatus')}
            >
              {formatMessage(messages.dailyStatusNav)}
            </AspectButton>
          </DetailHeader>
          <div className={styles.Container}>
            <OperationalDashBoard />
          </div>
        </>
      ) : (
        <>
          <DetailHeader name={formatMessage(messages.dailyStatus)} disableBack>
            <AspectButton
              color="primary"
              variant="outlined"
              inverse
              endIcon={<LaunchIcon />}
              onClick={() => setActiveTab('dashboard')}
            >
              {formatMessage(messages.dashboardNav)}
            </AspectButton>
          </DetailHeader>
          <div className={styles.Container}>
            <OperationalDailyStatus />
          </div>
        </>
      )}
    </>
  )
}

export default OperationalData
