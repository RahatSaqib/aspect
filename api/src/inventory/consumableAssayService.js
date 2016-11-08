const { query } = require('../db')

const SELECT_LIST_FIELDS = ['ca.consumableId', 'ca.assayId', 'ca.quantity',
  'c.name as consumableName', 'u.name as unitName', 'u.shortname as unitShortName',
  'a.name as assayName', 'a.i18nKey as assayI18nKey']

function* getConsumableAssays(request){
  const {consumableId} = request.params

  const assayConsumables = yield query('Get assay consumables')
    .from('ConsumableAssay as ca')
    .join('Consumable as c', 'ca.consumableId', 'c.id')
    .join('Unit as u', 'c.unit', 'u.id')
    .join('Assay as a', 'ca.assayId', 'a.id')
    .where('ca.consumableId', consumableId)
    .select(SELECT_LIST_FIELDS)

  return {ok: true, data: assayConsumables }
}

module.exports = {
  getConsumableAssays
}
