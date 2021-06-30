// this is used to format the extracted translation strings into
// the json format that "json2po" expects
exports.format = msgs => {
  const results = []
  for (const [id, { defaultMessage }] of Object.entries(msgs)) {
    results.push({
      id,
      defaultMessage,
    })
  }
  return results
}
