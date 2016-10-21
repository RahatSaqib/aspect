import {timezones, getTimezoneById} from './timezone'
import { assert } from 'chai'

describe('timezone', () => {
  it('should contain valid time zones only', () => {
    const dateToFormat = new Date(), culture = 'en-ZA'
    timezones.forEach(timezone => {
      try{
        assert.isOk(dateToFormat.toLocaleTimeString(culture, {timeZone: timezone.timeZone}))
      } catch (ex) {
        assert.fail(timezone.timeZone, ex.message)
      }
    })
  })

  it('should get the timezone by ID', () => {
    timezones.forEach(timezone => {
      const timeZone = getTimezoneById(timezone.id)
      assert.equal(timezone.timeZone, timeZone)
    })
  })

  it('should return the browser\'s the timezone when ID is not set or not found in list', () => {
    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    assert(getTimezoneById(), deviceTimezone)
    assert(getTimezoneById(null), deviceTimezone)
    assert(getTimezoneById('Some random timezone ID'), deviceTimezone)
  })
})
