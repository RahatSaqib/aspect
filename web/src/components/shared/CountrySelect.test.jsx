import React from 'react'
import _ from 'lodash'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import MenuItem from 'material-ui/MenuItem'
import FlagIcon from './flagIcon/FlagIcon'
import CountrySelect, {
  MenuItemLabel,
} from './CountrySelect'
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
    expect(selectField.props()).toEqual({ ...selectField.props(),
      value: props.value,
      style: props.selectFieldStyle,
      underlineStyle: props.underlineStyle,
      autoWidth: true,
      onChange: props.onChange
    })

    expect(selectField.props().children.length).toEqual(props.dataSource.length)

    _.each(props.dataSource, (country) => {
      const child = selectField.findWhere(
        menuItem => menuItem.type() === MenuItem &&
          menuItem.props().value === props.dataSourceConfig.valuePredicate(country))

      expect(child.length).toEqual(1)
      expect(child.props().primaryText).toEqual(
        props.dataSourceConfig.menuItemTextPredicate(country)
      )

      const flagIcon = child.props().leftIcon
      expect(flagIcon.type).toEqual(FlagIcon)
      expect(flagIcon.props.style).toEqual({ margin: '0.3em 0' })
      expect(flagIcon.props.countryIsoAlpha2Code).toEqual(country.id)

      const menuItemLabel = child.props().label
      expect(menuItemLabel.type).toEqual(MenuItemLabel)
      expect(menuItemLabel.props.country.iso_alpha2_code).toEqual(country.id)
      expect(menuItemLabel.props.selectedItemStyle).toEqual(props.selectedItemStyle)
    })
  })

  describe('Selecting one of the countries in the list', () => {
    it('should call the onChange method with the value of the country', () => {
      expect(props.onChange.notCalled).toBe(true)
      const selectField = CountrySelectWrapper.find(ForkedSelectField)
      const valueToSelect = props.dataSourceConfig.valuePredicate(props.dataSource[0])
      selectField.simulate('change', undefined, undefined, valueToSelect)

      expect(props.onChange.calledOnce).toBe(true)
      expect(props.onChange.firstCall.args).toEqual([undefined, undefined, valueToSelect])
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
      expect(selectField.props().children.length).toBeGreaterThanOrEqual(242)
    })

    describe('and no DataSource config is specified', () => {
      beforeEach(() => {
        delete props.dataSourceConfig
        CountrySelectWrapper = shallow(<CountrySelect {...props} />)
      })

      it('should render a SelectField with with items for each country', () => {
        const selectField = CountrySelectWrapper.find(ForkedSelectField)
        expect(selectField.props()).toEqual({ ...selectField.props(),
          value: props.value,
          style: props.selectFieldStyle,
          underlineStyle: props.underlineStyle,
          autoWidth: true,
          onChange: props.onChange
        })

        expect(selectField.props().children.length).toBeGreaterThanOrEqual(242)

        _.each(selectField.props().children, (child) => {
          expect(child.type).toEqual(MenuItem)
          expect(child.props.value.length).toEqual(2)
          expect(child.props.primaryText).toBeTruthy()

          const flagIcon = child.props.leftIcon
          expect(flagIcon.type).toEqual(FlagIcon)
          expect(flagIcon.props.style).toEqual({ margin: '0.3em 0' })
          expect(flagIcon.props.countryIsoAlpha2Code).toEqual(child.props.value)

          const menuItemLabel = child.props.label
          expect(menuItemLabel.type).toEqual(MenuItemLabel)
          expect(menuItemLabel.props.country.iso_alpha2_code).toEqual(child.props.value)
          expect(menuItemLabel.props.selectedItemStyle).toEqual(props.selectedItemStyle)
        })
      })
    })
  })
})
