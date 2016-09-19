require('dotenv-safe').load()

let supertest = require('supertest')
let serverUrl = 'http://localhost:8080',
  server = supertest.agent(serverUrl),
  attemptsToConnect = 0

function attemptToConnect(done) {
  if (attemptsToConnect === 3) {
    done()
  }
  setTimeout(function () {
    server.get('/api')
      .end(function(err,res){
        if(err || !res || res.status !== 200) {
          attemptsToConnect++
          attemptToConnect(done)
        } else {
          done()
        }
      })
  }, 1000)
}

before(function (done) {
  //Wait until server is up and running
  attemptToConnect(done)
})
