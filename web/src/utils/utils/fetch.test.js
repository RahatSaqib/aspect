import { aspectFetch } from './fetch'

describe('aspectFetch module', () => {
  describe('aspectFetch function', () => {
    describe('unknown API endpoint', () => {
      it('should throw a ConnectionError', async () => {
        fetch.mockRejectOnce(new Error('net::ERR_CONNECTION_REFUSED'))
        const err = await aspectFetch('/auth').catch(e => e)
        expect(err.constructor.name).toBe('ConnectionError')
        expect(err.statusCode).toBe(0)
      })
    })
  })
})
