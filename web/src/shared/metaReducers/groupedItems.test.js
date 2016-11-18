import { assert } from 'chai'
import { Items, receiveList } from './groupedItems'

describe('Grouped Items Reducer', () => {
  it('should generate a nested list of objects from the list of bottom level objects in the nested structure', () => {
    const initialState = new Items()
    const newState = receiveList(initialState, ['consumables', 'inventoryItems'], nestedData)
    assert.deepEqual(newState.getIn(['byId', 76]).toJS(), {
      siteId: 38,
      siteName: 'Cuyahoga County Ohio #1',
      countryId: 3,
      countryName: 'United States',
      stateId: 67,
      stateName: 'Ohio',
      lgaId: 13,
      lgaName: 'Cuyahoga',
      consumableId: 1,
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      id: 76,
      expiresOn: null,
      quantityOnHand: 53,
      rowSpans: {
        siteId: 3,
        siteName: 3,
        countryId: 3,
        countryName: 3,
        stateId: 3,
        stateName: 3,
        lgaId: 3,
        lgaName: 3,
        consumableId: 1,
        consumableName: 1,
        manufacturer: 1,
        unitShortName: 1,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
    assert.deepEqual(newState.getIn(['byId', 75]).toJS(), {
      consumableId: 2,
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      id: 75,
      expiresOn: '2016-06-23T19:26:29.000Z',
      quantityOnHand: 34,
      rowSpans: {
        consumableId: 2,
        consumableName: 2,
        manufacturer: 2,
        unitShortName: 2,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
    assert.deepEqual(newState.getIn(['byId', 79]).toJS(), {
      id: 79,
      expiresOn: '2016-12-15T00:00:00.000Z',
      quantityOnHand: 18,
      rowSpans: {
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
    assert.deepEqual(newState.getIn(['byId', 78]).toJS(), {
      siteId: 39,
      siteName: 'Cuyahoga County Ohio #2',
      countryId: 3,
      countryName: 'United States',
      stateId: 67,
      stateName: 'Ohio',
      lgaId: 13,
      lgaName: 'Cuyahoga',
      consumableId: 1,
      consumableName: 'Gloves',
      manufacturer: 'ABC Company',
      unitShortName: 'pc',
      id: 78,
      expiresOn: null,
      quantityOnHand: 8,
      rowSpans: {
        siteId: 2,
        siteName: 2,
        countryId: 2,
        countryName: 2,
        stateId: 2,
        stateName: 2,
        lgaId: 2,
        lgaName: 2,
        consumableId: 1,
        consumableName: 1,
        manufacturer: 1,
        unitShortName: 1,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
    assert.deepEqual(newState.getIn(['byId', 77]).toJS(), {
      consumableId: 2,
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      id: 77,
      expiresOn: '2017-02-27T09:17:09.000Z',
      quantityOnHand: 225,
      rowSpans: {
        consumableId: 1,
        consumableName: 1,
        manufacturer: 1,
        unitShortName: 1,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
    assert.deepEqual(newState.getIn(['byId', 63]).toJS(), {
      siteId: 32,
      siteName: 'Wayne County Nebraska #2',
      countryId: 3,
      countryName: 'United States',
      stateId: 60,
      stateName: 'Nebraska',
      lgaId: 11,
      lgaName: 'Wayne',
      consumableId: 2,
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      id: 63,
      expiresOn: '2016-03-31T00:33:37.000Z',
      quantityOnHand: 860,
      rowSpans: {
        siteId: 2,
        siteName: 2,
        countryId: 2,
        countryName: 2,
        stateId: 2,
        stateName: 2,
        lgaId: 2,
        lgaName: 2,
        consumableId: 2,
        consumableName: 2,
        manufacturer: 2,
        unitShortName: 2,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
    assert.deepEqual(newState.getIn(['byId', 61]).toJS(), {
      id: 61,
      expiresOn: '2017-04-31T00:33:37.000Z',
      quantityOnHand: 13,
      rowSpans: {
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
    assert.deepEqual(newState.getIn(['byId', 44]).toJS(), {
      siteId: 22,
      siteName: 'Suffolk County Massachusetts #3',
      countryId: 3,
      countryName: 'United States',
      stateId: 52,
      stateName: 'Massachusetts',
      lgaId: 7,
      lgaName: 'Suffolk',
      consumableId: 3,
      consumableName: 'Gloves',
      manufacturer: 'XYZ Company',
      unitShortName: 'pc',
      id: 44,
      expiresOn: null,
      quantityOnHand: 24,
      rowSpans: {
        siteId: 5,
        siteName: 5,
        countryId: 5,
        countryName: 5,
        stateId: 5,
        stateName: 5,
        lgaId: 5,
        lgaName: 5,
        consumableId: 2,
        consumableName: 2,
        manufacturer: 2,
        unitShortName: 2,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
    assert.deepEqual(newState.getIn(['byId', 45]).toJS(), {
      id: 45,
      expiresOn: null,
      quantityOnHand: 16,
      rowSpans: {
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
    assert.deepEqual(newState.getIn(['byId', 43]).toJS(), {
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      id: 43,
      expiresOn: '2017-03-23T14:21:28.000Z',
      quantityOnHand: 76,
      rowSpans: {
        consumableName: 3,
        manufacturer: 3,
        unitShortName: 3,
        consumableId: 3,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
    assert.deepEqual(newState.getIn(['byId', 46]).toJS(), {
      id: 46,
      expiresOn: '2017-05-01T00:00:00.000Z',
      quantityOnHand: 76,
      rowSpans: {
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
    assert.deepEqual(newState.getIn(['byId', 47]).toJS(), {
      id: 47,
      expiresOn: '2017-04-21T00:00:00.000Z',
      quantityOnHand: 76,
      rowSpans: {
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1
      }
    })
  })

  const nestedData = [{
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
    siteId: 32,
    siteName: 'Wayne County Nebraska #2',
    countryId: 3,
    stateId: 60,
    lgaId: 11,
    countryName: 'United States',
    stateName: 'Nebraska',
    lgaName: 'Wayne',
    consumables: [{
      consumableName: 'GeneXpert TB Cartridge',
      manufacturer: 'Cepheid',
      unitShortName: 'pc',
      consumableId: 2,
      inventoryItems: [{
        id: 63,
        expiresOn: '2016-03-31T00:33:37.000Z',
        quantityOnHand: 860
      }, {
        id: 61,
        expiresOn: '2017-04-31T00:33:37.000Z',
        quantityOnHand: 13
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
      manufacturer: 'XYZ Company',
      unitShortName: 'pc',
      consumableId: 3,
      inventoryItems: [{
        id: 44,
        expiresOn: null,
        quantityOnHand: 24
      }, {
        id: 45,
        expiresOn: null,
        quantityOnHand: 16
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
      }, {
        id: 46,
        expiresOn: '2017-05-01T00:00:00.000Z',
        quantityOnHand: 76
      }, {
        id: 47,
        expiresOn: '2017-04-21T00:00:00.000Z',
        quantityOnHand: 76
      }]
    }]
  }]
})
