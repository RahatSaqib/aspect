const _ = require('lodash')
const { assayAvatarColorsIcon } = require('../consts')

function transformAssayAvatar(data) {
  const assayConst = assayAvatarColorsIcon[_.toLower(data.assayTypeAbbreviation)] ?? assayAvatarColorsIcon.default
  return {
    contentI18nKey: data.assayTypeI18nKey ?? null,
    contentText: data.assayTypeAbbreviation ?? null,
    backgroundColor: assayConst.backgroundColor,
    foregroundColor: assayConst.foregroundColor,
  }
}

module.exports = { transformAssayAvatar }
