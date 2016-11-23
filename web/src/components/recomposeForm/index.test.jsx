import Immutable from 'immutable'
import { assert } from 'chai'
import React from 'react'
import { shallow } from 'enzyme'
import recomposeForm from './index'

describe('recomposeForm module', () => {
  describe('recomposeForm HOC', () => {
    const values = {name: '', email: ''}
    const validate = () => ({})

    it('should render WrappedComponent', () => {
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate
      })(() => <div />)
      const ComponentWrapper = shallow(
        <DecoratedComponent values={values} />
      )

      assert.equal(ComponentWrapper.find('div').length, 1)
    })

    it('should pass in form state from props', () => {
      let innerProps
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate
      })(props => {
        innerProps = props
        return <div />
      })
      const ComponentWrapper = shallow(
        <DecoratedComponent values={values} />
      )

      assert.equal(ComponentWrapper.find('div').length, 1)
      assert.deepEqual(innerProps.form, {
        pristine: true,
        valid: true,
        submitting: false,
        submitSucceed: false
      })
    })

    it('should pass in field states from props', () => {
      let innerProps
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate
      })(props => {
        innerProps = props
        return <div />
      })
      const ComponentWrapper = shallow(
        <DecoratedComponent values={values} />
      )

      assert.equal(ComponentWrapper.find('div').length, 1)
      assert.deepEqual(innerProps.meta.name, {
        touched: false,
        error: null
      })
      assert.deepEqual(innerProps.meta.email, {
        touched: false,
        error: null
      })
    })
  })
})
