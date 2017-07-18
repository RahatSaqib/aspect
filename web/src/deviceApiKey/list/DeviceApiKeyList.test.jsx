import Immutable from 'immutable'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { makeItems } from '../../shared/metaReducers/items'
import { makeTable } from '../../shared/metaReducers/table'

jest.mock('material-ui/Checkbox', () => 'StubCheckbox')

describe('Device Api Key List module', () => {
  const { DeviceApiKeyList } = require('./DeviceApiKeyList')

  describe('DeviceApiKeyList component', () => {
    const renderer = ReactShallowRenderer.createRenderer()
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
        history: {
          push: () => {},
        },
        location: {
          search: '',
        },
        table: makeTable(),
        items: makeItems(),
        // --- injected by recompose ---
        onExportClick: () => {},
        onHeadColumnClick: () => {},
        onPageChange: () => {},
        onPageSizeChange: () => {},
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
      const element = renderer.render(<DeviceApiKeyList {...props} />)

      expect(element).toMatchSnapshot()
    })

    it('should shallow render with items correctly', () => {
      const element = renderer.render(
        <DeviceApiKeyList
          {...props}
          table={makeTable({ total: 1 })}
          items={makeItems({
            currentIdList: ['1'],
            byId: {
              1: {
                id: '1',
                createdOn: now,
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
