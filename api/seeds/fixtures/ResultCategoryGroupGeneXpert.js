const { byAssay: groupsByAssay } = require('./resultCategoryGroupBase')

module.exports = [
  ...groupsByAssay.gxEbola,
  ...groupsByAssay.gxMtbRif,
  ...groupsByAssay.gxMtbRifUltra,
  ...groupsByAssay.gxMtbXdr,
]
