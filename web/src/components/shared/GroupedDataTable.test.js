import { assert } from 'chai'
import _ from 'lodash'
import Immutable from 'immutable'

describe('Grouped Data Table', () => {
  const getHeaderColumns = () => {
    let valuePropertyPath = nestedColumns.fieldName ? [nestedColumns.fieldName] : []
    const nestedColumnToHeaderColumn = column => {
      return {...column, fieldPath: [...valuePropertyPath, column.fieldName],
        canSort: column.canSort === undefined ? true : column.canSort }
    }
    let headerColumns = _.map(nestedColumns.columns, nestedColumnToHeaderColumn)
    let children = nestedColumns.groupChildren
    while(children) {
      valuePropertyPath = [...valuePropertyPath, children.fieldName]
      headerColumns = [...headerColumns, ..._.map(children.columns, nestedColumnToHeaderColumn)]
      children = children.groupChildren
    }
    return headerColumns
  }

  it('should flatten the nested columns', () => {
    const headerColumns = getHeaderColumns()

    assert.deepEqual(headerColumns, [{
      fieldName: 'siteName',
      fieldPath: ['siteName'],
      headerText: 'Site Name',
      canSort: true
    }, {
      fieldName: 'countryName',
      fieldPath: ['countryName'],
      headerText: 'Country',
      canSort: true
    }, {
      fieldName: 'stateName',
      fieldPath: ['stateName'],
      headerText: 'State',
      canSort: true
    }, {
      fieldName: 'lgaName',
      fieldPath: ['lgaName'],
      headerText: 'County',
      canSort: true
    }, {
      fieldName: 'consumableName',
      fieldPath: ['consumables', 'consumableName'],
      headerText: 'Consumable Name',
      canSort: true
    }, {
      fieldName: 'manufacturer',
      fieldPath: ['consumables', 'manufacturer'],
      headerText: 'Manufacturer',
      canSort: true
    }, {
      fieldName: 'unitShortName',
      fieldPath: ['consumables', 'unitShortName'],
      headerText: 'Unit',
      canSort: false
    }, {
      fieldName: 'quantityOnHand',
      fieldPath: ['consumables', 'inventoryItems', 'quantityOnHand'],
      headerText: 'Quantity on Hand',
      canSort: true
    }, {
      fieldName: 'expiresOn',
      fieldPath: ['consumables', 'inventoryItems', 'expiresOn'],
      headerText: 'Expires On',
      canSort: true,
      format: formatExpiresOn
    }])
  })

  it('should flatten the nested data structure', () => {
    const flatData = []

    const jsonNestedData = nestedData.toJS()

    for(let i = 0; i < jsonNestedData.length; i++) {
      for(let ii = 0; ii < jsonNestedData[i].consumables.length; ii++) {
        for(let iii = 0; iii < jsonNestedData[i].consumables[ii].inventoryItems.length; iii++) {
          const site = _.pick(nestedData.getIn([i]).toJS(), [nestedColumns.key, ..._.map(nestedColumns.columns, 'fieldName')])
          const consumable = _.pick(nestedData.getIn([i, 'consumables', ii]).toJS(),
            [nestedColumns.groupChildren.key, ..._.map(nestedColumns.groupChildren.columns, 'fieldName')])
          const inventoryItem = _.pick(nestedData.getIn([i, 'consumables', ii, 'inventoryItems', iii]).toJS(),
            [nestedColumns.groupChildren.groupChildren.key, ..._.map(nestedColumns.groupChildren.groupChildren.columns, 'fieldName')])

          flatData.push({...site, ...consumable, ...inventoryItem})
        }
      }
    }

    //console.log(flatData)
  })

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
        headerText: 'Unit',
        canSort: false
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
  const nestedData = Immutable.fromJS([{
    siteId: 38,
    siteName: 'Cuyahoga County Ohio #1',
    countryId: 3,
    stateId: 67,
    lgaId: 13,
    countryName: 'United States',
    stateName: 'Ohio',
    lgaName: 'Cuyahoga',
    consumables: [{
      consumableId: 1,
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      inventoryItems: [{
        id: 76,
        expiresOn: null,
        quantityOnHand: 53
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 75,
        expiresOn: '2016-06-23T19:26:29.000Z',
        quantityOnHand: 34
      }, {
        id: 79,
        expiresOn: '2016-12-15T00:00:00.000Z',
        quantityOnHand: 18
      }]
    }]
  }, {
    siteId: 39,
    siteName: 'Cuyahoga County Ohio #2',
    countryId: 3,
    stateId: 67,
    lgaId: 13,
    countryName: 'United States',
    stateName: 'Ohio',
    lgaName: 'Cuyahoga',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 78,
        expiresOn: null,
        quantityOnHand: 8
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 77,
        expiresOn: '2017-02-27T09:17:09.000Z',
        quantityOnHand: 225
      }]
    }]
  }, {
    siteId: 16,
    siteName: 'Franklin County Massachusetts #1',
    countryId: 3,
    stateId: 52,
    lgaId: 6,
    countryName: 'United States',
    stateName: 'Massachusetts',
    lgaName: 'Franklin',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 32,
        expiresOn: null,
        quantityOnHand: 22
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 31,
        expiresOn: '2017-03-23T14:58:37.000Z',
        quantityOnHand: 754
      }]
    }]
  }, {
    siteId: 17,
    siteName: 'Franklin County Massachusetts #2',
    countryId: 3,
    stateId: 52,
    lgaId: 6,
    countryName: 'United States',
    stateName: 'Massachusetts',
    lgaName: 'Franklin',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 34,
        expiresOn: null,
        quantityOnHand: 31
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 33,
        expiresOn: '2016-01-06T01:54:18.000Z',
        quantityOnHand: 646
      }]
    }]
  }, {
    siteId: 18,
    siteName: 'Franklin County Massachusetts #3',
    countryId: 3,
    stateId: 52,
    lgaId: 6,
    countryName: 'United States',
    stateName: 'Massachusetts',
    lgaName: 'Franklin',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 36,
        expiresOn: null,
        quantityOnHand: 99
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 35,
        expiresOn: '2017-04-11T15:39:35.000Z',
        quantityOnHand: 310
      }]
    }]
  }, {
    siteId: 19,
    siteName: 'Franklin County Massachusetts #4',
    countryId: 3,
    stateId: 52,
    lgaId: 6,
    countryName: 'United States',
    stateName: 'Massachusetts',
    lgaName: 'Franklin',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 38,
        expiresOn: null,
        quantityOnHand: 89
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 37,
        expiresOn: '2016-07-23T11:42:12.000Z',
        quantityOnHand: 639
      }]
    }]
  }, {
    siteId: 25,
    siteName: 'Gage County Nebraska #1',
    countryId: 3,
    stateId: 60,
    lgaId: 9,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Gage',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 50,
        expiresOn: null,
        quantityOnHand: 44
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 49,
        expiresOn: '2017-09-26T11:34:24.000Z',
        quantityOnHand: 137
      }]
    }]
  }, {
    siteId: 23,
    siteName: 'Hall County Nebraska #1',
    countryId: 3,
    stateId: 60,
    lgaId: 8,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Hall',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 46,
        expiresOn: null,
        quantityOnHand: 32
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 45,
        expiresOn: '2017-01-09T03:56:14.000Z',
        quantityOnHand: 146
      }]
    }]
  }, {
    siteId: 24,
    siteName: 'Hall County Nebraska #2',
    countryId: 3,
    stateId: 60,
    lgaId: 8,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Hall',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 48,
        expiresOn: null,
        quantityOnHand: 75
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 47,
        expiresOn: '2017-06-26T03:04:38.000Z',
        quantityOnHand: 361
      }]
    }]
  }, {
    siteId: 26,
    siteName: 'Lancaster County Nebraska #1',
    countryId: 3,
    stateId: 60,
    lgaId: 10,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Lancaster',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 52,
        expiresOn: null,
        quantityOnHand: 58
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 51,
        expiresOn: '2016-04-19T13:07:06.000Z',
        quantityOnHand: 846
      }]
    }]
  }, {
    siteId: 27,
    siteName: 'Lancaster County Nebraska #2',
    countryId: 3,
    stateId: 60,
    lgaId: 10,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Lancaster',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 54,
        expiresOn: null,
        quantityOnHand: 22
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 53,
        expiresOn: '2016-08-09T15:01:19.000Z',
        quantityOnHand: 929
      }]
    }]
  }, {
    siteId: 28,
    siteName: 'Lancaster County Nebraska #3',
    countryId: 3,
    stateId: 60,
    lgaId: 10,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Lancaster',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 56,
        expiresOn: null,
        quantityOnHand: 51
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 55,
        expiresOn: '2016-08-30T01:56:28.000Z',
        quantityOnHand: 159
      }]
    }]
  }, {
    siteId: 29,
    siteName: 'Lancaster County Nebraska #4',
    countryId: 3,
    stateId: 60,
    lgaId: 10,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Lancaster',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 58,
        expiresOn: null,
        quantityOnHand: 12
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 57,
        expiresOn: '2017-07-02T23:21:52.000Z',
        quantityOnHand: 107
      }]
    }]
  }, {
    siteId: 30,
    siteName: 'Lancaster County Nebraska #5',
    countryId: 3,
    stateId: 60,
    lgaId: 10,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Lancaster',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 60,
        expiresOn: null,
        quantityOnHand: 40
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 59,
        expiresOn: '2016-12-13T10:18:16.000Z',
        quantityOnHand: 211
      }]
    }]
  }, {
    siteId: 20,
    siteName: 'Suffolk County Massachusetts #1',
    countryId: 3,
    stateId: 52,
    lgaId: 7,
    countryName: 'United States',
    stateName: 'Massachusetts',
    lgaName: 'Suffolk',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 40,
        expiresOn: null,
        quantityOnHand: 1
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 39,
        expiresOn: '2016-12-18T00:14:31.000Z',
        quantityOnHand: 527
      }]
    }]
  }, {
    siteId: 21,
    siteName: 'Suffolk County Massachusetts #2',
    countryId: 3,
    stateId: 52,
    lgaId: 7,
    countryName: 'United States',
    stateName: 'Massachusetts',
    lgaName: 'Suffolk',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 42,
        expiresOn: null,
        quantityOnHand: 30
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 41,
        expiresOn: '2016-05-09T15:45:02.000Z',
        quantityOnHand: 289
      }]
    }]
  }, {
    siteId: 22,
    siteName: 'Suffolk County Massachusetts #3',
    countryId: 3,
    stateId: 52,
    lgaId: 7,
    countryName: 'United States',
    stateName: 'Massachusetts',
    lgaName: 'Suffolk',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 44,
        expiresOn: null,
        quantityOnHand: 24
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 43,
        expiresOn: '2017-03-23T14:21:28.000Z',
        quantityOnHand: 76
      }]
    }]
  }, {
    siteId: 31,
    siteName: 'Wayne County Nebraska #1',
    countryId: 3,
    stateId: 60,
    lgaId: 11,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Wayne',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 62,
        expiresOn: null,
        quantityOnHand: 32
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 61,
        expiresOn: '2017-08-23T23:29:45.000Z',
        quantityOnHand: 805
      }]
    }]
  }, {
    siteId: 32,
    siteName: 'Wayne County Nebraska #2',
    countryId: 3,
    stateId: 60,
    lgaId: 11,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Wayne',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 64,
        expiresOn: null,
        quantityOnHand: 14
      }]
    }, {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 63,
        expiresOn: '2016-03-31T00:33:37.000Z',
        quantityOnHand: 860
      }]
    }]
  }, {
    siteId: 33,
    siteName: 'Wayne County Nebraska #3',
    countryId: 3,
    stateId: 60,
    lgaId: 11,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Wayne',
    consumables: [{
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      consumableId: 1,
      inventoryItems: [{
        id: 66,
        expiresOn: null,
        quantityOnHand: 8
      }]
    }, {
      name: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 65,
        expiresOn: '2016-01-05T12:19:21.000Z',
        quantityOnHand: 688
      }]
    }]
  }])
})
