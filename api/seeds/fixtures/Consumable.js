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
      assays: [
        {
          externalId: 'GxHcv',
          quantity: 1,
        },
      ],
    },
    {
      name: 'GeneXpert TB Cartridge',
      externalId: 'GxMtbRifCartridge',
      i18nKey: 'gxMtbRifCartridge',
      ...commonProps,
      assays: [
        {
          externalId: 'GxMtbRif',
          quantity: 1,
        },
      ],
    },
    {
      name: 'GeneXpert MTB/XDR Cartridge',
      externalId: 'GxMtbXdrCartridge',
      i18nKey: 'gxMtbXdrCartridge',
      ...commonProps,
      assays: [
        {
          externalId: 'GxMtbXdr',
          quantity: 1,
        },
      ],
    },
    {
      name: 'GeneXpert TB Ultra Cartridge',
      externalId: 'GxMtbRifUltraCartridge',
      i18nKey: 'gxMtbRifUltraCartridge',
      ...commonProps,
      assays: [
        {
          externalId: 'GxMtbRifUltra',
          quantity: 1,
        },
      ],
    },
    {
      name: 'Xpert HIV-1 Viral Load Cartridge',
      externalId: 'GxHiv1VlCartridge',
      i18nKey: 'gxHiv1VlCartridge',
      ...commonProps,
      assays: [
        {
          externalId: 'GxHiv1Vl',
          quantity: 1,
        },
      ],
    },
    {
      name: 'Xpert HIV-1 Qual Cartridge',
      externalId: 'GxHiv1QualCartridge',
      i18nKey: 'gxHiv1QualCartridge',
      ...commonProps,
      assays: [
        {
          externalId: 'GxHiv1Qual',
          quantity: 1,
        },
      ],
    },
    {
      name: 'GeneXpert Ebola Cartridge',
      externalId: 'GxEbolaCartridge',
      i18nKey: 'gxEbolaCartridge',
      ...commonProps,
      assays: [
        {
          externalId: 'GxEbola',
          quantity: 1,
        },
      ],
    },
    {
      name: 'GeneXpert COVID-19 Cartridge',
      externalId: 'assayGXCovid19Cartridge',
      i18nKey: 'assayGXCovid19Cartridge',
      ...commonProps,
      assays: [
        {
          externalId: 'assayGXCovid19',
          quantity: 1,
        },
      ],
    },
    {
      name: 'GenoType MTBC VER 1.X Test Strip',
      unit: piece,
      externalId: 'GenoTypeMTBCStrip',
      i18nKey: 'genoTypeMTBCStrip',
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
      assays: [
        {
          externalId: 'assayGenoTypeMTBCV1',
          quantity: 1,
        },
      ],
    },
    {
      name: 'GenoType MTBDRplus VER 2.0 Test Strip',
      unit: piece,
      canExpire: 1,
      externalId: 'GenoTypeMTBDRplusStrip',
      i18nKey: 'genoTypeMTBDRplusStrip',
      manufacturer: 'Hain Lifescience',
      assays: [
        {
          externalId: 'assayGenoTypeMTBDRplusV2',
          quantity: 1,
        },
      ],
    },
    {
      name: 'GenoType MTBDRsl VER 1.0 Test Strip',
      externalId: 'GenoTypeMTBDRslStrip',
      i18nKey: 'genoTypeMTBDRslStrip',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
      assays: [
        {
          externalId: 'assayGenoTypeMTBDRslV1',
          quantity: 1,
        },
      ],
    },
    {
      name: 'GenoType MTBDRsl VER 2.0 Test Strip',
      externalId: 'GenoTypeMTBDRslV2Strip',
      i18nKey: 'genoTypeMTBDRslV2Strip',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Hain Lifescience',
      assays: [
        {
          externalId: 'assayGenoTypeMTBDRslV2',
          quantity: 1,
        },
      ],
    },
    {
      name: 'Alere Q HIV-1/2 Detect Cartridge',
      externalId: 'AlereHivDetectCartridge',
      i18nKey: 'alereHivDetectCartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Alere',
      assays: [
        {
          externalId: 'assayAlereQHiv12Detect',
          quantity: 1,
        },
      ],
    },
    {
      name: 'Alere Q HIV-1/2 VL Plasma Cartridge',
      externalId: 'AlereHivVLPlasmaCartridge',
      i18nKey: 'alereHivVLPlasmaCartridge',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Alere',
      assays: [
        {
          externalId: 'assayAlereQHiv12VLPlasma',
          quantity: 1,
        },
      ],
    },
    {
      name: 'Truenat MTB Test Kit',
      externalId: 'truenatMTBTestKit',
      i18nKey: 'truenatMTBTestKit',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Molbio Diagnostics',
      assays: [
        {
          externalId: 'assayTruenatMtb',
          quantity: 1,
        },
      ],
    },
    {
      name: 'Truenat MTB Plus Test Kit',
      externalId: 'truenatMTBPlusTestKit',
      i18nKey: 'truenatMTBPlusTestKit',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Molbio Diagnostics',
      assays: [
        {
          externalId: 'assayTruenatMtbPlus',
          quantity: 1,
        },
      ],
    },
    {
      name: 'Truenat MTB Rif Test Kit',
      externalId: 'truenatMTBRifTestKit',
      i18nKey: 'truenatMTBRifTestKit',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Molbio Diagnostics',
      assays: [
        {
          externalId: 'assayTruenatRif',
          quantity: 1,
        },
      ],
    },
    {
      name: 'Truenat Unknown Test Kit',
      externalId: 'truenatUnknownTestKit',
      i18nKey: 'truenatUnknownTestKit',
      unit: piece,
      canExpire: 1,
      manufacturer: 'Molbio Diagnostics',
      assays: [
        {
          externalId: 'assayTruenatUnknown',
          quantity: 1,
        },
      ],
    },
  ]
  return consumables
}

module.exports = getConsumables
