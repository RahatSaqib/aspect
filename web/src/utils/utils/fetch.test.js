describe('aspectFetch module', () => {
  jest.mock('../../globals/sideEffects/LocalStorage')
  const { aspectFetch } = require('./fetch')

  describe('aspectFetch function', () => {
    describe('unknown API endpoint', () => {
      it('should throw a ConnectionError', done => {
        fetch.mockRejectOnce(new Error('net::ERR_CONNECTION_REFUSED'))
        aspectFetch('/auth').catch(err => {
          expect(err.constructor.name).toBe('ConnectionError')
          expect(err.statusCode).toBe(0)
          done()
        })
      })
    })
  })
})
