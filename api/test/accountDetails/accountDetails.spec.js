let supertest = require('supertest')
let chai = require('chai')
let shared = require('../utils/sharedToken')
let _ = require('lodash')

// This agent refers to PORT where program is running.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('/account-details', function () {
  let accountDetails

  describe('/account-details/current', function (){
    describe('GET', function(){
      const path = '/api/account-details/current'
      shared.checkToken(server, path)

      it('should return the account details for the currently logged in user', function(done){
        server
          .get(path)
          .set('Authorization', 'Bearer ' + shared.token)
          .end(function(err,res){
            //We need this for the nex test
            accountDetails = res.body.data
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'Object')
            const accountDetailsFieldNames = ['id', 'userId', 'username', 'name', 'title', 'email', 'email2',
              'phone', 'cell', 'countryId', 'stateId', 'lgaId', 'timezone', 'culture']
            _.each(accountDetailsFieldNames, function(fieldName) {
              assert.property(res.body.data, fieldName)
            })
            done()
          })
      })
    })
  })

  describe('/account-details/current-contact', function (){
    describe('PUT', function(){
      const path = '/api/account-details/current-contact'

      it('should update account details for the currently logged in user and return them', function(done){
        let originalTitle = accountDetails.title
        let newJobTitle = 'New Job Title'
        assert.notEqual(accountDetails.title, newJobTitle, 'The title of this person is already set to \'New Job Title\'. This could be a problem with the cleanup that was supposed to have happened the last time this test was run. Please update the title of person (id=' + accountDetails.id + ') to something other than \'' + newJobTitle + '\'')
        let contactDetails = _.omit(accountDetails, ['userId', 'username', 'timezone', 'culture'])
        server
          .put(path)
          .send(Object.assign({}, contactDetails, { title: newJobTitle }))
          .set('Authorization', 'Bearer ' + shared.token)
          .end(function(err,res){
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'Object')
            const accountDetailsFieldNames = ['id', 'userId', 'username', 'name', 'title', 'email', 'email2',
              'phone', 'cell', 'countryId', 'stateId', 'lgaId', 'timezone', 'culture']
            _.each(accountDetailsFieldNames, function(fieldName) {
              assert.property(res.body.data, fieldName)
            })
            assert.equal(res.body.data.title, newJobTitle)

            //Make sure the data has been persisted
            server
              .get('/api/account-details/current')
              .set('Authorization', 'Bearer ' + shared.token)
              .end(function(err,res){
                assert.equal(res.body.data.title, newJobTitle)

                //Clean Up: Update the user with their old title again
                contactDetails = _.omit(accountDetails, ['userId', 'username', 'timezone', 'culture'])
                server
                  .put(path)
                  .send(Object.assign({}, contactDetails, { title: originalTitle }))
                  .set('Authorization', 'Bearer ' + shared.token)
                  .end(function(err,res){
                    assert.equal(res.body.data.title, originalTitle)
                    done()
                  })
              })
          })
      })
    })
  })
})
