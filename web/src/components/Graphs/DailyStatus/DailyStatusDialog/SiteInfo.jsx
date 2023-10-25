import React from 'react'
import classnames from 'classnames/bind'
import useI18n from '../../../../hooks/useI18n'
import { i18nWrapper } from '../../../../providers/I18nProvider'
import IconProvider from '../../../IconProvider/index'
import styles from './DailyStatusDialog.css'
import messages from './messages'

const { format } = i18nWrapper()
const cssClasses = classnames.bind(styles)

const workingHoursFormat = 'p' // Long localized time

const SiteInfo = ({ siteContacts, hoursStart, hoursEnd }) => {
  const { formatMessage } = useI18n()

  return (
    <div className={cssClasses('Form__bottom-container')}>
      <div className={cssClasses('Form__bottom-title')}>{formatMessage(messages.siteWorkingHours)}</div>
      <div className={cssClasses('Form__bottom-details')}>
        <div className={cssClasses('Form__bottom-prop')} style={{ marginLeft: 0 }}>
          <div className={cssClasses('Form__bottom-prop-name')}>{formatMessage(messages.siteWorkingHoursFrom)}:</div>
          <div className={cssClasses('Form__bottom-prop-value')}>
            {hoursStart
              ? format(new Date(2000, 1, 1, hoursStart, 0), workingHoursFormat)
              : formatMessage(messages.siteWorkingHoursUnknown)}
          </div>
          <div className={cssClasses('Form__bottom-prop-name')}>{formatMessage(messages.siteWorkingHoursTo)}:</div>
          <div className={cssClasses('Form__bottom-prop-value')}>
            {hoursEnd
              ? format(new Date(2000, 1, 1, hoursEnd, 0), workingHoursFormat)
              : formatMessage(messages.siteWorkingHoursUnknown)}
          </div>
        </div>
      </div>

      <div className={cssClasses('Form__bottom-title')}>{formatMessage(messages.siteContacts)}</div>
      {siteContacts?.length > 0
        ? siteContacts.map(({ name, email, phone }) => {
            return (
              <div key={`${name}-${email}-${phone}`} className={cssClasses('Form__bottom-details')}>
                <div className={cssClasses('Form__bottom-contact-name')}>{name}</div>
                {email ? (
                  <div className={cssClasses('Form__bottom-prop')}>
                    <IconProvider icon="AiOutlineMail" className={cssClasses('Form__bottom-cell__icon')} />
                    <a className={cssClasses('Form__bottom-contact-name-email')} href={`mailto: ${email}`}>
                      {email}
                    </a>
                  </div>
                ) : null}
                {phone?.length > 0 ? (
                  <div className={cssClasses('Form__bottom-prop')}>
                    <IconProvider icon="AiOutlinePhone" className={cssClasses('Form__bottom-cell__icon')} />
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
