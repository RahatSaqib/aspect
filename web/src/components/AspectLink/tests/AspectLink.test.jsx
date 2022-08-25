import React from 'react'
import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import filter from 'lodash/filter'

import { Base } from '../stories/AspectLink.stories'
import { expected, permissions, links } from './mocks'
import { buildURL } from '../helpers'

describe('AspectLink', () => {
  describe('Helpers', () => {
    it('buildURL should build a URL with parameter sections', () => {
      const url = buildURL('base/url', {
        filters: {
          a: 1,
          b: 'B',
        },
        c: 'C',
      })
      expect(url).toBe('base/url?filters=a%3D1%26b%3DB%26&c=C&')
    })

    it('buildURL should build a URL without parameter sections', () => {
      const url = buildURL('base/url', {
        a: 1,
        b: 'B',
      })
      expect(url).toBe('base/url?a%3D1%26b%3DB%26')
    })
  })

  permissions.map(async permission => {
    links.map(to => {
      const expectedCheck = filter(expected, {
        link: to,
        permissions: permission,
      })
      const expectedLink = (expectedCheck.length && expectedCheck[0].expected) || false
      it(`"${to}" should be ${expectedLink ? '**ALLOWED**' : '**RESTRICTED**'} for [${permission}]`, async () => {
        const { getByText } = render(<Base to={to} Permissions={permission} {...Base.args} />)
        userEvent.click(getByText('Link'))

        await waitFor(async () => {
          return expect(getByText('Not Found')).toBeInTheDocument()
        })
      })
      return false
    })
    return false
  })
})
