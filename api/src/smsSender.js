const config = require('./config')
const { sendSms } = require('./sms/smsUtil')

function main() {
  sendSms(config.admin.cell, 'this is a test')
}

main()
