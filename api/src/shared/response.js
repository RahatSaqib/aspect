const { getContentType } = require('./io')

async function respondFile({ reply, dataBuffer, extension, fileName, streamResponse = false }) {
  return reply
    .response(dataBuffer)
    .encoding('binary')
    .type(getContentType(extension, streamResponse))
    .header('content-disposition', `attachment; filename=${fileName};`)
}

module.exports = {
  respondFile,
}
