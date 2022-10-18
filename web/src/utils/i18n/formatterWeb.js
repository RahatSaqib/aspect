const formatI18nMessage = (messages, formatMessage, key, defaultMessage) =>
  messages[key] ? formatMessage(messages[key]) : defaultMessage

export default formatI18nMessage
