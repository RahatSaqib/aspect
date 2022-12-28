const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = require('../utils/testUtils')

const { assert, expect } = chai

const EASTERN_STANDARD_TIME = 'Eastern Standard Time'
const EN_US = 'en-US'

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
        assert.property(response.body.data.timezone, EASTERN_STANDARD_TIME)
        assert.property(response.body.data.culture, EN_US)
      }
    }

    function assertResponseContainingPresonResponse(response) {
      assertPersonResponse(response)
    }

    it('it should update user preferences', async () => {
      const res = await server
        .put(`${path}/1`)
        .send({
          timezone: EASTERN_STANDARD_TIME,
          culture: EN_US,
        })
        .set('Authorization', `Bearer ${shared.token}`)
      assertResponseContainingPresonResponse(res)
    })
  })
})
