import { assert } from 'chai'
import _ from 'lodash'

describe('Grouped Data Table', () => {
  it('Should flatten the nested columns', () => {
    const formatDate = date => date ? date.toString() : 'N/A'
    const formatExpiresOn = expiresOn => formatDate(expiresOn, {format: 'user-timezone'})
    const nestedColumns = {
      columns: [{
        fieldName: 'siteName',
        headerText: 'Site Name'
      }, {
        fieldName: 'countryName',
        headerText: 'Country'
      }, {
        fieldName: 'stateName',
        headerText: 'State'
      }, {
        fieldName: 'lgaName',
        headerText: 'County'
      }],
      groupChildren: {
        fieldName: 'consumables',
        columns: [{
          fieldName: 'consumableName',
          headerText: 'Consumable Name'
        }, {
          fieldName: 'manufacturer',
          headerText: 'Manufacturer'
        }, {
          fieldName: 'unitShortName',
          headerText: 'Unit'
        }],
        groupChildren: {
          fieldName: 'inventoryItems',
          columns: [{
            fieldName: 'quantityOnHand',
            headerText: 'Quantity on Hand'
          }, {
            fieldName: 'expiresOn',
            headerText: 'Expires On',
            format: formatExpiresOn
          }]
        }
      }
    }

    let valuePropertyPath = nestedColumns.fieldName ? [nestedColumns.fieldName] : []
    const nestedColumnToHeaderColumn = column => {
      return {...column, fieldPath: [...valuePropertyPath, column.fieldName] }
    }
    let headerColumns = _.map(nestedColumns.columns, nestedColumnToHeaderColumn)
    let children = nestedColumns.groupChildren
    while(children) {
      valuePropertyPath = [...valuePropertyPath, children.fieldName]
      headerColumns = [...headerColumns, ..._.map(children.columns, nestedColumnToHeaderColumn)]
      children = children.groupChildren
    }

    assert.deepEqual(headerColumns, [{
      fieldName: 'siteName',
      fieldPath: ['siteName'],
      headerText: 'Site Name'
    }, {
      fieldName: 'countryName',
      fieldPath: ['countryName'],
      headerText: 'Country'
    }, {
      fieldName: 'stateName',
      fieldPath: ['stateName'],
      headerText: 'State'
    }, {
      fieldName: 'lgaName',
      fieldPath: ['lgaName'],
      headerText: 'County'
    }, {
      fieldName: 'consumableName',
      fieldPath: ['consumables', 'consumableName'],
      headerText: 'Consumable Name'
    }, {
      fieldName: 'manufacturer',
      fieldPath: ['consumables', 'manufacturer'],
      headerText: 'Manufacturer'
    }, {
      fieldName: 'unitShortName',
      fieldPath: ['consumables', 'unitShortName'],
      headerText: 'Unit'
    }, {
      fieldName: 'quantityOnHand',
      fieldPath: ['consumables', 'inventoryItems', 'quantityOnHand'],
      headerText: 'Quantity on Hand'
    }, {
      fieldName: 'expiresOn',
      fieldPath: ['consumables', 'inventoryItems', 'expiresOn'],
      headerText: 'Expires On',
      format: formatExpiresOn
    }])
  })
})
