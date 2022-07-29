const { knex } = require('../../src/db')

const __start = '__start'
const __checkpoint = '__checkpoint'
class DataTracker {
  dataTracker = [{ type: __checkpoint, name: __start }]

  addCheckpoint(name) {
    dataTracker.push({ type: __checkpoint, name })
  }

  trackData(table, ids) {
    this.dataTracker.push({ type: 'delete', table, ids })
  }

  async clearToCheckpoint(checkpointToReset = __start) {
    while (true && this.dataTracker.length > 1) {
      const item = this.dataTracker.pop()
      
      if (item.type === __checkpoint && item.name === checkpointToReset) {
        break
      }
      
      if (item.type === 'delete') {
        await knex(item.table).whereIn('id', item.ids).del()
      }
    }
  }
  
  async clearAll() {
    await this.clearToCheckpoint()
  }
}
module.exports = { DataTracker }
