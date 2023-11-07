const Boom = require('@hapi/boom')
const {
  subDays,
  startOfDay,
  endOfDay,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} = require('date-fns')
const _ = require('lodash')
const { sendSlackMessage } = require('../../shared/slackUtil')
const logger = require('../../shared/logger')
const { getMessageStatusData } = require('./db')

function getDateRangeFilters(executionDate, reportDateRange, reportStartingWeekDay) {
  if (reportStartingWeekDay && reportDateRange !== 'PREVIOUS_WEEK') {
    throw new Boom.badData(`The reportDateRange type: ${reportDateRange} doesn't support reportStartingWeekDay`)
  }
  const dateRange = {}
  switch (reportDateRange) {
    case 'PREVIOUS_CALENDAR_DAY':
      dateRange.minDate = startOfDay(subDays(executionDate, 1))
      dateRange.maxDate = endOfDay(subDays(executionDate, 1))
      break
    case 'PREVIOUS_WEEK_DAY': {
      const daysToSubstract = {
        0: 2, // Sunday
        1: 3, // Monday
        2: 1,
        3: 1,
        4: 1,
        5: 1,
        6: 1, // Saturday
      }
      dateRange.minDate = startOfDay(subDays(executionDate, daysToSubstract[executionDate.getDay()]))
      dateRange.maxDate = endOfDay(subDays(executionDate, daysToSubstract[executionDate.getDay()]))
      break
    }
    case 'PREVIOUS_WEEK':
      dateRange.minDate = startOfWeek(subDays(executionDate, 7), { weekStartsOn: reportStartingWeekDay })
      dateRange.maxDate = endOfWeek(subDays(executionDate, 7), { weekStartsOn: reportStartingWeekDay })
      break
    case 'PREVIOUS_7_DAYS':
      dateRange.minDate = startOfDay(subDays(executionDate, 7))
      dateRange.maxDate = endOfDay(subDays(executionDate, 1))
      break
    case 'PREVIOUS_MONTH':
      dateRange.minDate = startOfMonth(subMonths(executionDate, 1))
      dateRange.maxDate = endOfMonth(subMonths(executionDate, 1))
      break
    case 'PREVIOUS_QUARTER':
      {
        const quarter = Math.floor(executionDate.getMonth() / 3)

        const startFullQuarter = new Date(executionDate.getFullYear(), quarter * 3 - 3, 1)
        const endFullQuarter = new Date(startFullQuarter.getFullYear(), startFullQuarter.getMonth() + 3, 0)

        dateRange.minDate = startOfDay(startFullQuarter)
        dateRange.maxDate = endOfDay(endFullQuarter)
      }
      break
    default:
      throw new Boom.badData(`Invalid reportDateRange type: ${reportDateRange}`)
  }
  return { minDate: dateRange.minDate.toISOString(), maxDate: dateRange.maxDate.toISOString() }
}

function maskEmail(email) {
  const partialEmail = email.replace(/(\w{3})[\w.-]+@([\w.]+\w)/, '$1***@$2')
  return partialEmail
}

function maskPhoneNumber(phoneNumber) {
  return `${phoneNumber.slice(0, -4)}****`
}

function maskName(personName) {
  const regex = /\b(\w{2})\w+(\w)\b/g
  return personName.replace(regex, '$1**$2')
}

async function notifyMessageWithErrorToSlack({ smsMessageId, emailMessageId, webhookMessageId }) {
  try {
    // Only one of smsMessageId, emailMessageId, or webhookMessageId, is going to be received
    // The message data is got from the one that is not null
    const {
      partnerName,
      notificationTypeName,
      notificationTypeCategoryName,
      notificationCreatedOn,
      messageStatus,
      messageUpdatedOn,
      ...messageData
    } = await getMessageStatusData({ smsMessageId, emailMessageId, webhookMessageId })

    const getMessage = title => {
      return `${title}
    •   *Partner/Country*: ${partnerName}
    •   *Notification Type*: ${notificationTypeName}
    •   *Notification Type Category*: ${notificationTypeCategoryName}
    •   *Notification Created On*: ${notificationCreatedOn.toISOString().replace('T', ' ')}`
    }

    if (messageStatus === 'Error') {
      let message

      if (smsMessageId) {
        const { personId, personName, phoneNumber, errorData } = messageData
        const maskedPhoneNumber = phoneNumber ? maskPhoneNumber(phoneNumber) : 'N/A'
        message = `${getMessage(`:warning: *There was an error on sending an SMS message.*`)}
    •   *Message Error On*: ${messageUpdatedOn?.toISOString()?.replace('T', ' ')}
    •   *Person*: ${
      personId
        ? `${maskName(personName)} - <${process.env.aspectUrl}/browse/person/${personId}|Go to the person's details>`
        : 'N/A'
    }
    •   *Phone Number*: ${maskedPhoneNumber}
    •   *Error Data*: ${
      errorData && phoneNumber && !_.isEmpty(phoneNumber)
        ? _.replace(errorData, new RegExp(_.escapeRegExp(phoneNumber), 'g'), maskedPhoneNumber)
        : errorData
    }`
      } else if (emailMessageId) {
        const { personId, personName, email, sendResponse } = messageData
        const maskedEmail = email ? maskEmail(email) : 'N/A'
        message = `${getMessage(`:warning: *There was an error on sending an Email message.*`)}
    •   *Message Error On*: ${messageUpdatedOn?.toISOString()?.replace('T', ' ')}
    •   *Person*: ${
      personId
        ? `${maskName(personName)} - <${process.env.aspectUrl}/browse/person/${personId}|Go to the person's details>`
        : 'N/A'
    }
    •   *Email*: ${maskedEmail}
    •   *Error Data*: ${
      sendResponse && email && !_.isEmpty(email)
        ? _.replace(sendResponse, new RegExp(_.escapeRegExp(email), 'g'), maskedEmail)
        : sendResponse
    }`
      } else if (webhookMessageId) {
        const { url, response } = messageData
        message = `${getMessage(`:warning: *There was an error on sending a Webhook message.*`)}
    •   *Message Error On*: ${messageUpdatedOn?.toISOString()?.replace('T', ' ')}
    •   *Webhook URL*: ${url}
    •   *Error Data*: ${response}`
      }

      if (message) {
        await sendSlackMessage(message)
      }
    }
  } catch (error) {
    logger.error(error)
  }
}

module.exports = {
  getDateRangeFilters,
  notifyMessageWithErrorToSlack,
}
