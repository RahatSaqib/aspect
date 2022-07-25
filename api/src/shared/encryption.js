const crypto = require('crypto')
const _ = require('lodash')
const {
  encryption: { passPhrase, initVector },
} = require('../config')

function oneDirectionalMd5Hash(inputString) {
  if (inputString == null || _.isUndefined(inputString)) {
    return inputString
  }
  return crypto.createHash('md5').update(inputString).digest('hex')
}
// cipher 'aes-256-cbc-hmac-sha1' is missing in Node 12.x
// const encryptionAlgorithm = 'aes-256-cbc-hmac-sha1'
const encryptionAlgorithm = 'aes-256-cbc'
const encryptionHashAlgorithm = 'sha1'
const passwordIterations = 2
const keySize = 256
const inputEncoding = 'utf8'
const outputEncoding = 'hex'

function createSalt() {
  return crypto.randomBytes(keySize / 8).toString('base64')
}

function encrypt(plainText, salt) {
  const cipher = crypto.createCipheriv(encryptionAlgorithm, createHashPassword(salt), initVector)
  let encryptedText = cipher.update(plainText, inputEncoding, outputEncoding)
  encryptedText += cipher.final(outputEncoding)
  return encryptedText
}

function decrypt(encryptedText, salt) {
  const decipher = crypto.createDecipheriv(encryptionAlgorithm, createHashPassword(salt), initVector)
  let decryptedText = decipher.update(encryptedText, outputEncoding, inputEncoding)
  decryptedText += decipher.final(inputEncoding)
  return decryptedText
}

function createHashPassword(salt) {
  const passPhraseBuffer = Buffer.from(passPhrase)
  const saltBuffer = Buffer.from(salt)
  const nodeCrypto = crypto.pbkdf2Sync(
    passPhraseBuffer,
    saltBuffer,
    passwordIterations,
    keySize / 16,
    encryptionHashAlgorithm
  )
  return nodeCrypto.toString(outputEncoding)
}

module.exports = {
  oneDirectionalMd5Hash,
  createSalt,
  encrypt,
  decrypt,
}
