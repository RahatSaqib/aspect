import Immutable from 'immutable'
import { assert } from 'chai'
import React from 'react'
import { shallow } from 'enzyme'
import recomposeForm from './index'

describe('recomposeForm module', () => {
  describe('recomposeForm HOC', () => {
    const values = {name: '', email: ''}
    const validate = () => ({})
    const mockEvent = {
      preventDefault() {},
      stopPropagation() {}
    }

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

    it('should pass in form handlers from props', () => {
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
      assert.isFunction(innerProps.handleSubmit)
    })

    context('passing onSubmit with a function returning a resolved promise', () => {
      it('should update in form state from props', () => {
        let innerProps
        const DecoratedComponent = recomposeForm({
          fields: ['name', 'email'],
          validate
        })(props => {
          innerProps = props
          return <div />
        })
        const ComponentWrapper = shallow(
          <DecoratedComponent
            values={values}
            onSubmit={() => Promise.resolve()}
          />
        )

        assert.equal(ComponentWrapper.find('div').length, 1)
        assert.deepEqual(innerProps.form, {
          pristine: true,
          valid: true,
          submitting: false,
          submitSucceed: false
        })
        assert.isFunction(innerProps.handleSubmit)
        innerProps.handleSubmit(mockEvent)

        assert.deepEqual(innerProps.form, {
          pristine: false,
          valid: true,
          submitting: true,
          submitSucceed: false
        })

        return new Promise(resolve => setTimeout(resolve, 50))
          .then(() => {
            assert.deepEqual(innerProps.form, {
              pristine: true,
              valid: true,
              submitting: false,
              submitSucceed: true
            })
          })
      })
    })


    context('passing onSubmit with a function returning a rejected promise', () => {
      it('should update in form state from props', () => {
        let innerProps
        const DecoratedComponent = recomposeForm({
          fields: ['name', 'email'],
          validate
        })(props => {
          innerProps = props
          return <div />
        })
        const ComponentWrapper = shallow(
          <DecoratedComponent
            values={values}
            onSubmit={() => Promise.reject()}
          />
        )

        assert.equal(ComponentWrapper.find('div').length, 1)
        assert.deepEqual(innerProps.form, {
          pristine: true,
          valid: true,
          submitting: false,
          submitSucceed: false
        })
        assert.isFunction(innerProps.handleSubmit)
        innerProps.handleSubmit(mockEvent)

        assert.deepEqual(innerProps.form, {
          pristine: false,
          valid: true,
          submitting: true,
          submitSucceed: false
        })

        return new Promise(resolve => setTimeout(resolve, 50))
          .then(() => {
            assert.deepEqual(innerProps.form, {
              pristine: false,
              valid: false,
              submitting: false,
              submitSucceed: false
            })
          })
      })
    })
  })
})
