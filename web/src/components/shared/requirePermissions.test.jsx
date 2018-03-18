import Immutable from 'immutable'
import React from 'react'
import { shallow } from 'enzyme'
import {
  groupByPermissionTypes,
  isPermittedUser,
  requirePermissions,
} from './requirePermissions'

describe('requirePermissions', () => {
  describe('groupByPermissionTypes', () => {
    describe('only required', () => {
      it('should parse correctly', () => {
        const permissionsByTypes = groupByPermissionTypes(['person:admin'])

        expect(permissionsByTypes).toEqual({
          required: [],
          forbidden: [],
          optional: ['person:admin'],
        })
      })
    })
  })

  describe('isPermittedUser', () => {
    describe('only required', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: ['person:admin'],
          forbidden: [],
          optional: [],
        })

        expect(isPermitted).toBe(true)
      })
    })

    describe('only forbidden', () => {
      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: [],
          forbidden: ['person:admin'],
          optional: [],
        })

        expect(isPermitted).toBe(false)
      })
    })

    describe('only optional', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: [],
          forbidden: [],
          optional: ['person:admin', 'site:admin'],
        })

        expect(isPermitted).toBe(true)
      })
    })

    describe('required and forbidden', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: ['person:admin'],
          forbidden: ['site:view'],
          optional: [],
        })

        expect(isPermitted).toBe(true)
      })

      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: ['site:view'],
          forbidden: ['person:admin'],
          optional: [],
        })

        expect(isPermitted).toBe(false)
      })
    })

    describe('required, forbidden and optional', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(
          Immutable.Set(['person:admin', 'device:view']),
          {
            required: ['person:admin'],
            forbidden: ['site:view'],
            optional: ['device:view'],
          }
        )

        expect(isPermitted).toBe(true)
      })

      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:admin']), {
          required: ['site:view'],
          forbidden: ['person:admin'],
          optional: ['device:view'],
        })

        expect(isPermitted).toBe(false)
      })
    })
  })

  const ForbiddenComponent = () => {}
  const WrappedComponent = () => {}

  function makeContext(userPermissions, userFeatures) {
    return {
      store: {
        subscribe() {},
        getState() {
          return {
            user: {
              jwt: {
                permissions: Immutable.Set(userPermissions),
                features: Immutable.Set(userFeatures),
              },
            },
          }
        },
      },
    }
  }

  describe('given right user permissions', () => {
    const DecoratedComponent = requirePermissions({
      permissions: ['person:admin'],
      features: ['personList:true'],
      ForbiddenComponent,
    })(WrappedComponent)

    it('should render WrappedComponent', () => {
      const ComponentWrapper = shallow(<DecoratedComponent />, {
        context: makeContext(['person:admin'], ['personList:true']),
      })

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)
    })

    it('should render WrappedComponent', () => {
      const ComponentWrapper = shallow(<DecoratedComponent />, {
        context: makeContext(
          ['person:admin', 'device:view'],
          ['personList:true']
        ),
      })

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)
    })
  })

  describe('given wrong user permissions', () => {
    const DecoratedComponent = requirePermissions({
      permissions: ['person:admin'],
      ForbiddenComponent,
    })(WrappedComponent)

    it('should render ForbiddenComponent', () => {
      const ComponentWrapper = shallow(<DecoratedComponent />, {
        context: makeContext(['device:view'], ['personList:true']),
      })

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(0)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(1)
    })

    it('should render ForbiddenComponent', () => {
      const ComponentWrapper = shallow(<DecoratedComponent />, {
        context: makeContext(
          ['person:view', 'device:view'],
          ['personList:true']
        ),
      })

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(0)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(1)
    })
  })
})
