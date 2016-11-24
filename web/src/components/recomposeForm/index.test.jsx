import { assert } from 'chai'
import sinon from 'sinon'
import React from 'react'
import { shallow } from 'enzyme'
import recomposeForm from './index'

describe('recomposeForm module', () => {
  describe('recomposeForm HOC', () => {
    const initialValues = { name: '', email: '' }
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
        <DecoratedComponent values={initialValues} />
      )

      assert.equal(ComponentWrapper.find('div').length, 1)
    })

    it('should pass in form state from props', () => {
      let innerProps
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate
      })((props) => {
        innerProps = props
        return <div />
      })
      const ComponentWrapper = shallow(
        <DecoratedComponent values={initialValues} />
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
      })((props) => {
        innerProps = props
        return <div />
      })
      const ComponentWrapper = shallow(
        <DecoratedComponent values={initialValues} />
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
      })((props) => {
        innerProps = props
        return <div />
      })
      const ComponentWrapper = shallow(
        <DecoratedComponent values={initialValues} />
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
        })((props) => {
          innerProps = props
          return <div />
        })
        const ComponentWrapper = shallow(
          <DecoratedComponent
            values={initialValues}
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
        })((props) => {
          innerProps = props
          return <div />
        })
        const ComponentWrapper = shallow(
          <DecoratedComponent
            values={initialValues}
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

    it('should pass in field handlers from props', () => {
      let innerProps
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate
      })((props) => {
        innerProps = props
        return <div />
      })
      const ComponentWrapper = shallow(
        <DecoratedComponent values={initialValues} />
      )

      assert.equal(ComponentWrapper.find('div').length, 1)
      assert.isFunction(innerProps.onChangeName)
      assert.isFunction(innerProps.onChangeEmail)
    })

    it('should call onChange when fields are changed', () => {
      let innerProps
      const handleChange = sinon.spy()
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate
      })((props) => {
        innerProps = props
        return <div />
      })
      const ComponentWrapper = shallow(
        <DecoratedComponent
          values={initialValues}
          onChange={handleChange}
        />
      )

      assert.equal(ComponentWrapper.find('div').length, 1)
      assert.isFunction(innerProps.onChangeName)
      assert.isFalse(handleChange.called)

      innerProps.onChangeName({
        target: { value: 'Jeremy' }
      })
      assert.isTrue(handleChange.called)
    })

    context('calling onChangeName with valid value', () => {
      it('should update field states from props', () => {
        let innerProps
        const handleChange = values => ComponentWrapper.setProps({ values })
        const DecoratedComponent = recomposeForm({
          fields: ['name', 'email'],
          validate(values) {
            const errors = {}
            if (!values.name) {
              errors.name = 'Required'
            }
            return errors
          }
        })((props) => {
          innerProps = props
          return <div />
        })
        const ComponentWrapper = shallow(
          <DecoratedComponent
            values={initialValues}
            onChange={handleChange}
          />
        )

        assert.equal(ComponentWrapper.find('div').length, 1)
        assert.deepEqual(innerProps.meta.name, {
          touched: false,
          error: null
        })
        assert.isFunction(innerProps.onChangeName)

        innerProps.onChangeName({
          target: { value: 'Jeremy' }
        })
        assert.deepEqual(innerProps.meta.name, {
          touched: true,
          error: null
        })
      })
    })

    context('calling onChangeName with invalid value', () => {
      it('should update field states from props', () => {
        let innerProps
        const handleChange = values => ComponentWrapper.setProps({ values })
        const DecoratedComponent = recomposeForm({
          fields: ['name', 'email'],
          validate(values) {
            const errors = {}
            if (!values.name) {
              errors.name = 'Required'
            }
            return errors
          }
        })((props) => {
          innerProps = props
          return <div />
        })
        const ComponentWrapper = shallow(
          <DecoratedComponent
            values={initialValues}
            onChange={handleChange}
          />
        )

        assert.equal(ComponentWrapper.find('div').length, 1)
        assert.deepEqual(innerProps.meta.name, {
          touched: false,
          error: null
        })
        assert.isFunction(innerProps.onChangeName)

        innerProps.onChangeName({
          target: { value: '' }
        })
        assert.deepEqual(innerProps.meta.name, {
          touched: true,
          error: 'Required'
        })
      })
    })
  })
})
