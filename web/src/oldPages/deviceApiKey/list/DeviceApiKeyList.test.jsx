import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import AspectExportListButton from '../../../components/AspectExportListButton'
import { makeItems } from '../../../utils/metaReducers/items'
import { makeTable } from '../../../utils/metaReducers/table'

jest.mock('@mui/material/Checkbox', () => 'StubCheckbox')

describe('Device Api Key List module', () => {
  const { DeviceApiKeyList } = require('./DeviceApiKeyList')

  describe('DeviceApiKeyList component', () => {
    let props
    const now = Date.now()

    beforeEach(() => {
      props = {
        intl: {
          formatMessage: message => message.defaultMessage,
          formatDate: date => JSON.stringify(date),
          formatTime: time => JSON.stringify(time),
          formatRelative: value => JSON.stringify(value),
          formatNumber: value => JSON.stringify(value),
          formatPlural: value => JSON.stringify(value),
          formatHTMLMessage: value => JSON.stringify(value),
          now: () => now,
        },
        navigate: () => {},
        location: {
          search: '',
        },
        table: makeTable(),
        items: makeItems(),
        // --- injected by recompose ---
        sortCol: 'createdOn',
        sortDir: 'asc',
        pageAt: 0,
        pageSize: 10,
        onExportClick: () => {},
        onHeadColumnClick: () => {},
        selectableIds: Immutable.List(),
        dialogState: {
          generatorValues: {
            count: 1,
          },
          assignerValues: {
            deviceApiKeyIds: [],
          },
          isGeneratorDialogOpen: false,
          isAssignerDialogOpen: false,
        },
        onOpenGeneratorDialog: () => {},
        onCloseGeneratorDialog: () => {},
        onOpenAssignerDialog: () => {},
        onCloseAssignerDialog: () => {},
        onGeneratorFormChange: () => {},
        onGenerate: () => {},
        onAssignerFormChange: () => {},
        onAssign: () => {},
        onSelectAllChange: () => {},
        onSelectedChange: () => {},
        onRevokedChange: () => {},
      }
    })

    it('should shallow render correctly', () => {
      const element = shallow(<DeviceApiKeyList {...props} />)

      expect(element).toMatchSnapshot()
      expect(element.find(AspectExportListButton)).toHaveLength(1)
    })

    it('should shallow render with items correctly', () => {
      const element = shallow(
        <DeviceApiKeyList
          {...props}
          table={makeTable({ total: 1 })}
          items={makeItems({
            currentIdList: ['1'],
            byId: {
              1: {
                id: '1',
                createdOn: new Date(now),
                token: 'token',
                partner: 'partner',
                country: 'country',
                site: 'site',
                device: 'device',
                revoked: false,
              },
            },
          })}
        />
      )

      expect(element).toMatchSnapshot()
    })
  })
})
