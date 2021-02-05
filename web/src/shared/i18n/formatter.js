// this is used to format the extracted translation strings into
// the json format that "json2po" expects
exports.format = function(msgs) {
  const results = []
  for (const [id, msg] of Object.entries(msgs)) {
    results.push({
      id,
      defaultMessage: msg.defaultMessage,
    })
  }
  return results
}
