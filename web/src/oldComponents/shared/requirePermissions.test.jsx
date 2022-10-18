import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import * as reactRedux from 'react-redux'
import { groupByPermissionTypes, isPermittedUser, requirePermissions } from './requirePermissions'

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
        const isPermitted = isPermittedUser(Immutable.Set(['person:edit', 'device:view']), {
          required: ['person:edit'],
          forbidden: ['site:view'],
          optional: ['device:view'],
        })

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

  function mockContext(userPermissions) {
    return [
      jest.spyOn(reactRedux, 'useStore').mockReturnValue({
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
      }),
    ]
  }

  function unmock(spies) {
    spies.forEach(spy => spy.mockRestore())
  }

  describe('given right user permissions', () => {
    const DecoratedComponent = requirePermissions({
      permissions: ['person:edit'],
      ForbiddenComponent,
    })(WrappedComponent)

    it('should render WrappedComponent', () => {
      const spies = mockContext(['person:edit'])
      const ComponentWrapper = shallow(<DecoratedComponent />)

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)

      unmock(spies)
    })

    it('should render WrappedComponent', () => {
      const spies = mockContext(['person:edit', 'device:view'])
      const ComponentWrapper = shallow(<DecoratedComponent />)

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)

      unmock(spies)
    })
  })

  describe('given wrong user permissions', () => {
    const DecoratedComponent = requirePermissions({
      permissions: ['person:edit'],
      ForbiddenComponent,
    })(WrappedComponent)

    it('should render ForbiddenComponent', () => {
      const spies = mockContext(['device:view'])
      const ComponentWrapper = shallow(<DecoratedComponent />)

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(0)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(1)

      unmock(spies)
    })

    it('should render ForbiddenComponent', () => {
      const spies = mockContext(['person:view', 'device:view'])
      const ComponentWrapper = shallow(<DecoratedComponent />)

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(0)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(1)

      unmock(spies)
    })
  })

  describe('given right user', () => {
    const DecoratedComponent = requirePermissions({
      permissions: ['person:edit'],
      ForbiddenComponent,
    })(WrappedComponent)

    it('should render WrappedComponent', () => {
      const spies = mockContext(['person:edit'], ['person'])
      const ComponentWrapper = shallow(<DecoratedComponent />)

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)

      unmock(spies)
    })

    it('should render WrappedComponent', () => {
      const spies = mockContext(['person:edit'], ['task', 'person'])
      const ComponentWrapper = shallow(<DecoratedComponent />)

      expect(ComponentWrapper.find(WrappedComponent).length).toEqual(1)
      expect(ComponentWrapper.find(ForbiddenComponent).length).toEqual(0)

      unmock(spies)
    })
  })
})
