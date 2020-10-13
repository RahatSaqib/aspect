import map from 'lodash/map'
import subMinutes from 'date-fns/subMinutes'
import formatDistance from 'date-fns/formatDistance'
import times from 'lodash/times'
import random from 'lodash/random'

function mockDatafetch() {
  const data = []
  times(256, index => {
    const triggerRandom = random(0, 120000)
    const contactRandom = random(0, 100)

    data.push({
      id: index,
      name: `Notification trigger ${index}`,
      totalTriggers: triggerRandom,
      alertCount: triggerRandom,
      contactsCount: contactRandom,
      contacts: contactRandom,
      lastTriggeredOn: formatDistance(
        subMinutes(new Date(), random(0, 35000)),
        new Date(),
        {
          addSuffix: true,
        }
      ),
    })
  })
  return { data }
}

function buildColumnsFromData({ columns }) {
  const output = []
  if (columns) {
    map(columns, ({ key, label, ...rest }) =>
      output.push({ Header: label, accessor: key, ...rest })
    )
  }
  return output
}

export { buildColumnsFromData, mockDatafetch }
