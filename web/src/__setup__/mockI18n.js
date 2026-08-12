import { vi } from 'vitest'

vi.mock('react-intl', async () => {
  const reactIntl = await vi.importActual('react-intl')
  const intl = reactIntl.createIntl({
    locale: 'en',
  })
  return {
    ...reactIntl,
    useIntl: () => intl,
  }
})
