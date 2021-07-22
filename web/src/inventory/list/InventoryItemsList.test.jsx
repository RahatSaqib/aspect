import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import Immutable from 'immutable'
import { InventoryItemsListWithProps } from './InventoryItemsList'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import ExportListButton from '../../globals/components/ExportListButton'

describe('InventoryItemList module', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
    navigate: () => {},
    location: {
      search: '',
    },
    reducedFilters: null,
    dispatch: () => {},
    groupBySite: true,
    onGroupBySiteChange: () => {},
    isLoading: false,
    onExcelClick: () => {},
    items: new Items(),
    sortCol: 'siteName',
    sortDir: 'asc',
    table: new Table(),
    pageAt: 0,
    pageSize: 10,
    inventoryAdjustment: Immutable.List(),
    onRemoveInventorySubmit: () => {},
    onReceiveInventorySubmit: () => {},
    showTransferInventoryDialog: () => {},
    onAddInventorySubmit: () => {},
  }

  describe('InventoryItemList component', () => {
    it('should render correctly', () => {
      const element = shallow(<InventoryItemsListWithProps {...props} />)
      expect(element).toMatchSnapshot()
      expect(element.find(ExportListButton)).toHaveLength(1)
    })
  })
})
