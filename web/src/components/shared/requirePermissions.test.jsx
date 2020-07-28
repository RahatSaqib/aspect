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
        const permissionsByTypes = groupByPermissionTypes(['person:edit'])

        expect(permissionsByTypes).toEqual({
          required: [],
          forbidden: [],
          optional: ['person:edit'],
        })
      })
    })
  })

  describe('isPermittedUser', () => {
    describe('only required', () => {
      it('should be valid for edit user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: ['person:edit'],
          forbidden: [],
          optional: [],
        })

        expect(isPermitted).toBe(true)
      })

      it('should be valid for edit user when requesting weaker level', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: ['person:edit'],
          forbidden: [],
          optional: [],
        })

        expect(isPermitted).toBe(true)
      })

      it('should be valid for edit user when requesting any level', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: ['person'],
          forbidden: [],
          optional: [],
        })

        expect(isPermitted).toBe(true)
      })
    })

    describe('only forbidden', () => {
      it('should be invalid for edit user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: [],
          forbidden: ['person:edit'],
          optional: [],
        })

        expect(isPermitted).toBe(false)
      })

      it('should be invalid for edit user when denying even weaker level', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: [],
          forbidden: ['person:view'],
          optional: [],
        })

        expect(isPermitted).toBe(false)
      })

      it('should be invalid for edit user when denying any level', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: [],
          forbidden: ['person'],
          optional: [],
        })

        expect(isPermitted).toBe(false)
      })
    })

    describe('only optional', () => {
      it('should be valid for edit user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: [],
          forbidden: [],
          optional: ['person:edit', 'site:edit'],
        })

        expect(isPermitted).toBe(true)
      })
      it('should be valid for edit user when requesting any level', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: [],
          forbidden: [],
          optional: ['person', 'site:edit'],
        })

        expect(isPermitted).toBe(true)
      })
      it('should be valid for edit user when requesting weaker level', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: [],
          forbidden: [],
          optional: ['person:view', 'site:edit'],
        })

        expect(isPermitted).toBe(true)
      })
    })

    describe('required and forbidden', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: ['person:edit'],
          forbidden: ['site:view'],
          optional: [],
        })

        expect(isPermitted).toBe(true)
      })

      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: ['site:view'],
          forbidden: ['person:edit'],
          optional: [],
        })

        expect(isPermitted).toBe(false)
      })
    })

    describe('required, forbidden and optional', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(
          Immutable.Set(['person:edit', 'device:view']),
          {
            required: ['person:edit'],
            forbidden: ['site:view'],
            optional: ['device:view'],
          }
        )

        expect(isPermitted).toBe(true)
      })

      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit']), {
          required: ['site:view'],
          forbidden: ['person:edit'],
          optional: ['device:view'],
        })

        expect(isPermitted).toBe(false)
      })
    })
  })

  const ForbiddenComponent = () => {}
  const WrappedComponent = () => {}

  function makeContext(userPermissions) {
    return {
      store: {
        subscribe() {},
        dispatch() {},
        getState() {
          return {
            user: {
              jwt: {
                permissions: Immutable.Set(userPermissions),
              },
            },
          }
        },
      },
    }
  }

  describe('given right user permissions', () => {
    const DecoratedComponent = requirePermissions({
      permissions: ['person:edit'],
      ForbiddenComponent,
    })(WrappedComponent)

    it('should render WrappedComponent', () => {
      const ComponentWrapper = shallow(<DecoratedComponent />, {
        context: makeContext(['person:edit']),
      })

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)
    })

    it('should render WrappedComponent', () => {
      const ComponentWrapper = shallow(<DecoratedComponent />, {
        context: makeContext(['person:edit', 'device:view']),
      })

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)
    })
  })

  describe('given wrong user permissions', () => {
    const DecoratedComponent = requirePermissions({
      permissions: ['person:edit'],
      ForbiddenComponent,
    })(WrappedComponent)

    it('should render ForbiddenComponent', () => {
      const ComponentWrapper = shallow(<DecoratedComponent />, {
        context: makeContext(['device:view']),
      })

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(0)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(1)
    })

    it('should render ForbiddenComponent', () => {
      const ComponentWrapper = shallow(<DecoratedComponent />, {
        context: makeContext(['person:view', 'device:view']),
      })

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(0)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(1)
    })
  })

  describe('given right user', () => {
    const DecoratedComponent = requirePermissions({
      permissions: ['person:edit'],
      ForbiddenComponent,
    })(WrappedComponent)

    it('should render WrappedComponent', () => {
      const ComponentWrapper = shallow(<DecoratedComponent />, {
        context: makeContext(['person:edit'], ['person']),
      })

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)
    })

    it('should render WrappedComponent', () => {
      const ComponentWrapper = shallow(<DecoratedComponent />, {
        context: makeContext(['person:edit'], ['task', 'person']),
      })

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)
    })
  })
})
