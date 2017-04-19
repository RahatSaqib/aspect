describe('appEnvConfigTests', () => {
  it('should load app config file depending on current process.env.ASPECT_TARGET', () => {
    expect(process.env.ASPECT_TARGET).toEqual('test')
  })
})
