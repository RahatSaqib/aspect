const chai = require('chai')
const sinon = require('sinon')

const { assert } = chai
const proxyquire = require('proxyquire')

describe('doSendSmsMessage', () => {
  let knexStub
  let contextStub
  let sendSmsStub
  let allMessageStatusToIdStub
  let doSendSmsMessage

  beforeEach(() => {
    knexStub = sinon.stub()
    const smsMessageStub = {
      where: sinon.stub().returnsThis(),
      first: sinon.stub(),
      update: sinon.stub(),
    }
    knexStub.withArgs('SmsMessage as sm').returns(smsMessageStub)
    knexStub.withArgs('SmsMessage').returns(smsMessageStub)

    contextStub = {
      smsMessageProcessed: sinon.stub(),
      bindActionCreators: sinon.stub(),
      notificationMessageProcessed: sinon.stub(),
    }

    sendSmsStub = sinon.stub()
    allMessageStatusToIdStub = sinon.stub().resolves({
      Sent: 1,
      Error: 2,
    })

    doSendSmsMessage = proxyquire('../../src/sms/service', {
      '../../src/sms/smsUtil': { sendSms: sendSmsStub },
      '../../src/shared/dictionary': { allMessageStatusToId: allMessageStatusToIdStub },
    }).doSendSmsMessage
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should send SMS and update message status to Sent', async () => {
    const smsMessageId = 1
    const sms = {
      message: 'Test message',
      cell: '1234567890',
    }

    knexStub('SmsMessage as sm').first.resolves(sms)
    knexStub('SmsMessage').update.resolves()

    sendSmsStub.resolves()

    await doSendSmsMessage(contextStub, knexStub, smsMessageId)

    assert(
      knexStub('SmsMessage as sm').where.calledWith({ 'sm.id': smsMessageId }),
      'knexStub called with SmsMessage as sm'
    )
    assert(knexStub('SmsMessage as sm').first.called, 'knexStub first called')
    assert(knexStub('SmsMessage').where.calledWith({ id: smsMessageId }), 'knexStub called with SmsMessage')
    assert(sendSmsStub.calledWith(sms.cell, sms.message), 'sendSmsStub called with correct arguments')
    assert(
      contextStub.smsMessageProcessed.calledWith(smsMessageId),
      'contextStub.smsMessageProcessed called with smsMessageId'
    )
    assert(
      contextStub.notificationMessageProcessed.calledWith({ smsMessageId }),
      'contextStub.notificationMessageProcessed called with smsMessageId'
    )
  })
})
