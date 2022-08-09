const QUEUE_IDLE_TIME = 300
const QUEUE_TIMEOUT_TIME = 4000

const { createMessageQueue } = require('../../src/mq')
const config = require('../../src/config')
const { updateSubscription: updateHandlersSubscription } = require('../../src/subscriptions')

let sharedQueue = null
async function queueConnect() {
  if (sharedQueue == null) {
    sharedQueue = await createMessageQueue(`${config.amqp.name}`)
  }
  return sharedQueue
}

async function queuePurge() {
  const queue = await queueConnect()
  await queue.waitForIdle(QUEUE_IDLE_TIME)
  await queue.purge()
}

async function subscribe(subscriptionName, subscription) {
  const queue = await queueConnect()
  await queue.subscribe(subscriptionName, subscription)
}

async function updateSubscription(subscriptorKey) {
  const queue = await queueConnect()
  await queue.unsubscribe(subscriptorKey)
  await updateHandlersSubscription(queue, subscriptorKey)
}

async function createMessageContext() {
  const queue = await queueConnect()
  return queue.createMessageContext()
}

async function waitForAction(predicate, timeout = QUEUE_TIMEOUT_TIME) {
  const queue = await queueConnect()
  return queue.waitForAction(predicate, timeout)
}

async function waitForIdle(idleTime = QUEUE_IDLE_TIME) {
  const queue = await queueConnect()
  return queue.waitForIdle(idleTime)
}

async function dispatchAndWaitForAction(action, timeout = QUEUE_TIMEOUT_TIME) {
  const queue = await queueConnect()
  const waitForIt = waitForAction(action, timeout)
  queue.dispatch(action)
  await waitForIt
  return waitForIdle()
}

module.exports = {
  queueConnect,
  queuePurge,
  createMessageContext,
  waitForAction,
  waitForIdle,
  dispatchAndWaitForAction,
  subscribe,
  updateSubscription,
}
