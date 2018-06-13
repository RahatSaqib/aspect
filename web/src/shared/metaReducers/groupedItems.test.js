import _ from 'lodash'
import { Items, receiveList } from './groupedItems'

describe('Grouped Items Reducer', () => {
  describe('When the Data Is Deep', () => {
    it('should flatten the nested structure', () => {
      const initialState = new Items()
      const newState = receiveList(
        initialState,
        ['consumables', 'inventoryItems'],
        nestedData
      )
      expect(
        _.omit(
          newState.getIn(['byId', 76]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
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
      })
      expect(
        _.omit(
          newState.getIn(['byId', 75]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 38,
        siteName: 'Cuyahoga County Ohio #1',
        countryId: 3,
        countryName: 'United States',
        stateId: 67,
        stateName: 'Ohio',
        lgaId: 13,
        lgaName: 'Cuyahoga',
        consumableId: 2,
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        id: 75,
        expiresOn: '2016-06-23T19:26:29.000Z',
        quantityOnHand: 34,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 79]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 38,
        siteName: 'Cuyahoga County Ohio #1',
        countryId: 3,
        countryName: 'United States',
        stateId: 67,
        stateName: 'Ohio',
        lgaId: 13,
        lgaName: 'Cuyahoga',
        consumableId: 2,
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        id: 79,
        expiresOn: '2016-12-15T00:00:00.000Z',
        quantityOnHand: 18,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 78]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
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
      })
      expect(
        _.omit(
          newState.getIn(['byId', 77]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 39,
        siteName: 'Cuyahoga County Ohio #2',
        countryId: 3,
        countryName: 'United States',
        stateId: 67,
        stateName: 'Ohio',
        lgaId: 13,
        lgaName: 'Cuyahoga',
        consumableId: 2,
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        id: 77,
        expiresOn: '2017-02-27T09:17:09.000Z',
        quantityOnHand: 225,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 63]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
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
      })
      expect(
        _.omit(
          newState.getIn(['byId', 61]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
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
        id: 61,
        expiresOn: '2017-04-31T00:33:37.000Z',
        quantityOnHand: 13,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 44]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
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
      })
      expect(
        _.omit(
          newState.getIn(['byId', 45]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
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
        id: 45,
        expiresOn: null,
        quantityOnHand: 16,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 43]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 22,
        siteName: 'Suffolk County Massachusetts #3',
        countryId: 3,
        countryName: 'United States',
        stateId: 52,
        stateName: 'Massachusetts',
        lgaId: 7,
        lgaName: 'Suffolk',
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        consumableId: 2,
        id: 43,
        expiresOn: '2017-03-23T14:21:28.000Z',
        quantityOnHand: 76,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 46]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 22,
        siteName: 'Suffolk County Massachusetts #3',
        countryId: 3,
        countryName: 'United States',
        stateId: 52,
        stateName: 'Massachusetts',
        lgaId: 7,
        lgaName: 'Suffolk',
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        consumableId: 2,
        id: 46,
        expiresOn: '2017-05-01T00:00:00.000Z',
        quantityOnHand: 76,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 47]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 22,
        siteName: 'Suffolk County Massachusetts #3',
        countryId: 3,
        countryName: 'United States',
        stateId: 52,
        stateName: 'Massachusetts',
        lgaId: 7,
        lgaName: 'Suffolk',
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        consumableId: 2,
        id: 47,
        expiresOn: '2017-04-21T00:00:00.000Z',
        quantityOnHand: 76,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 35]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 16,
        siteName: 'Franklin County Massachusetts #1',
        countryId: 3,
        stateId: 52,
        lgaId: 6,
        countryName: 'United States',
        stateName: 'Massachusetts',
        lgaName: 'Franklin',
        consumableId: 2,
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        id: 35,
        expiresOn: '2017-08-18T22:00:00.000Z',
        quantityOnHand: 931,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 36]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 16,
        siteName: 'Franklin County Massachusetts #1',
        countryId: 3,
        stateId: 52,
        lgaId: 6,
        countryName: 'United States',
        stateName: 'Massachusetts',
        lgaName: 'Franklin',
        consumableId: 2,
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        id: 36,
        expiresOn: '2017-03-14T22:00:00.000Z',
        quantityOnHand: 693,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 39]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 16,
        siteName: 'Franklin County Massachusetts #1',
        countryId: 3,
        stateId: 52,
        lgaId: 6,
        countryName: 'United States',
        stateName: 'Massachusetts',
        lgaName: 'Franklin',
        consumableId: 1,
        consumableName: 'Gloves',
        manufacturer: 'ABC Company',
        unitShortName: 'pc',
        id: 39,
        expiresOn: null,
        quantityOnHand: 930,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 38]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 16,
        siteName: 'Franklin County Massachusetts #1',
        countryId: 3,
        stateId: 52,
        lgaId: 6,
        countryName: 'United States',
        stateName: 'Massachusetts',
        lgaName: 'Franklin',
        consumableId: 1,
        consumableName: 'Gloves',
        manufacturer: 'ABC Company',
        unitShortName: 'pc',
        id: 38,
        expiresOn: null,
        quantityOnHand: 92,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 37]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 16,
        siteName: 'Franklin County Massachusetts #1',
        countryId: 3,
        stateId: 52,
        lgaId: 6,
        countryName: 'United States',
        stateName: 'Massachusetts',
        lgaName: 'Franklin',
        consumableId: 3,
        consumableName: 'GeneXpert Ebola Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        id: 37,
        expiresOn: '2016-08-19T22:00:00.000Z',
        quantityOnHand: 102,
      })
    })

    it('should generate rowSpans for each field based the nested structure', () => {
      const initialState = new Items()
      const newState = receiveList(
        initialState,
        ['consumables', 'inventoryItems'],
        nestedData
      )
      expect(newState.getIn(['byId', 76, 'rowSpans']).toJS()).toEqual({
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
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 75, 'rowSpans']).toJS()).toEqual({
        siteId: 3,
        siteName: 3,
        countryId: 3,
        countryName: 3,
        stateId: 3,
        stateName: 3,
        lgaId: 3,
        lgaName: 3,
        consumableId: 2,
        consumableName: 2,
        manufacturer: 2,
        unitShortName: 2,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 79, 'rowSpans']).toJS()).toEqual({
        siteId: 3,
        siteName: 3,
        countryId: 3,
        countryName: 3,
        stateId: 3,
        stateName: 3,
        lgaId: 3,
        lgaName: 3,
        consumableId: 2,
        consumableName: 2,
        manufacturer: 2,
        unitShortName: 2,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 78, 'rowSpans']).toJS()).toEqual({
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
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 77, 'rowSpans']).toJS()).toEqual({
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
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 63, 'rowSpans']).toJS()).toEqual({
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
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 61, 'rowSpans']).toJS()).toEqual({
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
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 44, 'rowSpans']).toJS()).toEqual({
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
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 45, 'rowSpans']).toJS()).toEqual({
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
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 43, 'rowSpans']).toJS()).toEqual({
        siteId: 5,
        siteName: 5,
        countryId: 5,
        countryName: 5,
        stateId: 5,
        stateName: 5,
        lgaId: 5,
        lgaName: 5,
        consumableId: 3,
        consumableName: 3,
        manufacturer: 3,
        unitShortName: 3,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 46, 'rowSpans']).toJS()).toEqual({
        siteId: 5,
        siteName: 5,
        countryId: 5,
        countryName: 5,
        stateId: 5,
        stateName: 5,
        lgaId: 5,
        lgaName: 5,
        consumableId: 3,
        consumableName: 3,
        manufacturer: 3,
        unitShortName: 3,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 47, 'rowSpans']).toJS()).toEqual({
        siteId: 5,
        siteName: 5,
        countryId: 5,
        countryName: 5,
        stateId: 5,
        stateName: 5,
        lgaId: 5,
        lgaName: 5,
        consumableId: 3,
        consumableName: 3,
        manufacturer: 3,
        unitShortName: 3,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 35, 'rowSpans']).toJS()).toEqual({
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
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 36, 'rowSpans']).toJS()).toEqual({
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
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 39, 'rowSpans']).toJS()).toEqual({
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
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 38, 'rowSpans']).toJS()).toEqual({
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
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 37, 'rowSpans']).toJS()).toEqual({
        siteId: 5,
        siteName: 5,
        countryId: 5,
        countryName: 5,
        stateId: 5,
        stateName: 5,
        lgaId: 5,
        lgaName: 5,
        consumableId: 1,
        consumableName: 1,
        manufacturer: 1,
        unitShortName: 1,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
    })

    it('should generate visibleProperties for each field based the nested structure', () => {
      const initialState = new Items()
      const newState = receiveList(
        initialState,
        ['consumables', 'inventoryItems'],
        nestedData
      )
      expect(
        newState
          .getIn(['byId', 76, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'countryId',
        'countryName',
        'expiresOn',
        'id',
        'lgaId',
        'lgaName',
        'manufacturer',
        'quantityOnHand',
        'siteId',
        'siteName',
        'stateId',
        'stateName',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 75, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'expiresOn',
        'id',
        'manufacturer',
        'quantityOnHand',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 79, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 78, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'countryId',
        'countryName',
        'expiresOn',
        'id',
        'lgaId',
        'lgaName',
        'manufacturer',
        'quantityOnHand',
        'siteId',
        'siteName',
        'stateId',
        'stateName',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 77, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'expiresOn',
        'id',
        'manufacturer',
        'quantityOnHand',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 63, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'countryId',
        'countryName',
        'expiresOn',
        'id',
        'lgaId',
        'lgaName',
        'manufacturer',
        'quantityOnHand',
        'siteId',
        'siteName',
        'stateId',
        'stateName',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 61, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 44, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'countryId',
        'countryName',
        'expiresOn',
        'id',
        'lgaId',
        'lgaName',
        'manufacturer',
        'quantityOnHand',
        'siteId',
        'siteName',
        'stateId',
        'stateName',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 45, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 43, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'expiresOn',
        'id',
        'manufacturer',
        'quantityOnHand',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 46, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 47, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 35, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'countryId',
        'countryName',
        'expiresOn',
        'id',
        'lgaId',
        'lgaName',
        'manufacturer',
        'quantityOnHand',
        'siteId',
        'siteName',
        'stateId',
        'stateName',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 36, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 39, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'expiresOn',
        'id',
        'manufacturer',
        'quantityOnHand',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 38, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 37, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'expiresOn',
        'id',
        'manufacturer',
        'quantityOnHand',
        'unitShortName',
      ])
    })

    it('should return an item ID list that is in the same order as the deepest child IDs passed into it', () => {
      const idList = _.flattenDeep(
        _.map(nestedData, site =>
          _.map(site.consumables, consumable =>
            _.map(consumable.inventoryItems, 'id')
          )
        )
      )
      const initialState = new Items()
      const newState = receiveList(
        initialState,
        ['consumables', 'inventoryItems'],
        nestedData
      )

      expect(newState.get('currentIdList').toJS()).toEqual(idList)
    })

    it('should not keep stale column visibility state when a new list is received', () => {
      const initialState = new Items()
      const nextState = receiveList(
        initialState,
        ['consumables', 'inventoryItems'],
        nestedData
      )
      const dataSortedByQuantity = _.map(nestedData, site => {
        const siteWithConsumblesWithSortedItems = {
          ...site,
          consumables: _.map(site.consumables, consumable => {
            const consumableWithSortedItems = {
              ...consumable,
              inventoryItems: _.sortBy(
                consumable.inventoryItems,
                'quantityOnHand'
              ),
            }
            return consumableWithSortedItems
          }),
        }
        return siteWithConsumblesWithSortedItems
      })
      const newState = receiveList(
        nextState,
        ['consumables', 'inventoryItems'],
        dataSortedByQuantity
      )

      expect(
        newState
          .getIn(['byId', 75, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 79, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'expiresOn',
        'id',
        'manufacturer',
        'quantityOnHand',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 63, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 61, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'countryId',
        'countryName',
        'expiresOn',
        'id',
        'lgaId',
        'lgaName',
        'manufacturer',
        'quantityOnHand',
        'siteId',
        'siteName',
        'stateId',
        'stateName',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 44, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 45, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'countryId',
        'countryName',
        'expiresOn',
        'id',
        'lgaId',
        'lgaName',
        'manufacturer',
        'quantityOnHand',
        'siteId',
        'siteName',
        'stateId',
        'stateName',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 35, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 36, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'countryId',
        'countryName',
        'expiresOn',
        'id',
        'lgaId',
        'lgaName',
        'manufacturer',
        'quantityOnHand',
        'siteId',
        'siteName',
        'stateId',
        'stateName',
        'unitShortName',
      ])
      expect(
        newState
          .getIn(['byId', 39, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(['expiresOn', 'id', 'quantityOnHand'])
      expect(
        newState
          .getIn(['byId', 38, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual([
        'consumableId',
        'consumableName',
        'expiresOn',
        'id',
        'manufacturer',
        'quantityOnHand',
        'unitShortName',
      ])
    })

    const nestedData = [
      {
        siteId: 38,
        siteName: 'Cuyahoga County Ohio #1',
        countryId: 3,
        stateId: 67,
        lgaId: 13,
        countryName: 'United States',
        stateName: 'Ohio',
        lgaName: 'Cuyahoga',
        consumables: [
          {
            consumableId: 1,
            consumableName: 'Gloves',
            manufacturer: 'ABC Company',
            unitShortName: 'pc',
            inventoryItems: [
              {
                id: 76,
                expiresOn: null,
                quantityOnHand: 53,
              },
            ],
          },
          {
            consumableName: 'GeneXpert TB Cartridge',
            manufacturer: 'Cepheid',
            unitShortName: 'pc',
            consumableId: 2,
            inventoryItems: [
              {
                id: 75,
                expiresOn: '2016-06-23T19:26:29.000Z',
                quantityOnHand: 34,
              },
              {
                id: 79,
                expiresOn: '2016-12-15T00:00:00.000Z',
                quantityOnHand: 18,
              },
            ],
          },
        ],
      },
      {
        siteId: 39,
        siteName: 'Cuyahoga County Ohio #2',
        countryId: 3,
        stateId: 67,
        lgaId: 13,
        countryName: 'United States',
        stateName: 'Ohio',
        lgaName: 'Cuyahoga',
        consumables: [
          {
            consumableName: 'Gloves',
            manufacturer: 'ABC Company',
            unitShortName: 'pc',
            consumableId: 1,
            inventoryItems: [
              {
                id: 78,
                expiresOn: null,
                quantityOnHand: 8,
              },
            ],
          },
          {
            consumableName: 'GeneXpert TB Cartridge',
            manufacturer: 'Cepheid',
            unitShortName: 'pc',
            consumableId: 2,
            inventoryItems: [
              {
                id: 77,
                expiresOn: '2017-02-27T09:17:09.000Z',
                quantityOnHand: 225,
              },
            ],
          },
        ],
      },
      {
        siteId: 32,
        siteName: 'Wayne County Nebraska #2',
        countryId: 3,
        stateId: 60,
        lgaId: 11,
        countryName: 'United States',
        stateName: 'Nebraska',
        lgaName: 'Wayne',
        consumables: [
          {
            consumableName: 'GeneXpert TB Cartridge',
            manufacturer: 'Cepheid',
            unitShortName: 'pc',
            consumableId: 2,
            inventoryItems: [
              {
                id: 63,
                expiresOn: '2016-03-31T00:33:37.000Z',
                quantityOnHand: 860,
              },
              {
                id: 61,
                expiresOn: '2017-04-31T00:33:37.000Z',
                quantityOnHand: 13,
              },
            ],
          },
        ],
      },
      {
        siteId: 22,
        siteName: 'Suffolk County Massachusetts #3',
        countryId: 3,
        stateId: 52,
        lgaId: 7,
        countryName: 'United States',
        stateName: 'Massachusetts',
        lgaName: 'Suffolk',
        consumables: [
          {
            consumableName: 'Gloves',
            manufacturer: 'XYZ Company',
            unitShortName: 'pc',
            consumableId: 3,
            inventoryItems: [
              {
                id: 44,
                expiresOn: null,
                quantityOnHand: 24,
              },
              {
                id: 45,
                expiresOn: null,
                quantityOnHand: 16,
              },
            ],
          },
          {
            consumableName: 'GeneXpert TB Cartridge',
            manufacturer: 'Cepheid',
            unitShortName: 'pc',
            consumableId: 2,
            inventoryItems: [
              {
                id: 43,
                expiresOn: '2017-03-23T14:21:28.000Z',
                quantityOnHand: 76,
              },
              {
                id: 46,
                expiresOn: '2017-05-01T00:00:00.000Z',
                quantityOnHand: 76,
              },
              {
                id: 47,
                expiresOn: '2017-04-21T00:00:00.000Z',
                quantityOnHand: 76,
              },
            ],
          },
        ],
      },
      {
        siteId: 16,
        siteName: 'Franklin County Massachusetts #1',
        countryId: 3,
        stateId: 52,
        lgaId: 6,
        countryName: 'United States',
        stateName: 'Massachusetts',
        lgaName: 'Franklin',
        consumables: [
          {
            consumableId: 2,
            consumableName: 'GeneXpert TB Cartridge',
            manufacturer: 'Cepheid',
            unitShortName: 'pc',
            inventoryItems: [
              {
                id: 35,
                expiresOn: '2017-08-18T22:00:00.000Z',
                quantityOnHand: 931,
              },
              {
                id: 36,
                expiresOn: '2017-03-14T22:00:00.000Z',
                quantityOnHand: 693,
              },
            ],
          },
          {
            consumableId: 1,
            consumableName: 'Gloves',
            manufacturer: 'ABC Company',
            unitShortName: 'pc',
            inventoryItems: [
              {
                id: 39,
                expiresOn: null,
                quantityOnHand: 930,
              },
              {
                id: 38,
                expiresOn: null,
                quantityOnHand: 92,
              },
            ],
          },
          {
            consumableId: 3,
            consumableName: 'GeneXpert Ebola Cartridge',
            manufacturer: 'Cepheid',
            unitShortName: 'pc',
            inventoryItems: [
              {
                id: 37,
                expiresOn: '2016-08-19T22:00:00.000Z',
                quantityOnHand: 102,
              },
            ],
          },
        ],
      },
    ]
  })

  describe('When the Data Already Flat', () => {
    it('should return the same data', () => {
      const initialState = new Items()
      const newState = receiveList(initialState, [], flatData)
      expect(
        _.omit(
          newState.getIn(['byId', 76]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
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
      })
      expect(
        _.omit(
          newState.getIn(['byId', 75]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 38,
        siteName: 'Cuyahoga County Ohio #1',
        countryId: 3,
        countryName: 'United States',
        stateId: 67,
        stateName: 'Ohio',
        lgaId: 13,
        lgaName: 'Cuyahoga',
        consumableId: 2,
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        id: 75,
        expiresOn: '2016-06-23T19:26:29.000Z',
        quantityOnHand: 34,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 79]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 38,
        siteName: 'Cuyahoga County Ohio #1',
        countryId: 3,
        countryName: 'United States',
        stateId: 67,
        stateName: 'Ohio',
        lgaId: 13,
        lgaName: 'Cuyahoga',
        consumableId: 2,
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        id: 79,
        expiresOn: '2016-12-15T00:00:00.000Z',
        quantityOnHand: 18,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 78]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
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
      })
      expect(
        _.omit(
          newState.getIn(['byId', 77]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
        siteId: 39,
        siteName: 'Cuyahoga County Ohio #2',
        countryId: 3,
        countryName: 'United States',
        stateId: 67,
        stateName: 'Ohio',
        lgaId: 13,
        lgaName: 'Cuyahoga',
        consumableId: 2,
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        id: 77,
        expiresOn: '2017-02-27T09:17:09.000Z',
        quantityOnHand: 225,
      })
      expect(
        _.omit(
          newState.getIn(['byId', 63]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
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
      })
      expect(
        _.omit(
          newState.getIn(['byId', 61]).toJS(),
          'rowSpans',
          'visibleProperties'
        )
      ).toEqual({
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
        id: 61,
        expiresOn: '2017-04-31T00:33:37.000Z',
        quantityOnHand: 13,
      })
    })

    it('should create rowSpans of 1', () => {
      const initialState = new Items()
      const newState = receiveList(initialState, [], flatData)
      expect(newState.getIn(['byId', 76, 'rowSpans']).toJS()).toEqual({
        siteId: 1,
        siteName: 1,
        countryId: 1,
        countryName: 1,
        stateId: 1,
        stateName: 1,
        lgaId: 1,
        lgaName: 1,
        consumableId: 1,
        consumableName: 1,
        manufacturer: 1,
        unitShortName: 1,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 75, 'rowSpans']).toJS()).toEqual({
        siteId: 1,
        siteName: 1,
        countryId: 1,
        countryName: 1,
        stateId: 1,
        stateName: 1,
        lgaId: 1,
        lgaName: 1,
        consumableId: 1,
        consumableName: 1,
        manufacturer: 1,
        unitShortName: 1,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 79, 'rowSpans']).toJS()).toEqual({
        siteId: 1,
        siteName: 1,
        countryId: 1,
        countryName: 1,
        stateId: 1,
        stateName: 1,
        lgaId: 1,
        lgaName: 1,
        consumableId: 1,
        consumableName: 1,
        manufacturer: 1,
        unitShortName: 1,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 78, 'rowSpans']).toJS()).toEqual({
        siteId: 1,
        siteName: 1,
        countryId: 1,
        countryName: 1,
        stateId: 1,
        stateName: 1,
        lgaId: 1,
        lgaName: 1,
        consumableId: 1,
        consumableName: 1,
        manufacturer: 1,
        unitShortName: 1,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 77, 'rowSpans']).toJS()).toEqual({
        siteId: 1,
        siteName: 1,
        countryId: 1,
        countryName: 1,
        stateId: 1,
        stateName: 1,
        lgaId: 1,
        lgaName: 1,
        consumableId: 1,
        consumableName: 1,
        manufacturer: 1,
        unitShortName: 1,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 63, 'rowSpans']).toJS()).toEqual({
        siteId: 1,
        siteName: 1,
        countryId: 1,
        countryName: 1,
        stateId: 1,
        stateName: 1,
        lgaId: 1,
        lgaName: 1,
        consumableId: 1,
        consumableName: 1,
        manufacturer: 1,
        unitShortName: 1,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
      expect(newState.getIn(['byId', 61, 'rowSpans']).toJS()).toEqual({
        siteId: 1,
        siteName: 1,
        countryId: 1,
        countryName: 1,
        stateId: 1,
        stateName: 1,
        lgaId: 1,
        lgaName: 1,
        consumableId: 1,
        consumableName: 1,
        manufacturer: 1,
        unitShortName: 1,
        id: 1,
        expiresOn: 1,
        quantityOnHand: 1,
      })
    })

    it('should generate visibleProperties for each field', () => {
      const initialState = new Items()
      const newState = receiveList(initialState, [], flatData)
      const allProperties = Object.keys(flatData[0])
      expect(
        newState
          .getIn(['byId', 76, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(allProperties.sort())
      expect(
        newState
          .getIn(['byId', 75, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(allProperties.sort())
      expect(
        newState
          .getIn(['byId', 79, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(allProperties.sort())
      expect(
        newState
          .getIn(['byId', 78, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(allProperties.sort())
      expect(
        newState
          .getIn(['byId', 77, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(allProperties.sort())
      expect(
        newState
          .getIn(['byId', 63, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(allProperties.sort())
      expect(
        newState
          .getIn(['byId', 61, 'visibleProperties'])
          .toJS()
          .sort()
      ).toEqual(allProperties.sort())
    })

    const flatData = [
      {
        siteId: 38,
        siteName: 'Cuyahoga County Ohio #1',
        countryId: 3,
        stateId: 67,
        lgaId: 13,
        countryName: 'United States',
        stateName: 'Ohio',
        lgaName: 'Cuyahoga',
        consumableId: 1,
        consumableName: 'Gloves',
        manufacturer: 'ABC Company',
        unitShortName: 'pc',
        id: 76,
        expiresOn: null,
        quantityOnHand: 53,
      },
      {
        siteId: 38,
        siteName: 'Cuyahoga County Ohio #1',
        countryId: 3,
        stateId: 67,
        lgaId: 13,
        countryName: 'United States',
        stateName: 'Ohio',
        lgaName: 'Cuyahoga',
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        consumableId: 2,
        id: 75,
        expiresOn: '2016-06-23T19:26:29.000Z',
        quantityOnHand: 34,
      },
      {
        siteId: 38,
        siteName: 'Cuyahoga County Ohio #1',
        countryId: 3,
        stateId: 67,
        lgaId: 13,
        countryName: 'United States',
        stateName: 'Ohio',
        lgaName: 'Cuyahoga',
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        consumableId: 2,
        id: 79,
        expiresOn: '2016-12-15T00:00:00.000Z',
        quantityOnHand: 18,
      },
      {
        siteId: 39,
        siteName: 'Cuyahoga County Ohio #2',
        countryId: 3,
        stateId: 67,
        lgaId: 13,
        countryName: 'United States',
        stateName: 'Ohio',
        lgaName: 'Cuyahoga',
        consumableName: 'Gloves',
        manufacturer: 'ABC Company',
        unitShortName: 'pc',
        consumableId: 1,
        id: 78,
        expiresOn: null,
        quantityOnHand: 8,
      },
      {
        siteId: 39,
        siteName: 'Cuyahoga County Ohio #2',
        countryId: 3,
        stateId: 67,
        lgaId: 13,
        countryName: 'United States',
        stateName: 'Ohio',
        lgaName: 'Cuyahoga',
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        consumableId: 2,
        id: 77,
        expiresOn: '2017-02-27T09:17:09.000Z',
        quantityOnHand: 225,
      },
      {
        siteId: 32,
        siteName: 'Wayne County Nebraska #2',
        countryId: 3,
        stateId: 60,
        lgaId: 11,
        countryName: 'United States',
        stateName: 'Nebraska',
        lgaName: 'Wayne',
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        consumableId: 2,
        id: 63,
        expiresOn: '2016-03-31T00:33:37.000Z',
        quantityOnHand: 860,
      },
      {
        siteId: 32,
        siteName: 'Wayne County Nebraska #2',
        countryId: 3,
        stateId: 60,
        lgaId: 11,
        countryName: 'United States',
        stateName: 'Nebraska',
        lgaName: 'Wayne',
        consumableName: 'GeneXpert TB Cartridge',
        manufacturer: 'Cepheid',
        unitShortName: 'pc',
        consumableId: 2,
        id: 61,
        expiresOn: '2017-04-31T00:33:37.000Z',
        quantityOnHand: 13,
      },
    ]
  })
})
