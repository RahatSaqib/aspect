const { EXTERNAL_IDS } = require('../../src/shared/constants')

module.exports = {
  externalId: EXTERNAL_IDS.SEND_RESULT_TO_CEPHEID,
  method: 'POST',
  url: `https://datareceiver-dev.stg.c360.cepheid.com/datareceiver/api/v1/{{urlEncode device.stickerInstrumentSerial}}/instrumentTests`,
  headers:
    '{"ClientId": "%%CEPHEID_CLIENT_ID%%", "Content-Type": "application/json", "Authorization": "Bearer %%CEPHEID_ACCESS_TOKEN%%"}',
  payload:
    `{{square true}}` +
    `{{curly true}}` +
    // Required
    `"instrumentSerialNumber":{{enclose (defaultTo device.stickerInstrumentSerial '') with='"'}},` +
    `"gatewaySerialNumber":{{enclose (defaultTo result.instrumentSerial '') with='"'}},` +
    `"instrumentModel":{{enclose (defaultTo device.instrumentModel '') with='"'}},` +
    `"softwareVersion":{{enclose (defaultTo result.resultData.softwareVersion '') with='"'}},` +
    `"operatingSystem":{{enclose (defaultTo device.computerOsVersion '') with='"'}},` +
    `"labName":{{enclose (defaultTo site.name '') with='"'}},` +
    `"labGuid":{{enclose (defaultTo site.siteGuid '') with='"'}},` +
    `"labLocationCountry":{{enclose (defaultTo country.name '') with='"'}},` +
    `"labLocationRegion":{{enclose (defaultTo site.state '') with='"'}},` +
    `"labLocationDistrict":{{enclose (defaultTo site.lga '') with='"'}},` +
    `"institutionGuid":{{enclose (defaultTo site.siteGuid '') with='"'}},` +
    `"institutionName":{{enclose (defaultTo site.name '') with='"'}},` +
    `"testResultGuid":{{enclose (defaultTo result.resultData.externalId '') with='"'}},` +
    `"resultCategory":{{enclose (defaultTo (mapValue result.resultOutcome '{"Error":"ERROR","Invalid":"INVALID","NoResult":"NO RESULT","Success":"SUCCESS"}') '') with='"'}},` +
    `"reagentLotId":{{enclose (defaultTo result.resultData.reagentLotId '') with='"'}},` +
    `"sampleType":{{enclose (defaultTo result.resultData.sampleTypeKey 'ORH') with='"'}},` +
    `"data":{{enclose (defaultTo result.resultData.testData '') with='"'}},` +
    `"moduleName":{{enclose (defaultTo result.resultData.moduleName '') with='"'}},` +
    `"startTime":{{urlEncode (defaultTo (getDateInMilliSeconds result.startedOn) 'null')}},` +
    `"endTime":{{urlEncode (defaultTo (getDateInMilliSeconds result.endedOn) 'null')}},` +
    `"testModifiedTime":{{urlEncode (defaultTo (getDateInMilliSeconds result.resultData.modificationTime) 'null')}},` +
    `"testCreationInInstrument":{{urlEncode (defaultTo (getDateInMilliSeconds result.resultData.creationTime) 'null')}},` +
    `"sampleId":{{oneDirectionalMd5Hash result.sample.id}},` +
    `"cartridgeSerialNumber":{{enclose (defaultTo result.resultData.cartridgeSerial '') with='"'}},` +
    `"moduleSerialNumber":{{enclose (defaultTo result.resultData.moduleSerial '') with='"'}},` +
    `"assayName":{{enclose (defaultTo result.assay.name '') with='"'}},` +
    `"assayGuid":{{enclose (defaultTo result.resultData.assayGuid '') with='"'}},` +
    `"exportTime":{{urlEncode (defaultTo (getDateInMilliSeconds result.createdOn) 'null')}},` +
    `"icoreSerialNumber":{{result.resultData.icoreSerialNumber}},` +
    // Optional
    `"softwareType":{{enclose (defaultTo device.softwareType '') with='"'}},` +
    `"testType":{{enclose (defaultTo result.resultData.testType '') with='"'}},` +
    `"daisyChained":{{enclose (defaultTo device.daisyChained '') with='"'}},` +
    `"lisConnected":{{enclose (defaultTo device.lisConnected '') with='"'}},` +
    `"analytes":[{{#each result.resultData.analytes}}{"analyteIndex": "{{this.Index}}","analyteName": "{{this.Name}}","reporterName": "{{this.ReporterName}}","curveFitResult": "{{this.CurveFitResult}}","cycleThreshold": "{{this.Cycle_threshold}}","deltaCt": "{{this.DeltaCt}}","ecResult": "{{this.EcResult}}","endpoint": "{{this.Endpoint}}","errorStatus": "{{this.ErrorStatus}}","icResult": "{{this.IcResult}}","interpretation": "{{this.Interpretation}}","iqsHqResult": "{{this.IqsHqResult}}","iqsLqResult": "{{this.IqsLqResult}}","meltPeakHeight": "{{this.MeltPeakHeight}}","meltPeakTemperature": "{{this.MeltPeakTemperature}}","probeCheckReading1": "{{this.ProbeCheckReading1}}","probeCheckReading2": "{{this.ProbeCheckReading2}}","probeCheckReading3": "{{this.ProbeCheckReading3}}","probeCheckResult": "{{this.ProbeCheckResult}}","quantitativeResult": "{{this.QuantitativeResult}}","secondDerivPeakHeight": "{{this.SecondDerivPeakHeight}}","spcResult": "{{this.SpcResult}}","targetResult": "{{this.TargetResult}}","threshold": "{{this.Threshold}}","timeToPossibility": "{{this.Ttp}}","normalizationFactor": "{{this.NormalizationFactor}}"}{{/each}}],` +
    `"errors":{{enclose (defaultTo result.resultData.errors 'null') with=''}},` +
    `"datagramFormat":{{enclose (defaultTo result.resultData.datagramFormat '') with='"'}},` +
    `"dataReductionAlgorithm":{{enclose (defaultTo result.resultData.dataReductionAlg '') with='"'}},` +
    `"adc2Psi":{{enclose (defaultTo result.resultData.adc2Psi '') with='"'}},` +
    `"orderTime":{{enclose (defaultTo result.resultData.orderTime '') with='"'}},` +
    `"firmwareVersion":{{enclose (defaultTo result.resultData.firmwareVersion '') with='"'}},` +
    `"status":{{enclose (defaultTo result.resultData.status '') with='"'}},` +
    `"errorStatus":{{enclose (defaultTo result.resultData.errorStatus '') with='"'}},` +
    `"moduleColor":{{enclose (defaultTo device.moduleColor '') with='"'}}` +
    `{{curly}}` +
    `{{square}}`,
  fileContentTypeId: 'applicationJson',
  okResponseSuccessRegex: '204',
}
