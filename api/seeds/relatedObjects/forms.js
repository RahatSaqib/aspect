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
    TBCaseHealthCondition: {
      fileName: 'TBCaseHealthCondition.json',
      formDefinition: {
        order: 1,
        title: 'Health Condition',
        i18nKeyTitle: 'TBCaseHealthCondition18nkey',
        diseaseId: await diseaseToId('tb'),
        formTypeId: await formTypeToId('CaseCreation'),
        externalId: 'TBCaseHealthCondition',
      },
    },
    TBCaseTreatment: {
      fileName: 'TBCaseTreatment.json',
      formDefinition: {
        order: 2,
        title: 'Treatment',
        i18nKeyTitle: 'TBTreatment18nkey',
        diseaseId: await diseaseToId('tb'),
        formTypeId: await formTypeToId('CaseCreation'),
        externalId: 'TBCaseTreatment',
      },
    },
    HIVResult: {
      fileName: 'HIVResult.json',
      formDefinition: {
        order: 0,
        title: 'HIV Result data',
        i18nKeyTitle: 'HIVResult18nkey',
        diseaseId: await diseaseToId('hiv'),
        externalId: 'HIVResult',
        formTypeId: await formTypeToId('resultFormWeb'),
      },
    },
    HIVProbes: {
      fileName: 'HIVProbes.json',
      formDefinition: {
        order: 1,
        title: 'HIV Probes',
        i18nKeyTitle: 'HIVProbes18nkey',
        diseaseId: await diseaseToId('hiv'),
        formTypeId: await formTypeToId('resultFormWeb'),
        externalId: 'HIVProbes',
      },
    },
    HIVCaseHealthCondition: {
      fileName: 'HIVCaseHealthCondition.json',
      formDefinition: {
        order: 1,
        title: 'Health Condition',
        i18nKeyTitle: 'HIVCaseHealthCondition18nkey',
        diseaseId: await diseaseToId('hiv'),
        formTypeId: await formTypeToId('CaseCreation'),
        externalId: 'HIVCaseHealthCondition',
      },
    },
    HIVCaseTreatment: {
      fileName: 'HIVCaseTreatment.json',
      formDefinition: {
        order: 2,
        title: 'Treatment',
        i18nKeyTitle: 'HIVCaseTreatmenti18nkey',
        diseaseId: await diseaseToId('hiv'),
        formTypeId: await formTypeToId('CaseCreation'),
        externalId: 'HIVCaseTreatment',
      },
    },
    CovidResult: {
      fileName: 'CovidResult.json',
      formDefinition: {
        order: 1,
        title: 'Result',
        i18nKeyTitle: 'CovidResulti18nKey',
        diseaseId: await diseaseToId('covid19'),
        formTypeId: await formTypeToId('resultFormWeb'),
        externalId: 'CovidResult',
      },
    },
    CovidCaseHealthCondition: {
      fileName: 'CovidCaseHealthCondition.json',
      formDefinition: {
        order: 1,
        title: 'Health Condition',
        i18nKeyTitle: 'CovidCaseHealthConditioni18nkey',
        diseaseId: await diseaseToId('covid19'),
        formTypeId: await formTypeToId('CaseCreation'),
        externalId: 'CovidCaseHealthCondition',
      },
    },
    CovidCaseTreatment: {
      fileName: 'CovidCaseTreatment.json',
      formDefinition: {
        order: 0,
        title: 'Treatment',
        i18nKeyTitle: 'CovidCaseTreatmenti18nkey',
        diseaseId: await diseaseToId('covid19'),
        formTypeId: await formTypeToId('CaseCreation'),
        externalId: 'CovidCaseTreatment',
      },
    },
    CovidCaseAditionalData: {
      fileName: 'CovidCaseAditionalData.json',
      formDefinition: {
        order: 2,
        title: 'Aditional Data',
        i18nKeyTitle: 'CovidCaseAditionalDatai18nkey',
        diseaseId: await diseaseToId('covid19'),
        formTypeId: await formTypeToId('CaseCreation'),
        externalId: 'CovidCaseAditionalData',
      },
    },
  }
  return formDefinition
}

module.exports = {
  getBaseForms,
}
