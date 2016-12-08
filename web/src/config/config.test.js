describe('appEnvConfigTests', () => {
  it('should load app config file depending on current process.env.ASPECT_ENV', () => {
    expect(process.env.ASPECT_ENV).toEqual('test')
  })
})
