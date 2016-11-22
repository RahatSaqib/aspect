import _ from 'lodash'
import Immutable from 'immutable'
import { assert } from 'chai'
import React from 'react'
import { shallow } from 'enzyme'
import DataTable from './DataTable'

describe('DataTable module', () => {
  describe('DataTable component', () => {
    const defaultProps = {
      selectable: false,
      handleItemIdSelection: _.noop,
      handleFetch: _.noop,
      items: {
        byId: {},
        currentIdList: []
      },
      table: {
        loading: false,
        sortCol: '',
        sortDir: '',
        page: 1,
        pageSize: 10,
        total: 10
      },
      columns: [],
      intl: {
        formatMessages: _.noop
      },
      messages: {}
    }

    context('table.loading is true', () => {
      it('should render progress', () => {
        const props = _.merge({}, defaultProps, {
          table: {
            loading: true
          }
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        assert.equal(ComponentWrapper.find('LinearProgress').length, 1)
      })
    })

    context('table.loading is false', () => {
      it('should not render progress', () => {
        const props = _.merge({}, defaultProps, {
          table: {
            loading: false
          }
        })
        const ComponentWrapper = shallow(<DataTable {...props} />)

        assert.equal(ComponentWrapper.find('LinearProgress').length, 0)
      })
    })
  })
})
