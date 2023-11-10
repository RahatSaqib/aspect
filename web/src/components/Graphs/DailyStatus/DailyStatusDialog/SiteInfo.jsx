import React from 'react'
import useI18n from '../../../../hooks/useI18n'
import { i18nWrapper } from '../../../../providers/I18nProvider'
import IconProvider from '../../../IconProvider/index'
import styles from './DailyStatusDialog.module.css'
import messages from './messages'

const { format } = i18nWrapper()

const workingHoursFormat = 'p' // Long localized time

const SiteInfo = ({ siteContacts, hoursStart, hoursEnd }) => {
  const { formatMessage } = useI18n()

  return (
    <div className={styles.Form__bottom_container}>
      <div className={styles.Form__bottom_title}>{formatMessage(messages.siteWorkingHours)}</div>
      <div className={styles.Form__bottom_details}>
        <div className={styles.Form__bottom_prop} style={{ marginLeft: 0 }}>
          <div className={styles.Form__bottom_prop_name}>{formatMessage(messages.siteWorkingHoursFrom)}:</div>
          <div className={styles.Form__bottom_prop_value}>
            {hoursStart
              ? format(new Date(2000, 1, 1, hoursStart, 0), workingHoursFormat)
              : formatMessage(messages.siteWorkingHoursUnknown)}
          </div>
          <div className={styles.Form__bottom_prop_name}>{formatMessage(messages.siteWorkingHoursTo)}:</div>
          <div className={styles.Form__bottom_prop_value}>
            {hoursEnd
              ? format(new Date(2000, 1, 1, hoursEnd, 0), workingHoursFormat)
              : formatMessage(messages.siteWorkingHoursUnknown)}
          </div>
        </div>
      </div>

      <div className={styles.Form__bottom_title}>{formatMessage(messages.siteContacts)}</div>
      {siteContacts?.length > 0
        ? siteContacts.map(({ name, email, phone }) => {
            return (
              <div key={`${name}-${email}-${phone}`} className={styles.Form__bottom_details}>
                <div className={styles.Form__bottom_contact_name}>{name}</div>
                {email ? (
                  <div className={styles.Form__bottom_prop}>
                    <IconProvider icon="AiOutlineMail" className={styles.Form__bottom_cell__icon} />
                    <a className={styles.Form__bottom_contact_name_email} href={`mailto: ${email}`}>
                      {email}
                    </a>
                  </div>
                ) : null}
                {phone?.length > 0 ? (
                  <div className={styles.Form__bottom_prop}>
                    <IconProvider icon="AiOutlinePhone" className={styles.Form__bottom_cell__icon} />
                    {phone.join(', ')}
                  </div>
                ) : null}
              </div>
            )
          })
        : formatMessage(messages.noSiteContacts)}
    </div>
  )
}

export default SiteInfo
