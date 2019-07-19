/* eslint-disable no-console */
const firebaseAdmin = require('firebase-admin')
const Boom = require('boom')
const serviceAccount = require('./credentials.json')

// Initialize default app
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://reporter-app-systemone.firebaseio.com',
})

async function sendPushNotification(deviceTokenId, title, body, data) {
  return firebaseAdmin
    .messaging()
    .send({
      data,
      notification: {
        title,
        body,
      },
      token: deviceTokenId,
    })
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

async function sendPushNotificationGlobal(title, body, data) {
  return firebaseAdmin
    .messaging()
    .send({
      data,
      notification: {
        title,
        body,
      },
      topic: 'GLOBAL',
    })
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
  sendPushNotification,
  sendPushNotificationGlobal,
}
