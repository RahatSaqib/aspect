const { unitToId } = require('../../src/shared/dictionary')

const getConsumables = async () => {
  const piece = await unitToId('Piece')
  const commonProps = {
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
  }
  const consumables = [
    {
      name: 'Xpert HCV Viral Load Cartridge',
      ...commonProps,
      externalId: 'GxHCVCartridge',
      i18nKey: 'gxHCVCartridge',
    },
    {
      name: 'GeneXpert TB Cartridge',
      externalId: 'GxMtbRifCartridge',
      i18nKey: 'gxMtbRifCartridge',
      ...commonProps,
    },
    {
      name: 'GeneXpert MTB/XDR Cartridge',
      externalId: 'GxMtbXdrCartridge',
      i18nKey: 'gxMtbXDRCartridge',
      ...commonProps,
    },
    {
      name: 'GeneXpert TB Ultra Cartridge',
      externalId: 'GxMtbRifUltraCartridge',
      i18nKey: 'gxMtbRifUltraCartridge',
      ...commonProps,
    },
    {
      name: 'Xpert HIV-1 Viral Load Cartridge',
      externalId: 'GxHiv1VlCartridge',
      i18nKey: 'gxHiv1VlCartridge',
      ...commonProps,
    },
    {
      name: 'Xpert HIV-1 Qual Cartridge',
      externalId: 'GxHiv1QualCartridge',
      i18nKey: 'gxHiv1QualCartridge',
      ...commonProps,
    },
    {
      name: 'GeneXpert Ebola Cartridge',
      externalId: 'GxEbolaCartridge',
      i18nKey: 'gxEbolaCartridge',
      ...commonProps,
    },
    {
      name: 'GeneXpert COVID-19 Cartridge',
      externalId: 'assayGXCovid19Cartridge',
      i18nKey: 'assayGXCovid19Cartridge',
      ...commonProps,
    },
    {
      name: 'GenoType MTBC VER 1.X Test Strip',
      unit: piece,
      externalId: 'GenoTypeMTBCStrip',
      i18nKey: 'genoTypeMTBCStrip',
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
    },
    {
      name: 'GenoType MTBDRplus VER 2.0 Test Strip',
      unit: piece,
      canExpire: 1,
      externalId: 'GenoTypeMTBDRplusStrip',
      i18nKey: 'genoTypeMTBDRplusStrip',
      manufacturer: 'Hain Lifescience',
    },
    {
      name: 'GenoType MTBDRsl VER 1.0 Test Strip',
      externalId: 'GenoTypeMTBDRslStrip',
      i18nKey: 'genoTypeMTBDRslStrip',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
    },
    {
      name: 'GenoType MTBDRsl VER 2.0 Test Strip',
      externalId: 'GenoTypeMTBDRslV2Strip',
      i18nKey: 'genoTypeMTBDRslV2Strip',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
    },
    {
      name: 'Alere Q HIV-1/2 Detect Cartridge',
      externalId: 'AlereHivDetectCartridge',
      i18nKey: 'alereHivDetectCartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Alere',
    },
    {
      name: 'Alere Q HIV-1/2 VL Plasma Cartridge',
      externalId: 'AlereHivVLPlasmaCartridge',
      i18nKey: 'alereHivVLPlasmaCartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Alere',
    },
    {
      name: 'Daktari CD4 Cartridge',
      externalId: 'DaktariCD4Cartridge',
      i18nKey: 'daktariCD4Cartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Daktari',
    },
    {
      name: 'Daktari HIV-VL Cartridge',
      externalId: 'DaktariHivVLCartridge',
      i18nKey: 'daktariHivVLCartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Daktari',
    },
  ]
  return consumables
}

module.exports = getConsumables
