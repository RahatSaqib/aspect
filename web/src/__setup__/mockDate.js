/*
 * Ref: https://github.com/facebook/jest/issues/2234
 */
import { vi } from 'vitest'

const MOCKED_DATE_NOW = 1500000000000
Date.now = vi.fn(() => MOCKED_DATE_NOW)
