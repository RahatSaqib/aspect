const { query } = require('../db')

function* getConsumableAssays(request){
  const {consumableId} = request.params

  const assayConsumables = yield query('Get assay consumables')
    .from('ConsumableAssay as ca')
    .where('ca.consumableId', consumableId)
    .select('ca.consumableId', 'ca.assayId', 'ca.quantity')

  return {ok: true, data: assayConsumables }
}

module.exports = {
  getConsumableAssays
}
