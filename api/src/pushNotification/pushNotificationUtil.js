const Boom = require('boom')
const fetch = require('node-fetch')
const config = require('../config')

// Initialize default app
const FIREBASE_CLOUD_MESSAGING_URL = 'https://fcm.googleapis.com/fcm/send'

async function sendPushNotification(token, title, body, data) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${config.firebase.serverKey}`,
    },
    body: JSON.stringify({
      to: token,
      data: data || {}, // data must be a non-null object
      notification: {
        title,
        body,
        content_available: true,
        priority: 'high',
      },
    }),
  }

  return fetch(FIREBASE_CLOUD_MESSAGING_URL, options)
    .then(() => ({ ok: true }))
    .catch(error => {
      console.log('Error sending message:', error)
      return Boom.expectationFailed('Error trying to send push message')
    })
}

async function sendPushNotificationGlobal(title, body, data) {
  return sendPushNotification('topics/GLOBAL', title, body, data)
}

module.exports = {
  sendPushNotification,
  sendPushNotificationGlobal,
}
