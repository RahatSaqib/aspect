const { EXTERNAL_IDS } = require('../../src/shared/constants')

module.exports = {
  externalId: EXTERNAL_IDS.SEND_RESULT_TO_CEPHEID,
  method: 'POST',
  urlBase: 'https://datareceiver-dev.stg.c360.cepheid.com',
  url: '/datareceiver/api/v1/{{urlEncode device.stickerInstrumentSerial}}/instrumentTests',
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
    `"startTime":{{defaultTo (getDateInMilliSeconds result.startedOn) 'null'}},` +
    `"endTime":{{defaultTo (getDateInMilliSeconds result.endedOn) 'null'}},` +
    `"testModifiedTime":{{defaultTo (getDateInMilliSeconds result.resultData.modificationTime) 'null'}},` +
    `"testCreationInInstrument":{{defaultTo (getDateInMilliSeconds result.resultData.creationTime) 'null'}},` +
    `"sampleId":{{enclose (defaultTo (oneDirectionalMd5Hash result.sample.id) '') with='"'}},` +
    `"cartridgeSerialNumber":{{enclose (defaultTo (oneDirectionalMd5Hash result.resultData.cartridgeSerial) '') with='"'}},` +
    `"moduleSerialNumber":{{enclose (defaultTo result.resultData.moduleSerial '') with='"'}},` +
    `"assayName":{{enclose (defaultTo result.assay.name '') with='"'}},` +
    `"assayGuid":{{enclose (defaultTo result.resultData.assayGuid '') with='"'}},` +
    `"exportTime":{{defaultTo (getDateInMilliSeconds result.createdOn) 'null'}},` +
    `"icoreSerialNumber":{{#if result.resultData.icoreSerialNumber}}"{{result.resultData.icoreSerialNumber}}"{{else}}null{{/if}},` +
    // Optional
    `"softwareType":{{enclose (defaultTo device.softwareType '') with='"'}},` +
    `"testType":{{enclose (defaultTo result.resultData.testType '') with='"'}},` +
    `"daisyChained":{{enclose (defaultTo device.daisyChained '') with='"'}},` +
    `"lisConnected":{{enclose (defaultTo device.lisConnected '') with='"'}},` +
    `"analytes":[{{#each result.resultData.analytes}}{"analyteIndex": {{this.Index}},"reporterName": "{{this.ReporterName}}","curveFitResult": {{defaultTo this.CurveFitResult 'null'}},"cycleThreshold": {{defaultTo this.Cycle_threshold '0'}},"deltaCt": {{defaultTo  this.DeltaCt 'null'}},"ecResult": {{defaultTo this.EcResult 'null'}},"endpoint": {{defaultTo this.Endpoint '0'}},"errorStatus": {{defaultTo this.ErrorStatus 'null'}},"icResult": {{defaultTo this.IcResult 'null'}},"interpretation": {{defaultTo this.Interpretation 'null'}},"iqsHqResult": "{{defaultTo this.IqsHqResult 'NO RESULT'}}","iqsLqResult": "{{defaultTo this.IqsLqResult 'NO RESULT'}}","meltPeakHeight": {{defaultTo this.MeltPeakHeight 'null'}},"meltPeakTemperature": {{defaultTo this.MeltPeakTemperature 'null'}},"probeCheckReading1": {{defaultTo this.ProbeCheckReading1 '0'}},"probeCheckReading2": {{defaultTo this.ProbeCheckReading2 '0'}},"probeCheckReading3": {{defaultTo this.ProbeCheckReading3 '0'}},"probeCheckResult": {{defaultTo this.ProbeCheckResult 'null'}},"quantitativeResult": {{defaultTo this.QuantitativeResult '-9999.0'}},"secondDerivPeakHeight": {{defaultTo this.SecondDerivPeakHeight '0'}},"spcResult": {{defaultTo this.SpcResult 'null'}},"targetResult": "{{this.TargetResult}}","threshold": {{defaultTo this.Threshold '0'}},"timeToPossibility": {{defaultTo this.Ttp '0'}},"normalizationFactor": {{defaultTo this.NormalizationFactor 'null'}},"analyteName": "{{this.Name}}"}{{#unless @last}},{{/unless}}{{/each}}],` +
    `"datagramFormat":{{enclose (defaultTo result.resultData.datagramFormat '') with='"'}},` +
    `"errors": [{{#each result.resultData.errors}}{"errorCode":{{defaultTo this.Code 'null'}},"details":"{{defaultTo this.Details ''}}","logTime":{{defaultTo (getDateInMilliSeconds this.LogTime) 'null'}},"param1":{{defaultTo this.Param1 'null'}},"param2":{{defaultTo this.Param2 'null'}},"param3":{{defaultTo this.Param3 'null'}},"param4": {{defaultTo this.Param4 'null'}},"severity": {{defaultTo this.Severity 'null'}},"type":{{defaultTo this.Type 'null'}},"textParam":"{{defaultTo this.TextParam ''}}"}{{#unless @last}},{{/unless}}{{/each}}],` +
    `"dataReductionAlgorithm":{{enclose (defaultTo result.resultData.dataReductionAlg '') with='"'}},` +
    `"adc2Psi":{{enclose (defaultTo result.resultData.adc2Psi '') with='"'}},` +
    `"orderTime":{{defaultTo (getDateInMilliSeconds result.resultData.orderTime) 'null'}},` +
    `"firmwareVersion":{{enclose (defaultTo result.resultData.firmwareVersion '') with='"'}},` +
    `"status":{{enclose (defaultTo result.resultData.status '') with='"'}},` +
    `"errorStatus":{{enclose (defaultTo result.resultData.errorStatus '') with='"'}},` +
    `"moduleColor":{{enclose (defaultTo device.moduleColor '') with='"'}}` +
    `{{curly}}` +
    `{{square}}`,
  fileContentTypeId: 'applicationJson',
  okResponseSuccessRegex: '204',
}
