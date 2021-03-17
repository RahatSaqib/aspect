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
    },
    {
      name: 'GeneXpert TB Cartridge',
      externalId: 'GxMtbRifCartridge',
      ...commonProps,
    },
    {
      name: 'GeneXpert TB Ultra Cartridge',
      externalId: 'GxMtbRifUltraCartridge',
      ...commonProps,
    },
    {
      name: 'Xpert HIV-1 Viral Load Cartridge',
      externalId: 'GxHiv1VlCartridge',
      ...commonProps,
    },
    {
      name: 'Xpert HIV-1 Qual Cartridge',
      externalId: 'GxHiv1QualCartridge',
      ...commonProps,
    },
    {
      name: 'GeneXpert Ebola Cartridge',
      externalId: 'GxEbolaCartridge',
      ...commonProps,
    },
    {
      name: 'GeneXpert Ebola Cartridge',
      externalId: 'GxEbolaCartridge',
      ...commonProps,
    },
    {
      name: 'GeneXpert COVID-19 Cartridge',
      externalId: 'assayGXCovid19Cartridge',
      ...commonProps,
    },
    {
      name: 'GenoType MTBC VER 1.X Test Strip',
      unit: piece,
      externalId: 'GenoTypeMTBCStrip',
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
    },
    {
      name: 'GenoType MTBDRplus VER 2.0 Test Strip',
      unit: piece,
      canExpire: 1,
      externalId: 'GenoTypeMTBDRplusStrip',
      manufacturer: 'Hain Lifescience',
    },
    {
      name: 'GenoType MTBDRsl VER 1.0 Test Strip',
      externalId: 'GenoTypeMTBDRslStrip',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
    },
    {
      name: 'GenoType MTBDRsl VER 2.0 Test Strip',
      externalId: 'GenoTypeMTBDRslV2Strip',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
    },
    {
      name: 'Alere Q HIV-1/2 Detect Cartridge',
      externalId: 'AlereHIV-1/2Cartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Alere',
    },
    {
      name: 'Alere Q HIV-1/2 VL Plasma Cartridge',
      externalId: 'AlereHIV-1/2VLPlasmaCartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Alere',
    },
    {
      name: 'Daktari CD4 Cartridge',
      externalId: 'DaktariCD4Cartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Daktari',
    },
    {
      name: 'Daktari HIV-VL Cartridge',
      externalId: 'DaktariHivVLCartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Daktari',
    },
  ]
  return consumables
}

module.exports = getConsumables
