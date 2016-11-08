const { query } = require('../db')

const SELECT_LIST_FIELDS = ['ca.consumableId', 'ca.assayId', 'ca.quantity']

function* getConsumableAssays(request){
  const {consumableId} = request.params

  const assayConsumables = yield query('Get assay consumables')
    .from('ConsumableAssay as ca')
    .where('ca.consumableId', consumableId)
    .select(SELECT_LIST_FIELDS)

  return {ok: true, data: assayConsumables }
}

module.exports = {
  getConsumableAssays
}
