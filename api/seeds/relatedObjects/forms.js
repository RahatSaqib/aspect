const { formTypeToId, diseaseToId } = require('../../src/shared/dictionary')

async function getBaseForms() {
  // Issues
  const formDefinition = {
    TBResult: {
      fileName: 'TBResult.json',
      formDefinition: {
        order: 0,
        title: 'TB Result data',
        i18nKeyTitle: 'TBResult18nkey',
        diseaseId: await diseaseToId('tb'),
        externalId: 'TBResult',
        formTypeId: await formTypeToId('resultFormWeb'),
      },
    },
    TBProbes: {
      fileName: 'TBProbes.json',
      formDefinition: {
        order: 1,
        title: 'TB Probes',
        i18nKeyTitle: 'TBProbes18nkey',
        diseaseId: await diseaseToId('tb'),
        externalId: 'TBProbes',
        formTypeId: await formTypeToId('resultFormWeb'),
      },
    },
    HIVResult: {
      fileName: 'HIVResult.json',
      formDefinition: {
        order: 0,
        title: 'HIV Result data',
        i18nKeyTitle: 'HIVResult18nkey',
        diseaseId: await diseaseToId('tb'),
        externalId: 'HIVResult',
        formTypeId: await formTypeToId('resultFormWeb'),
      },
    },
    HIVProbes: {
      fileName: 'HIVProbes.json',
      formDefinition: {
        order: 1,
        title: 'HIV Probes',
        i18nKeyTitle: 'HivProbes18nkey',
        diseaseId: await diseaseToId('hiv'),
        formTypeId: await formTypeToId('resultFormWeb'),
        externalId: 'HIVProbes',
      },
    },
  }
  return formDefinition
}

module.exports = {
  getBaseForms,
}
