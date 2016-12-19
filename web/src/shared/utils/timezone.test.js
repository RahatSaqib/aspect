import { timezones, getTimezoneById } from './timezone'

describe('timezone', () => {
  it('should contain valid time zones only', () => {
    const dateToFormat = new Date()
    const culture = 'en-ZA'
    timezones.forEach((timezone) => {
      try {
        const str = dateToFormat.toLocaleTimeString(culture, { timeZone: timezone.timeZone })
        expect(str).toBeTruthy()
      } catch (ex) {
        expect(false).toBe(true)
      }
    })
  })

  it('should get the timezone by ID', () => {
    timezones.forEach((timezone) => {
      const timeZone = getTimezoneById(timezone.id)
      expect(timezone.timeZone).toEqual(timeZone)
    })
  })

  it('should return the browser\'s the timezone when ID is not set or not found in list', () => {
    expect(getTimezoneById()).toBeTruthy()
    expect(getTimezoneById(null)).toBeTruthy()
    expect(getTimezoneById('Some random timezone ID')).toBeTruthy()
  })
})
