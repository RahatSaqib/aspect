// this is used to format the extracted translation strings into
// the json format that "json2po" expects
const format = function(msgs) {
  const results = []
  for (const [id, { defaultMessage }] of Object.entries(msgs)) {
    results.push({
      id,
      defaultMessage,
    })
  }
  return results
}

const formatI18nMessage = (messages, formatMessage, key, defaultMessage) =>
  messages[key] ? formatMessage(messages[key]) : defaultMessage

export { format, formatI18nMessage }
