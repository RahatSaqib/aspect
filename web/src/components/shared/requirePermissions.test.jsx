import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { useAuthStore } from '../../store/authStore'
import { groupByPermissionTypes, isPermittedUser, requirePermissions } from './requirePermissions'

vi.mock('../../store/authStore', () => ({ useAuthStore: vi.fn() }))

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
        const isPermitted = isPermittedUser(['person:edit'], {
          required: ['person:edit'],
          forbidden: [],
          optional: [],
        })

        expect(isPermitted).toBe(true)
      })

      it('should be valid for edit user when requesting weaker level', () => {
        const isPermitted = isPermittedUser(['person:edit'], {
          required: ['person:edit'],
          forbidden: [],
          optional: [],
        })

        expect(isPermitted).toBe(true)
      })

      it('should be valid for edit user when requesting any level', () => {
        const isPermitted = isPermittedUser(['person:edit'], {
          required: ['person'],
          forbidden: [],
          optional: [],
        })

        expect(isPermitted).toBe(true)
      })
    })

    describe('only forbidden', () => {
      it('should be invalid for edit user', () => {
        const isPermitted = isPermittedUser(['person:edit'], {
          required: [],
          forbidden: ['person:edit'],
          optional: [],
        })

        expect(isPermitted).toBe(false)
      })

      it('should be invalid for edit user when denying even weaker level', () => {
        const isPermitted = isPermittedUser(['person:edit'], {
          required: [],
          forbidden: ['person:view'],
          optional: [],
        })

        expect(isPermitted).toBe(false)
      })

      it('should be invalid for edit user when denying any level', () => {
        const isPermitted = isPermittedUser(['person:edit'], {
          required: [],
          forbidden: ['person'],
          optional: [],
        })

        expect(isPermitted).toBe(false)
      })
    })

    describe('only optional', () => {
      it('should be valid for edit user', () => {
        const isPermitted = isPermittedUser(['person:edit'], {
          required: [],
          forbidden: [],
          optional: ['person:edit', 'site:edit'],
        })

        expect(isPermitted).toBe(true)
      })
      it('should be valid for edit user when requesting any level', () => {
        const isPermitted = isPermittedUser(['person:edit'], {
          required: [],
          forbidden: [],
          optional: ['person', 'site:edit'],
        })

        expect(isPermitted).toBe(true)
      })
      it('should be valid for edit user when requesting weaker level', () => {
        const isPermitted = isPermittedUser(['person:edit'], {
          required: [],
          forbidden: [],
          optional: ['person:view', 'site:edit'],
        })

        expect(isPermitted).toBe(true)
      })
    })

    describe('required and forbidden', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(['person:edit'], {
          required: ['person:edit'],
          forbidden: ['site:view'],
          optional: [],
        })

        expect(isPermitted).toBe(true)
      })

      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(['person:edit'], {
          required: ['site:view'],
          forbidden: ['person:edit'],
          optional: [],
        })

        expect(isPermitted).toBe(false)
      })
    })

    describe('required, forbidden and optional', () => {
      it('should be valid for admin user', () => {
        const isPermitted = isPermittedUser(['person:edit', 'device:view'], {
          required: ['person:edit'],
          forbidden: ['site:view'],
          optional: ['device:view'],
        })

        expect(isPermitted).toBe(true)
      })

      it('should be invalid for admin user', () => {
        const isPermitted = isPermittedUser(['person:edit'], {
          required: ['site:view'],
          forbidden: ['person:edit'],
          optional: ['device:view'],
        })

        expect(isPermitted).toBe(false)
      })
    })
  })

  const ForbiddenComponent = () => <div data-testid="forbidden" />
  const WrappedComponent = () => <div data-testid="wrapped" />

  function mockContext(userPermissions) {
    useAuthStore.mockReturnValue({ jwt: { permissions: userPermissions } })
    return [useAuthStore]
  }

  function unmock(spies) {
    spies.forEach(spy => spy.mockReset())
  }

  describe('given right user permissions', () => {
    const DecoratedComponent = requirePermissions({
      permissions: ['person:edit'],
      ForbiddenComponent,
    })(WrappedComponent)

    it('should render WrappedComponent', () => {
      const spies = mockContext(['person:edit'])
      render(<DecoratedComponent />)

      expect(screen.getByTestId('wrapped')).toBeInTheDocument()
      expect(screen.queryByTestId('forbidden')).not.toBeInTheDocument()

      unmock(spies)
    })

    it('should render WrappedComponent', () => {
      const spies = mockContext(['person:edit', 'device:view'])
      render(<DecoratedComponent />)

      expect(screen.getByTestId('wrapped')).toBeInTheDocument()
      expect(screen.queryByTestId('forbidden')).not.toBeInTheDocument()

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
      render(<DecoratedComponent />)

      expect(screen.queryByTestId('wrapped')).not.toBeInTheDocument()
      expect(screen.getByTestId('forbidden')).toBeInTheDocument()

      unmock(spies)
    })

    it('should render ForbiddenComponent', () => {
      const spies = mockContext(['person:view', 'device:view'])
      render(<DecoratedComponent />)

      expect(screen.queryByTestId('wrapped')).not.toBeInTheDocument()
      expect(screen.getByTestId('forbidden')).toBeInTheDocument()

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
      render(<DecoratedComponent />)

      expect(screen.getByTestId('wrapped')).toBeInTheDocument()
      expect(screen.queryByTestId('forbidden')).not.toBeInTheDocument()

      unmock(spies)
    })

    it('should render WrappedComponent', () => {
      const spies = mockContext(['person:edit'], ['task', 'person'])
      render(<DecoratedComponent />)

      expect(screen.getByTestId('wrapped')).toBeInTheDocument()
      expect(screen.queryByTestId('forbidden')).not.toBeInTheDocument()

      unmock(spies)
    })
  })
})
