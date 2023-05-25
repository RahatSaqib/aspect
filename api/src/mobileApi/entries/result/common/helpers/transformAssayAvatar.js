const _ = require('lodash')
const { assayAvatarColorsIcon } = require('../../../common/consts')

function transformAssayAvatar(data) {
  const assayConst = assayAvatarColorsIcon[_.toLower(data.assayTypeAbbreviation)] ?? assayAvatarColorsIcon.default
  return {
    resultId: data.id,
    contentI18nKey: data.assayTypeI18nKey ?? null,
    contentText: data.assayTypeAbbreviation ?? null,
    backgroundColor: assayConst.backgroundColor,
    foregroundColor: assayConst.foregroundColor,
  }
}

module.exports = { transformAssayAvatar }
