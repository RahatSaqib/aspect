const actionHandlers = require('./actionHandler')
const onResultAnalyzeTimeout = require('./resultBased/notifyTimedOutResults.js')
const { sendSlackMessage } = require('../shared/slackUtil')
const { knex } = require('../db')
const logger = require('../shared/logger')

async function getNotificationSubscriptions(knex) {
  const actionParameters = await knex('NotificationTypeCategory as ntc')
    .distinct('ntc.externalId as notificationTypeCategoryId', 'ntc.triggerCondition')
    .then(rows => {
      return rows.reduce((acc, row) => {
        const { action, method } = JSON.parse(row.triggerCondition || '{}')
        if (action && method) {
          acc[action] = actionHandlers[method]()
        }
        return acc
      }, {})
    })

  return {
    actions: {
      ...actionParameters,
      RESULT_ANALYZE_TIMEOUT: onResultAnalyzeTimeout,
      NOTIFICATION_MESSAGE_PROCESSED: onNotificationMessageProcessed,
    },
  }
}

async function getNotificationTriggerSubscriptions({ messageContext }) {
  return messageContext.run(getNotificationSubscriptions)
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

async function onNotificationMessageProcessed({ data }) {
  const { smsMessageId, emailMessageId, webhookMessageId } = data
  try {
    const query = knex('Notification as n')
      .innerJoin('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
      .innerJoin('Partner as pt', 'nt.partnerId', 'pt.id')
      .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
      .select(
        'nt.name as notificationTypeName',
        'ntc.name as notificationTypeCategoryName',
        'pt.name as partnerName',
        'n.createdOn as notificationCreatedOn'
      )

    const getMessage = (
      title,
      partnerName,
      notificationTypeName,
      notificationTypeCategoryName,
      notificationCreatedOn
    ) => {
      return `${title}
    •   *Partner/Country*: ${partnerName}
    •   *Notification Type*: ${notificationTypeName}
    •   *Notification Type Category*: ${notificationTypeCategoryName}
    •   *Notification Created On*: ${notificationCreatedOn.toISOString().replace('T', ' ')}`
    }

    let data
    let message

    if (smsMessageId) {
      data = await query
        .innerJoin('SmsMessage as sm', 'n.smsMessageId', 'sm.id')
        .innerJoin('MessageStatus as ms', 'sm.messageStatusId', 'ms.id')
        .leftJoin('Person as p', 'sm.personId', 'p.id')
        .select(
          'sm.updatedOn as messageUpdatedOn',
          'ms.externalId as messageStatus',
          'p.name as personName',
          'p.id as personId',
          knex.raw('COALESCE(p.cell, p.phone, sm.phoneNumber) as phoneNumber'),
          'sm.errorData'
        )
        .where('sm.id', smsMessageId)
        .andWhere('ms.externalId', 'Error')
        .first()

      if (data) {
        const maskedPhoneNumber = maskPhoneNumber(data.phoneNumber)
        message = `${getMessage(
          `:warning: *There was an error on sending an SMS message.*`,
          data.partnerName,
          data.notificationTypeName,
          data.notificationTypeCategoryName,
          data.notificationCreatedOn
        )}
    •   *Message Error On*: ${data.messageUpdatedOn?.toISOString().replace('T', ' ')}
    •   *Person*: ${
      data.personId
        ? `${maskName(data.personName)} - <${process.env.aspectUrl}/browse/person/${
            data.personId
          }|Go to the person's details>`
        : 'N/A'
    }
    •   *Phone Number*: ${data.phoneNumber ? maskPhoneNumber(data.phoneNumber) : 'N/A'}
    •   *Error Data*: ${data.errorData.replace(data.phoneNumber, maskedPhoneNumber)}`
      }
    } else if (emailMessageId) {
      data = await query
        .innerJoin('EmailMessage as em', 'n.emailMessageId', 'em.id')
        .innerJoin('MessageStatus as ms', 'em.messageStatusId', 'ms.id')
        .leftJoin('Person as p', 'em.personId', 'p.id')
        .select(
          'em.updatedOn as messageUpdatedOn',
          'ms.externalId as messageStatus',
          'p.name as personName',
          'p.id as personId',
          knex.raw('COALESCE(p.email, p.email2) as email'),
          'em.sendResponse'
        )
        .where('em.id', emailMessageId)
        .andWhere('ms.externalId', 'Error')
        .first()

      if (data) {
        const maskedEmail = maskEmail(data.email)
        message = `${getMessage(
          `:warning: *There was an error on sending an Email message.*`,
          data.partnerName,
          data.notificationTypeName,
          data.notificationTypeCategoryName,
          data.notificationCreatedOn
        )}
    •   *Message Error On*: ${data.messageUpdatedOn?.toISOString().replace('T', ' ')}
    •   *Person*: ${
      data.personId
        ? `${maskName(data.personName)} - <${process.env.aspectUrl}/browse/person/${
            data.personId
          }|Go to the person's details>`
        : 'N/A'
    }
    •   *Email*: ${maskEmail(data.email)}
    •   *Error Data*: ${data.sendResponse?.replace(data.email, maskedEmail)}`
      }
    } else if (webhookMessageId) {
      data = await query
        .innerJoin('WebhookMessage as wm', 'n.emailMessageId', 'wm.id')
        .innerJoin('MessageStatus as ms', 'wm.messageStatusId', 'ms.id')
        .leftJoin('Person as p', 'wm.personId', 'p.id')
        .select('wm.updatedOn as messageUpdatedOn', 'ms.externalId as messageStatus', 'wm.response', 'wm.url')
        .where('wm.id', webhookMessageId)
        .andWhere('ms.externalId', 'Error')
        .first()

      if (data)
        message = `${getMessage(
          `:warning: *There was an error on sending a Webhook message.*`,
          data.partnerName,
          data.notificationTypeName,
          data.notificationTypeCategoryName,
          data.notificationCreatedOn
        )}
    •   *Message Error On*: ${data.messageUpdatedOn?.toISOString().replace('T', ' ')}
    •   *Webhook URL*: ${data.url}
    •   *Error Data*: ${data.response}`
    }

    if (message) {
      await sendSlackMessage(message)
    }
  } catch (error) {
    logger.error(error)
  }
}

module.exports = {
  getNotificationTriggerSubscriptions,
}
