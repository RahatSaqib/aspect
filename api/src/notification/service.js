const _ = require('lodash')

function* listNotifications(request) {
  const { query } = request

  const data = _.sortBy([
    {
      id: 1,
      type: 'A',
      name: 'Device in US Offline for more than 7 days',
      assignedContacts: 'Lab Contacts'
    },
    {
      id: 2,
      type: 'C',
      name: 'jkalsdfjlkasfd',
      assignedContacts: ''
    },
    {
      id: 3,
      type: 'B',
      name: 'Low Inventory Notification',
      assignedContacts: 'Dev (RB)'
    },
    {
      id: 4,
      type: 'A',
      name: 'MTB+??',
      assignedContacts: 'Installer Name, Stefan Baumgartner'
    },
    {
      id: 5,
      type: 'A',
      name: 'Patient Phone Testyman',
      assignedContacts: 'Patient'
    },
    {
      id: 6,
      type: 'C',
      name: 'Tag Contact Test',
      assignedContacts: 'Stefan Baumgartner'
    },
    {
      id: 7,
      type: 'B',
      name: 'Test',
      assignedContacts: 'Aaron Oppenheimer'
    },
    {
      id: 8,
      type: 'C',
      name: 'Test some mo',
      assignedContacts: 'Stefan Baumgartner'
    }
  ], query.sortCol || _.identity)

  const total = data.length

  const result = { ok: true, total, data, length: data.length }

  return result
}

module.exports = {
  listNotifications
}
