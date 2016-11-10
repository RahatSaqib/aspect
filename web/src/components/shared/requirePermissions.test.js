import Immutable from 'immutable'
import { assert } from 'chai'
import React from 'react'
import { shallow } from 'enzyme'
import { groupByPermissionTypes, isPermittedUser, requirePermissions } from './requirePermissions'

describe('requirePermissions', () => {
  describe('groupByPermissionTypes', () => {
    context('only required', () => {
      it('should parse correctly', () => {
        const permissionsByTypes = groupByPermissionTypes(['person:admin'])

        assert.deepEqual(permissionsByTypes, {
          required: [],
          forbidden: [],
          optional: ['person:admin']
        })
      })
    })
  })

  describe('isPermittedUser', () => {
    context('only required', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: ['person:admin'],
          forbidden: [],
          optional: []
        })

        assert.isTrue(isPermitted)
      })
    })

    context('only forbidden', () => {
      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: [],
          forbidden: ['person:admin'],
          optional: []
        })

        assert.isFalse(isPermitted)
      })
    })

    context('only optional', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: [],
          forbidden: [],
          optional: ['person:admin', 'site:admin']
        })

        assert.isTrue(isPermitted)
      })
    })

    context('required and forbidden', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: ['person:admin'],
          forbidden: ['site:view'],
          optional: []
        })

        assert.isTrue(isPermitted)
      })

      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: ['site:view'],
          forbidden: ['person:admin'],
          optional: []
        })

        assert.isFalse(isPermitted)
      })
    })

    context('required, forbidden and optional', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin', 'device:view']), {
          required: ['person:admin'],
          forbidden: ['site:view'],
          optional: ['device:view']
        })

        assert.isTrue(isPermitted)
      })

      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: ['site:view'],
          forbidden: ['person:admin'],
          optional: ['device:view']
        })

        assert.isFalse(isPermitted)
      })
    })
  })

  const ForbiddenComponent = () => {}
  const WrappedComponent = () => {}

  function makeContext(userPermissions) {
    return {
      store: {
        subscribe() {},
        getState() {
          return {
            getIn() { return Immutable.Set(userPermissions) }
          }
        }
      }
    }
  }

  context('given right user permissions', () => {
    const DecoratedComponent = requirePermissions({
      permissions: ['person:admin'],
      ForbiddenComponent
    })(WrappedComponent)

    it('should render WrappedComponent', () => {
      const ComponentWrapper = shallow(
        <DecoratedComponent />,
        {
          context: makeContext(['person:admin'])
        }
      )

      assert.equal(ComponentWrapper.find(WrappedComponent).length, 1)
      assert.equal(ComponentWrapper.find(ForbiddenComponent).length, 0)
    })

    it('should render WrappedComponent', () => {
      const ComponentWrapper = shallow(
        <DecoratedComponent />,
        {
          context: makeContext(['person:admin', 'device:view'])
        }
      )

      assert.equal(ComponentWrapper.find(WrappedComponent).length, 1)
      assert.equal(ComponentWrapper.find(ForbiddenComponent).length, 0)
    })
  })

  context('given wrong user permissions', () => {
    const DecoratedComponent = requirePermissions({
      permissions: ['person:admin'],
      ForbiddenComponent
    })(WrappedComponent)

    it('should render ForbiddenComponent', () => {
      const ComponentWrapper = shallow(
        <DecoratedComponent />,
        {
          context: makeContext(['device:view'])
        }
      )

      assert.equal(ComponentWrapper.find(WrappedComponent).length, 0)
      assert.equal(ComponentWrapper.find(ForbiddenComponent).length, 1)
    })

    it('should render ForbiddenComponent', () => {
      const ComponentWrapper = shallow(
        <DecoratedComponent />,
        {
          context: makeContext(['person:view', 'device:view'])
        }
      )

      assert.equal(ComponentWrapper.find(WrappedComponent).length, 0)
      assert.equal(ComponentWrapper.find(ForbiddenComponent).length, 1)
    })
  })
})
