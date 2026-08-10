import React from 'react'
import omit from 'lodash/omit'
import { FaRegCopy } from 'react-icons/fa'
import { createIntl, createIntlCache, defineMessages } from 'react-intl'
import { toast } from 'react-toastify'
import config from '../../config'
import translation from '../i18n/translation.json'
import styles from './notifications.module.css'

const genericMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.generic.title',
    defaultMessage: 'Aspect has Encountered a Problem.',
  },
  message: {
    id: 'errorResponseMessages.generic.message',
    defaultMessage: 'Our technical team has been notified of the problem and will attend to it as soon as possible.',
  },
  copy: {
    id: 'errorResponseMessages.generic.copy',
    defaultMessage: 'Copy error',
  },
})

const LONG_ERROR_LENGTH = 300

const cache = createIntlCache()
let intl = null

// Notifications are also raised outside the React tree (fetch middleware), so intl cannot come from a hook.
const getIntl = () => {
  const locale = localStorage.getItem('asCulture') || config.defaultCulture
  if (!intl || intl.locale !== locale) {
    intl = createIntl({ locale, messages: translation[locale], onError: () => {} }, cache)
  }
  return intl
}

const buildContent = ({ title, message, resolution }, values) => {
  const { formatMessage } = getIntl()
  const heading = title && formatMessage(title, values)
  const details = [message, resolution].filter(Boolean).map(descriptor => formatMessage(descriptor, values))
  const fullText = [heading, ...details].filter(Boolean).join('\n')

  const copyError = event => {
    event.stopPropagation()
    navigator.clipboard.writeText(fullText)
  }

  return (
    <>
      {heading && <strong>{heading}</strong>}
      <div className={styles.ErrorToast__Details}>
        {details.map(detail => (
          <p key={detail}>{detail}</p>
        ))}
      </div>
      {fullText.length > LONG_ERROR_LENGTH && (
        <button type="button" className={styles.ErrorToast__CopyButton} onClick={copyError}>
          <FaRegCopy />
          {formatMessage(genericMessages.copy)}
        </button>
      )}
    </>
  )
}

export function notifyError(notification = {}, messageValues = {}) {
  const values = { ...omit(messageValues, ['constructor']), ...notification.messageValues }
  const content = buildContent(
    {
      title: notification.title || genericMessages.title,
      message: notification.message || genericMessages.message,
      resolution: notification.resolution,
    },
    values
  )
  toast.error(content, { autoClose: false, bodyClassName: styles.ErrorToast__Body })
}
