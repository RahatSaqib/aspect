import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import filter from 'lodash/filter'

import { Base } from '../stories/AspectLink.stories'
import { expected, permissions, links } from './mocks'

describe('AspectLink', () => {
  permissions.map(permission => {
    links.map(to => {
      const expectedCheck = filter(expected, {
        link: to,
        permissions: permission,
      })
      const expectedLink =
        (expectedCheck.length && expectedCheck[0].expected) || false
      it(`"${to}" should be ${
        expectedLink ? '**ALLOWED**' : '**RESTRICTED**'
      } for [${permission}]`, () => {
        render(<Base to={to} Permissions={permission} {...Base.args} />)
        const linkElement = screen.getByText('Link').href
        return expectedLink
          ? expect(linkElement.includes(to)).toBe(true)
          : expect(linkElement).toBe('')
      })
      return false
    })
    return false
  })
})
