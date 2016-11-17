import React from 'react'
import { assert } from 'chai'
import _ from 'lodash'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import MenuItem from 'material-ui/MenuItem'
import FlagIcon from './flagIcon/FlagIcon'
import CountrySelect from './CountrySelect'
import ForkedSelectField from '../forkedMaterialUi/ForkedSelectField'

describe('CountrySelect Component', () => {
  let CountrySelectWrapper
  let props

  beforeEach(() => {
    props = {
      value: 'US',
      selectFieldStyle: { verticalAlign: 'bottom', width: '5.5em' },
      selectedItemStyle: { width: '4.5em' },
      underlineStyle: { display: 'none' },
      onChange: sinon.spy(),
      dataSource: [{ id: 'ZA', country: 'Afrique du Sud' },
        { id: 'US', country: 'Etats-Unis d\'Amerique' }],
      dataSourceConfig: {
        countriesJoinOn: 'iso_alpha2_code',
        dataSourceJoinOn: 'id',
        selectedItemTextPredicate: () => 'Expected Selected Item Text',
        menuItemTextPredicate: () => 'Expected List Item Text',
        valuePredicate: country => `${country.id} ${country.country}`
      }
    }
    CountrySelectWrapper = shallow(<CountrySelect {...props} />)
  })

  it('should render a SelectField with with items for each country in the datasource', () => {
    const selectField = CountrySelectWrapper.find(ForkedSelectField)
    assert.deepEqual(selectField.props(), { ...selectField.props(),
      value: props.value,
      style: props.selectFieldStyle,
      underlineStyle: props.underlineStyle,
      autoWidth: true,
      onChange: props.onChange
    })

    assert.equal(selectField.props().children.length, props.dataSource.length)

    _.each(props.dataSource, (country) => {
      const child = selectField.findWhere(
        menuItem => menuItem.type() === MenuItem &&
          menuItem.props().value === props.dataSourceConfig.valuePredicate(country))

      assert.equal(child.length, 1)
      assert.equal(child.props().primaryText, props.dataSourceConfig.menuItemTextPredicate(country))

      const flagIcon = child.props().leftIcon
      assert.equal(flagIcon.type, FlagIcon)
      assert.deepEqual(flagIcon.props.style, { margin: '0.3em 0' })
      assert.equal(flagIcon.props.countryIsoAlpha2Code, country.id)

      const menuItemLabel = child.props().label
      assert.equal(menuItemLabel.type.name, 'MenuItemLabel')
      assert.equal(menuItemLabel.props.country.iso_alpha2_code, country.id)
      assert.equal(menuItemLabel.props.selectedItemStyle, props.selectedItemStyle)
    })
  })

  describe('Selecting one of the countries in the list', () => {
    it('should call the onChange method with the value of the country', () => {
      assert.isOk(props.onChange.notCalled)
      const selectField = CountrySelectWrapper.find(ForkedSelectField)
      const valueToSelect = props.dataSourceConfig.valuePredicate(props.dataSource[0])
      selectField.simulate('change', undefined, undefined, valueToSelect)

      assert.isOk(props.onChange.calledOnce)
      assert.deepEqual(props.onChange.firstCall.args, [undefined, undefined, valueToSelect])
    })
  })

  describe('when no DataSource is specified', () => {
    beforeEach(() => {
      delete props.dataSource
      delete props.dataSourceConfig.dataSourceJoinOn
      CountrySelectWrapper = shallow(<CountrySelect {...props} />)
    })

    it('should render a SelectField with with items for each country built into the CountrySelect component', () => {
      const selectField = CountrySelectWrapper.find(ForkedSelectField)
      assert.isAtLeast(selectField.props().children.length, 242)
    })

    describe('and no DataSource config is specified', () => {
      beforeEach(() => {
        delete props.dataSourceConfig
        CountrySelectWrapper = shallow(<CountrySelect {...props} />)
      })

      it('should render a SelectField with with items for each country', () => {
        const selectField = CountrySelectWrapper.find(ForkedSelectField)
        assert.deepEqual(selectField.props(), { ...selectField.props(),
          value: props.value,
          style: props.selectFieldStyle,
          underlineStyle: props.underlineStyle,
          autoWidth: true,
          onChange: props.onChange
        })

        assert.isAtLeast(selectField.props().children.length, 242)

        _.each(selectField.props().children, (child) => {
          assert.equal(child.type, MenuItem)
          assert.equal(child.props.value.length, 2)
          assert.isOk(child.props.primaryText)

          const flagIcon = child.props.leftIcon
          assert.equal(flagIcon.type, FlagIcon)
          assert.deepEqual(flagIcon.props.style, { margin: '0.3em 0' })
          assert.equal(flagIcon.props.countryIsoAlpha2Code, child.props.value)

          const menuItemLabel = child.props.label
          assert.equal(menuItemLabel.type.name, 'MenuItemLabel')
          assert.equal(menuItemLabel.props.country.iso_alpha2_code, child.props.value)
          assert.equal(menuItemLabel.props.selectedItemStyle, props.selectedItemStyle)
        })
      })
    })
  })
})
