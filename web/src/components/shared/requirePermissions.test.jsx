import Immutable from 'immutable'
import React from 'react'
import { shallow } from 'enzyme'
import { groupByPermissionTypes, isPermittedUser, requirePermissions } from './requirePermissions'

describe('requirePermissions', () => {
  describe('groupByPermissionTypes', () => {
    context('only required', () => {
      it('should parse correctly', () => {
        const permissionsByTypes = groupByPermissionTypes(['person:admin'])

        expect(permissionsByTypes).toEqual({
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

        expect(isPermitted).toBe(true)
      })
    })

    context('only forbidden', () => {
      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: [],
          forbidden: ['person:admin'],
          optional: []
        })

        expect(isPermitted).toBe()
      })
    })

    context('only optional', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: [],
          forbidden: [],
          optional: ['person:admin', 'site:admin']
        })

        expect(isPermitted).toBe(true)
      })
    })

    context('required and forbidden', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: ['person:admin'],
          forbidden: ['site:view'],
          optional: []
        })

        expect(isPermitted).toBe(true)
      })

      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: ['site:view'],
          forbidden: ['person:admin'],
          optional: []
        })

        expect(isPermitted).toBe()
      })
    })

    context('required, forbidden and optional', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin', 'device:view']), {
          required: ['person:admin'],
          forbidden: ['site:view'],
          optional: ['device:view']
        })

        expect(isPermitted).toBe(true)
      })

      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: ['site:view'],
          forbidden: ['person:admin'],
          optional: ['device:view']
        })

        expect(isPermitted).toBe()
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

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)
    })

    it('should render WrappedComponent', () => {
      const ComponentWrapper = shallow(
        <DecoratedComponent />,
        {
          context: makeContext(['person:admin', 'device:view'])
        }
      )

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)
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

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(0)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(1)
    })

    it('should render ForbiddenComponent', () => {
      const ComponentWrapper = shallow(
        <DecoratedComponent />,
        {
          context: makeContext(['person:view', 'device:view'])
        }
      )

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(0)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(1)
    })
  })
})
