/* eslint-disable no-unused-vars */
import React from 'react'
import ReactTestRenderer from 'react-test-renderer'

describe('recomposeForm module', () => {
  const { default: recomposeForm } = require('./index')

  describe('recomposeForm HOC', () => {
    const initialValues = { name: '', email: '' }
    const validate = () => ({})
    const mockEvent = {
      preventDefault() {},
      stopPropagation() {},
    }

    it('should render WrappedComponent', () => {
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate,
      })(() => <div />)

      const testInstance = ReactTestRenderer.create(
        <DecoratedComponent values={initialValues} />
      )
      expect(testInstance).toMatchSnapshot()
    })

    it('should pass in form state from props', () => {
      let innerProps
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate,
      })(props => {
        innerProps = props
        return <div />
      })

      const testInstance = ReactTestRenderer.create(
        <DecoratedComponent values={initialValues} />
      )
      expect(innerProps.form).toMatchSnapshot()
    })

    it('should pass in field states from props', () => {
      let innerProps
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate,
      })(props => {
        innerProps = props
        return <div />
      })

      const testInstance = ReactTestRenderer.create(
        <DecoratedComponent values={initialValues} />
      )
      expect(innerProps.meta.name).toMatchSnapshot()
      expect(innerProps.meta.email).toMatchSnapshot()
    })

    it('should pass in form handlers from props', () => {
      let innerProps
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate,
      })(props => {
        innerProps = props
        return <div />
      })

      const testInstance = ReactTestRenderer.create(
        <DecoratedComponent values={initialValues} />
      )
      expect(innerProps.handleSubmit).toMatchSnapshot()
    })

    describe('passing onSubmit with a function returning a resolved promise', () => {
      it('should update in form state from props', () => {
        let innerProps
        const DecoratedComponent = recomposeForm({
          fields: ['name', 'email'],
          validate,
        })(props => {
          innerProps = props
          return <div />
        })

        const testInstance = ReactTestRenderer.create(
          <DecoratedComponent
            values={initialValues}
            onSubmit={() => Promise.resolve()}
          />
        )
        expect(innerProps.form).toMatchSnapshot()
        expect(innerProps.handleSubmit).toMatchSnapshot()

        innerProps.handleSubmit(mockEvent)

        expect(innerProps.form).toMatchSnapshot()

        return new Promise(resolve => setTimeout(resolve, 50)).then(() => {
          expect(innerProps.form).toMatchSnapshot()
        })
      })
    })

    describe('passing onSubmit with a function returning a rejected promise', () => {
      it('should update in form state from props', () => {
        let innerProps
        const DecoratedComponent = recomposeForm({
          fields: ['name', 'email'],
          validate,
        })(props => {
          innerProps = props
          return <div />
        })

        const testInstance = ReactTestRenderer.create(
          <DecoratedComponent
            values={initialValues}
            onSubmit={() => Promise.resolve()}
          />
        )
        expect(innerProps.form).toMatchSnapshot()
        expect(innerProps.handleSubmit).toMatchSnapshot()

        innerProps.handleSubmit(mockEvent)

        expect(innerProps.form).toMatchSnapshot()

        return new Promise(resolve => setTimeout(resolve, 50)).then(() => {
          expect(innerProps.form).toMatchSnapshot()
        })
      })
    })

    it('should pass in field handlers from props', () => {
      let innerProps
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate,
      })(props => {
        innerProps = props
        return <div />
      })

      const testInstance = ReactTestRenderer.create(
        <DecoratedComponent values={initialValues} />
      )
      expect(innerProps.onNameChange).toMatchSnapshot()
      expect(innerProps.onEmailChange).toMatchSnapshot()
    })

    it('should call onChange when fields are changed', () => {
      let innerProps
      const handleChange = jest.fn()
      const DecoratedComponent = recomposeForm({
        fields: ['name', 'email'],
        validate,
      })(props => {
        innerProps = props
        return <div />
      })

      const testInstance = ReactTestRenderer.create(
        <DecoratedComponent values={initialValues} onChange={handleChange} />
      )
      expect(innerProps.onNameChange).toMatchSnapshot()
      expect(handleChange).not.toBeCalled()

      innerProps.onNameChange({
        target: { value: 'Jeremy' },
      })
      expect(handleChange).toBeCalled()
    })

    describe('calling onNameChange with valid value', () => {
      it('should update field states from props', () => {
        let innerProps
        const handleChange = values =>
          testInstance.update(
            <DecoratedComponent values={values} onChange={handleChange} />
          )
        const DecoratedComponent = recomposeForm({
          fields: ['name', 'email'],
          validate(values) {
            const errors = {}
            if (!values.name) {
              errors.name = 'Required'
            }
            return errors
          },
        })(props => {
          innerProps = props
          return <div />
        })

        const testInstance = ReactTestRenderer.create(
          <DecoratedComponent values={initialValues} onChange={handleChange} />
        )
        expect(innerProps.meta.name).toMatchSnapshot()
        expect(innerProps.onNameChange).toMatchSnapshot()

        innerProps.onNameChange({
          target: { value: 'Jeremy' },
        })
        expect(innerProps.meta.name).toMatchSnapshot()
      })
    })

    describe('calling onNameChange with invalid value', () => {
      it('should update field states from props', () => {
        let innerProps
        const handleChange = values =>
          testInstance.update(
            <DecoratedComponent values={values} onChange={handleChange} />
          )
        const DecoratedComponent = recomposeForm({
          fields: ['name', 'email'],
          validate(values) {
            const errors = {}
            if (!values.name) {
              errors.name = 'Required'
            }
            return errors
          },
        })(props => {
          innerProps = props
          return <div />
        })
        const testInstance = ReactTestRenderer.create(
          <DecoratedComponent values={initialValues} onChange={handleChange} />
        )
        expect(innerProps.meta.name).toMatchSnapshot()
        expect(innerProps.onNameChange).toMatchSnapshot()

        innerProps.onNameChange({
          target: { value: '' },
        })
        expect(innerProps.meta.name).toMatchSnapshot()
      })
    })
  })
})
