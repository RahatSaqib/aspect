const {assert} = require('chai')
const path = require('path')
const templateProcessor = require('../../src/email/templateProcessor')

describe('email/templateProcessor', function () {
  describe('process', function () {
    describe('resetPassword', function () {
      it('should generate a reset password email', function () {
        const tokenValues = {
          name: 'Bryan Richards',
          aspectUrl: 'https://aspect.id',
          resetPasswordToken: 'reset-token-12345'
        }
        return templateProcessor.process('resetPassword', tokenValues).then(function(result) {
          assert.include(result.subject, 'Aspect Password Reset')
          assert.include(result.html, 'Dear ' + tokenValues.name + ',')
          assert.include(result.html, 'Click here to reset your password')
          assert.include(result.html, tokenValues.aspectUrl + '/reset-password?token=' + tokenValues.resetPasswordToken)
          assert.include(result.html, 'Copyable link: ')
          assert.include(result.html, 'This link is valid for the next hour and can only be used once.')

          assert.include(result.text, 'Dear ' + tokenValues.name + ',')
          assert.include(result.text, 'you can reset your password by opening the following URL in your browser')
          assert.include(result.text, tokenValues.aspectUrl + '/reset-password?token=' + tokenValues.resetPasswordToken)
          assert.include(result.text, 'This link is valid for the next hour and can only be used once.')
        })
      })

      describe('fr-FR locale', function () {
        it('should generate a french reset password email', function () {
          const tokenValues = {
            name: 'Jean-Luc Picard',
            aspectUrl: 'https://aspect.id',
            resetPasswordToken: 'reset-token-12345'
          }
          return templateProcessor.process('resetPassword', tokenValues, 'fr-FR').then(function(result) {
            assert.include(result.subject, 'Réinitialisation du mot de passe Aspect')
            assert.include(result.html, 'Cher ' + tokenValues.name + ',')
            assert.include(result.html, 'Cliquez ici pour réinitialiser votre mot de passe')
            assert.include(result.html, tokenValues.aspectUrl + '/reset-password?token=' + tokenValues.resetPasswordToken)
            assert.include(result.html, 'Lien éditable: ')
            assert.include(result.html, 'Ce lien est valable pour l\'heure suivante et ne peut être utilisé qu\'une seule fois')

            assert.include(result.text, 'Cher ' + tokenValues.name + ',')
            assert.include(result.text, 'vous pouvez réinitialiser votre mot de passe en ouvrant l\'URL suivante dans votre navigateur')
            assert.include(result.text, tokenValues.aspectUrl + '/reset-password?token=' + tokenValues.resetPasswordToken)
            assert.include(result.text, 'Ce lien est valable pour l\'heure suivante et ne peut être utilisé qu\'une seule fois')
          })
        })
      })
    })
  })

  describe('generateAttachment', function () {
    describe('api/src/email/templates/systemone.jpg', function () {
      it('should generate an attachment object with base 64 encoded string for the file', function () {
        const filePath = path.join(__dirname, '../../src/email/templates/systemone.jpg')
        return templateProcessor.generateAttachment(filePath, 'image/jpeg', 'inline')
          .then(function(attachment) {
            assert.isOk(attachment.content)
            assert.equal(attachment.mimeType, 'image/jpeg')
            assert.equal(attachment.disposition, 'inline')
            assert.equal(attachment.fileName, 'systemone.jpg')
          })
      })
    })
  })
})
