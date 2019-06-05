/* eslint-disable no-console */
const firebaseAdmin = require('firebase-admin')
const Boom = require('boom')
const serviceAccount = require('./credentials.json')

const topic = 'GLOBAL'
// This registration token comes from the client FCM SDKs.
// const registrationToken = 'YOUR_REGISTRATION_TOKEN'

const message = {
  data: {
    result: 'result1',
    time: '2:45',
  },
  notification: {
    title: 'This is a test push',
    body: 'This push notification was delivered from the Aspect Server',
  },
  topic,
  // token: TokenDeviceId property for only one device
  // tokens: [DeviceId, deviceid2....] for many devices.
}

async function testPush() {
  // Initialize default app
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: 'https://reporter-app-systemone.firebaseio.com',
  })

  // Send a message to the device corresponding to the provided
  // registration token.
  return firebaseAdmin
    .messaging()
    .send(message)
    .then(response => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response)
      return { ok: true }
    })
    .catch(error => {
      console.log('Error sending message:', error)
      return Boom.expectationFailed('Error trying to send push message')
    })
}

module.exports = {
  testPush,
}
