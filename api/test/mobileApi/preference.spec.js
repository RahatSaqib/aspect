const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = require('../utils/testUtils')

const { assert, expect } = chai

const DEFAULT_EASTERN_STANDARD_TIME = 'America/New_York'
const MYANMAR_TIMEZONE_WINDOWS_FORMAT = 'Myanmar Standard Time'
const EN_US = 'en-US'
const EUROPE_MOSCOW = 'Europe/Moscow'

describe('Mobile API Person Preference Update', () => {
  const path = '/mobile/api/person/preferences'

  describe('PUT', () => {
    function assertPersonResponse(response) {
      expect(response).to.containSubset({
        status: 200,
        body: {
          ok: true,
          data: {},
        },
      })
      assert.property(response.body, 'data')
      if (assert.property(response.body, 'data')) {
        assert.property(response.body.data.timezone, EUROPE_MOSCOW || DEFAULT_EASTERN_STANDARD_TIME)
        assert.property(response.body.data.culture, EN_US)
      }
    }

    function assertResponseContainingPresonResponse(response) {
      assertPersonResponse(response)
    }

    it('it should update user preferences', async () => {
      const res = await server
        .put(`${path}`)
        .send({
          timezone: EUROPE_MOSCOW,
          culture: EN_US,
        })
        .set('Authorization', `Bearer ${shared.token}`)
      assertResponseContainingPresonResponse(res)
    })

    it('it should update timezone to default if timezone is null', async () => {
      const res = await server
        .put(`${path}`)
        .send({
          timezone: null,
          culture: EN_US,
        })
        .set('Authorization', `Bearer ${shared.token}`)
      assertResponseContainingPresonResponse(res)
    })

    it('it should update timezone to windows timezone if timezone is passed as iana windows format', async () => {
      const res = await server
        .put(`${path}`)
        .send({
          timezone: MYANMAR_TIMEZONE_WINDOWS_FORMAT,
          culture: EN_US,
        })
        .set('Authorization', `Bearer ${shared.token}`)
      assertResponseContainingPresonResponse(res)
    })
  })
})
