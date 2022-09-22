const Boom = require('@hapi/boom')
const { knex } = require('../db')

/**
 * These codes are persisted in LoginHistoryTable.code
 */
const LOGIN_HISTORY_CODES = {
  sucess: 'success',
  userNotExists: 'non.existent.user',
  gxAlertUserNotExists: 'gxalert.non.existent.user',
  wrongPassword: 'wrong.password',
  gxAlertWrongPassword: 'gxalert.wrong.password',
  lockedOut: 'locked',
  disabled: 'disabled',
  unexpected: 'unexpected.error',
}

/**
 * Creates a record in LoginHistory table
 * @param {knex} query - knex
 * @param {Integer} userId - User id, if it's available
 * @param {*} userName - User Name credential posted by user
 * @param {*} success - 1: user is logged in, 2: user is not logged in
 * @param {*} code - @see LOGIN_HISTORY_CODES, typed code to enable easy search.
 */
async function createLoginHistoryEntry(query, userId, userName, success, code, message) {
  await query('Create Login history entry').from('LoginHistory').insert({
    userId,
    userName,
    action: 'login',
    success,
    code,
    message,
    createdOn: new Date(),
  })
}

/**
 * This is a wrapper to add login history behavior to the authentication function.
 * @param {function} authFunction - AuthFunction to execute inside the wrapper.
 * @returns - function to be excuted for authentication.
 */
function loginHistoryWrapper(authFunction) {
  return async (request, response) => {
    const { payload } = request
    try {
      const res = await authFunction(request, response)
      if (Boom.isBoom(res)) {
        createLoginHistoryEntry(
          knex,
          response.user?.id,
          payload.name,
          false,
          res.loginHistoryCode || LOGIN_HISTORY_CODES.unexpected,
          res.message
        )
      } else {
        createLoginHistoryEntry(knex, response.user?.id, payload.name, true, LOGIN_HISTORY_CODES.sucess)
      }
      return res
    } catch (ex) {
      createLoginHistoryEntry(
        knex,
        response.user?.id,
        payload.name,
        false,
        ex.loginHistoryCode || LOGIN_HISTORY_CODES.unexpected
      )
      throw ex
    }
  }
}

/**
 * This function provides the ability to add a loginHistoryCode value to a Boom object,
 * which in Boom is banned by design, to prevent devs of to send internal data in a response.
 * @param {Boom} boom
 * @param {LOGIN_HISTORY_CODES} loginHistoryCode - Code indication result type
 * @param {int} userId - User id if it's present
 * @returns - The boom object whit extra error
 */
const loginHistoryCodeDecorator = (boom, loginHistoryCode, userId) => {
  boom.loginHistoryCode = loginHistoryCode
  boom.userId = userId
  return boom
}

module.exports = { LOGIN_HISTORY_CODES, createLoginHistoryEntry, loginHistoryWrapper, loginHistoryCodeDecorator }
