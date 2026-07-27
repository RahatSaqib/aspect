const chai = require('chai')

const { assert } = chai

function assertPropertiesOfListItem(res) {
  assert.property(res.body.data[0], 'id')
  assert.property(res.body.data[0], 'name')
  assert.property(res.body.data[0], 'shortName')
  assert.property(res.body.data[0], 'notes')
  assert.property(res.body.data[0], 'createdOn')
  assert.property(res.body.data[0], 'lastPingOn')
  assert.property(res.body.data[0], 'lastSeen')
  assert.property(res.body.data[0], 'state')
  assert.property(res.body.data[0], 'type')
  assert.property(res.body.data[0], 'category')
  assert.property(res.body.data[0], 'hasResults')
  assert.property(res.body.data[0], 'hasConnectivity')
  assert.property(res.body.data[0], 'approval')
  assert.property(res.body.data[0], 'resultCountLastMonth')
  assert.property(res.body.data[0], 'resultCountThisMonth')
  assert.typeOf(res.body.data[0].error, 'Object')
  assert.typeOf(res.body.data[0].availability, 'Object')
  assert.property(res.body, 'total')
}

module.exports = {
  assertPropertiesOfListItem,
}
