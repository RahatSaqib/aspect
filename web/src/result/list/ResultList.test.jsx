import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { Table } from '../../shared/metaReducers/table'
import { Items } from '../../shared/metaReducers/items'
import ExportListButton from '../../globals/components/ExportListButton'

import { ResultList } from './ResultList'

const mockState = {
  accountDetails: {
    loading: false,
    saving: false,
    data: {
      contactDetails: {
        id: null,
        name: null,
        title: null,
        email: null,
        email2: null,
        phone: null,
        cell: null,
        countryId: null,
        stateId: null,
        lgaId: null,
        zip: null,
        notes: null,
        lastPartnerId: null,
        canLogIn: false
      },
      loginDetails: {
        id: null,
        username: null,
        newPassword: null,
        confirmNewPassword: null,
        currentPassword: null,
        partnerId: null,
        jobFunctions: [],
        userLockedOut: null,
        email: null
      },
      userPreferences: {
        id: null,
        timezone: null,
        culture: null
      }
    }
  },
  appNotification: {
    hasNotification: false,
    notificationType: null,
    messageValues: {},
    showDetails: false,
    notificationOptions: null
  },
  assay: {
    loading: false,
    items: [
      {
        assayTypeAbbreviation: 'CV',
        i18nKey: 'AssayAbbottM2000DaanNCOVID19',
        externalId: 'abbottM2000DaanNCOVID19',
        resultDataSchema: {
          collectedBy: {
            type: 'string',
            title: 'Sample Collected By'
          },
          referenceRanges: {
            type: 'string',
            title: 'Reference Ranges'
          },
          resultUnit: {
            type: 'string',
            title: 'Result Unit'
          },
          actionCode: {
            type: 'string',
            title: 'Action'
          },
          assayName: {
            type: 'string',
            title: 'Assay Name'
          },
          priority: {
            type: 'string',
            title: 'Priority'
          },
          qualityControlSummary: {
            type: 'object',
            title: 'Quality Control Summary',
            properties: {
              'Daan Target N gene LDA': {
                type: 'object',
                title: 'Daan Target N gene LDA',
                properties: {
                  negativeControl: {
                    type: 'object',
                    title: 'Negative Control',
                    properties: {
                      moduleSerial: {
                        type: 'string',
                        title: 'Instrument Serial'
                      },
                      assayName: {
                        type: 'string',
                        title: 'Assay Name'
                      },
                      assayCode: {
                        type: 'string',
                        title: 'Assay Code'
                      },
                      finalResultAbnormalFlags: {
                        type: 'array',
                        title: 'Final Result Abnormal Flags'
                      },
                      preliminaryResultAbnormalFlags: {
                        type: 'array',
                        title: 'Preliminary Result Abnormal Flags'
                      },
                      reportType: {
                        type: 'string',
                        title: 'Report Type'
                      },
                      passed: {
                        type: 'bool',
                        title: 'Passed'
                      },
                      moduleName: {
                        type: 'string',
                        title: 'Well Position'
                      },
                      endedOn: {
                        type: 'time',
                        title: 'Time Ended'
                      }
                    }
                  },
                  positiveControl: {
                    type: 'object',
                    title: 'Positive Control',
                    properties: {
                      moduleSerial: {
                        type: 'string',
                        title: 'Instrument Serial'
                      },
                      assayName: {
                        type: 'string',
                        title: 'Assay Name'
                      },
                      assayCode: {
                        type: 'string',
                        title: 'Assay Code'
                      },
                      finalResultAbnormalFlags: {
                        type: 'array',
                        title: 'Final Result Abnormal Flags'
                      },
                      preliminaryResultAbnormalFlags: {
                        type: 'array',
                        title: 'Preliminary Result Abnormal Flags'
                      },
                      orderOperatorId: {
                        type: 'string',
                        title: 'Ordered By'
                      },
                      consumableLot: {
                        type: 'string',
                        title: 'Consumable Lot Number'
                      },
                      reportType: {
                        type: 'string',
                        title: 'Report Type'
                      },
                      cycleNumber: {
                        type: 'number',
                        title: 'Cycle Number'
                      },
                      passed: {
                        type: 'bool',
                        title: 'Passed'
                      },
                      consumableSerial: {
                        type: 'string',
                        title: 'Consumable Serial Number'
                      },
                      moduleName: {
                        type: 'string',
                        title: 'Well Position'
                      },
                      senderOperator: {
                        type: 'string',
                        title: 'Sent By'
                      },
                      endedOn: {
                        type: 'time',
                        title: 'Time Ended'
                      },
                      controlConsumableLotNumber: {
                        type: 'string',
                        title: 'Control Consumable Lot Number'
                      },
                      result: {
                        type: 'string',
                        title: 'Result'
                      }
                    }
                  }
                }
              },
              'Daan nCOVID-19 ORF LDA': {
                type: 'object',
                title: 'Daan nCOVID-19 ORF LDA',
                properties: {
                  negativeControl: {
                    type: 'object',
                    title: 'Negative Control',
                    properties: {
                      moduleSerial: {
                        type: 'string',
                        title: 'Instrument Serial'
                      },
                      assayName: {
                        type: 'string',
                        title: 'Assay Name'
                      },
                      assayCode: {
                        type: 'string',
                        title: 'Assay Code'
                      },
                      finalResultAbnormalFlags: {
                        type: 'array',
                        title: 'Final Result Abnormal Flags'
                      },
                      preliminaryResultAbnormalFlags: {
                        type: 'array',
                        title: 'Preliminary Result Abnormal Flags'
                      },
                      reportType: {
                        type: 'string',
                        title: 'Report Type'
                      },
                      passed: {
                        type: 'bool',
                        title: 'Passed'
                      },
                      moduleName: {
                        type: 'string',
                        title: 'Well Position'
                      },
                      endedOn: {
                        type: 'time',
                        title: 'Time Ended'
                      }
                    }
                  },
                  positiveControl: {
                    type: 'object',
                    title: 'Positive Control',
                    properties: {
                      moduleSerial: {
                        type: 'string',
                        title: 'Instrument Serial'
                      },
                      assayName: {
                        type: 'string',
                        title: 'Assay Name'
                      },
                      assayCode: {
                        type: 'string',
                        title: 'Assay Code'
                      },
                      finalResultAbnormalFlags: {
                        type: 'array',
                        title: 'Final Result Abnormal Flags'
                      },
                      preliminaryResultAbnormalFlags: {
                        type: 'array',
                        title: 'Preliminary Result Abnormal Flags'
                      },
                      orderOperatorId: {
                        type: 'string',
                        title: 'Ordered By'
                      },
                      consumableLot: {
                        type: 'string',
                        title: 'Consumable Lot Number'
                      },
                      reportType: {
                        type: 'string',
                        title: 'Report Type'
                      },
                      cycleNumber: {
                        type: 'number',
                        title: 'Cycle Number'
                      },
                      passed: {
                        type: 'bool',
                        title: 'Passed'
                      },
                      consumableSerial: {
                        type: 'string',
                        title: 'Consumable Serial Number'
                      },
                      moduleName: {
                        type: 'string',
                        title: 'Well Position'
                      },
                      senderOperator: {
                        type: 'string',
                        title: 'Sent By'
                      },
                      endedOn: {
                        type: 'time',
                        title: 'Time Ended'
                      },
                      controlConsumableLotNumber: {
                        type: 'string',
                        title: 'Control Consumable Lot Number'
                      },
                      result: {
                        type: 'string',
                        title: 'Result'
                      }
                    }
                  }
                }
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text'
          },
          messageIsComplete: {
            type: 'bool',
            title: 'Message Complete'
          },
          finalResultAbnormalFlags: {
            type: 'array',
            title: 'Final Result Abnormal Flags'
          },
          preliminaryResultAbnormalFlags: {
            type: 'array',
            title: 'Preliminary Result Abnormal Flags'
          },
          orderOperatorId: {
            type: 'string',
            title: 'Ordered By'
          },
          reportType: {
            type: 'string',
            title: 'Report Type'
          },
          passedQualityControl: {
            type: 'bool',
            title: 'Passed Quality Control'
          },
          resultStatus: {
            type: 'string',
            title: 'Status'
          },
          assayProtocol: {
            type: 'string',
            title: 'Assay Protocol'
          },
          typeOfMessage: {
            type: 'string',
            title: 'Message Type'
          },
          resultType: {
            type: 'string',
            title: 'Result Type'
          },
          testQualifier: {
            type: 'string',
            title: 'Test Qualifier'
          },
          controlConsumableLotNumber: {
            type: 'string',
            title: 'Quality Control Consumable Lot'
          },
          messageSentOn: {
            type: 'time',
            title: 'Message Sent On'
          }
        },
        abilities: [
          {
            assayId: '5',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '5',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '5',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '5',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '5',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '5',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '5',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: true,
            canDelete: true,
            canEdit: true
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Abbott m2000 Daan N COVID-19',
        resultCategory1i18nKey: 'resultCategoryCOVID19RegionN',
        deviceTypeId: '1',
        assayTypeId: '18',
        abbreviation: 'm2000 COVID-19 N',
        patientDataSchema: {
          isolationStatus: {
            list: false,
            type: 'string',
            order: 16,
            title: 'Isolation Status'
          },
          gender: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Gender'
          },
          attendingPhysician: {
            list: false,
            type: 'string',
            order: 9,
            title: 'Attending Physician'
          },
          practicePatientId: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Practice Patient ID'
          },
          height: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Height'
          },
          name: {
            list: false,
            type: 'string',
            order: 3,
            title: 'Name'
          },
          phone: {
            list: false,
            type: 'string',
            order: 8,
            title: 'Phone'
          },
          admissionOrDischargeDates: {
            list: false,
            type: 'date',
            order: 13,
            title: 'Admission/Discharge Date'
          },
          diet: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Diet'
          },
          address: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Address'
          },
          dosageCategory: {
            list: false,
            type: 'string',
            order: 18,
            title: 'Dosage Category'
          },
          ethnicOrigin: {
            list: false,
            type: 'string',
            order: 6,
            title: 'Ethnicity'
          },
          location: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Location'
          },
          weight: {
            list: false,
            type: 'string',
            order: 11,
            title: 'Weight'
          },
          additionalPatientId: {
            list: false,
            type: 'string',
            order: 2,
            title: 'Additional Patient ID'
          },
          dateOfBirth: {
            list: false,
            type: 'date',
            order: 4,
            title: 'Date of Birth'
          },
          id: {
            list: true,
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          admissionStatus: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Admission Status'
          },
          hospitalInstitution: {
            list: false,
            type: 'string',
            order: 17,
            title: 'Hospital'
          }
        },
        deviceTypeExternalId: 'AbbottM2000',
        diseaseId: '8',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '5',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '5',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '4',
            name: 'Indeterminate',
            i18nKey: 'resultCategoryIndeterminate',
            externalId: 'Indeterminate',
            assayId: '5',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '5',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '5',
            emphasize: 1,
            requirestreatment: 0
          }
        ],
        id: '5',
        deviceTypeName: 'm2000',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'COVID-19 Region N',
        assayTypeName: 'COVID-19 Test'
      },
      {
        assayTypeAbbreviation: 'HIV',
        i18nKey: 'AssayAbbottM2000DBSHivVl',
        externalId: 'abbottM2000DBSHivVL',
        resultDataSchema: {
          collectedBy: {
            type: 'string',
            title: 'Sample Collected By'
          },
          referenceRanges: {
            type: 'string',
            title: 'Reference Ranges'
          },
          resultUnit: {
            type: 'string',
            title: 'Result Unit'
          },
          actionCode: {
            type: 'string',
            title: 'Action'
          },
          assayName: {
            type: 'string',
            title: 'Assay Name'
          },
          priority: {
            type: 'string',
            title: 'Priority'
          },
          qualityControlSummary: {
            type: 'object',
            title: 'Quality Control Summary',
            properties: {
              negativeControl: {
                type: 'object',
                title: 'Negative Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              },
              lowPositiveControl: {
                type: 'object',
                title: 'Low Positive Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              },
              highPositiveControl: {
                type: 'object',
                title: 'High Positive Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text'
          },
          messageIsComplete: {
            type: 'bool',
            title: 'Message Complete'
          },
          finalResultAbnormalFlags: {
            type: 'array',
            title: 'Final Result Abnormal Flags'
          },
          preliminaryResultAbnormalFlags: {
            type: 'array',
            title: 'Preliminary Result Abnormal Flags'
          },
          orderOperatorId: {
            type: 'string',
            title: 'Ordered By'
          },
          reportType: {
            type: 'string',
            title: 'Report Type'
          },
          passedQualityControl: {
            type: 'bool',
            title: 'Passed Quality Control'
          },
          resultStatus: {
            type: 'string',
            title: 'Status'
          },
          assayProtocol: {
            type: 'string',
            title: 'Assay Protocol'
          },
          typeOfMessage: {
            type: 'string',
            title: 'Message Type'
          },
          resultType: {
            type: 'string',
            title: 'Result Type'
          },
          testQualifier: {
            type: 'string',
            title: 'Test Qualifier'
          },
          controlConsumableLotNumber: {
            type: 'string',
            title: 'Quality Control Consumable Lot'
          },
          messageSentOn: {
            type: 'time',
            title: 'Message Sent On'
          }
        },
        abilities: [
          {
            assayId: '3',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '3',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '3',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '3',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '3',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '3',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '3',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Abbott m2000 DBS HIV VL',
        resultCategory1i18nKey: 'resultCategoryHivVl',
        deviceTypeId: '1',
        assayTypeId: '3',
        abbreviation: 'm2000 DBS HIV VL',
        patientDataSchema: {
          isolationStatus: {
            list: false,
            type: 'string',
            order: 16,
            title: 'Isolation Status'
          },
          gender: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Gender'
          },
          attendingPhysician: {
            list: false,
            type: 'string',
            order: 9,
            title: 'Attending Physician'
          },
          practicePatientId: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Practice Patient ID'
          },
          height: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Height'
          },
          name: {
            list: false,
            type: 'string',
            order: 3,
            title: 'Name'
          },
          phone: {
            list: false,
            type: 'string',
            order: 8,
            title: 'Phone'
          },
          admissionOrDischargeDates: {
            list: false,
            type: 'date',
            order: 13,
            title: 'Admission/Discharge Date'
          },
          diet: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Diet'
          },
          address: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Address'
          },
          dosageCategory: {
            list: false,
            type: 'string',
            order: 18,
            title: 'Dosage Category'
          },
          ethnicOrigin: {
            list: false,
            type: 'string',
            order: 6,
            title: 'Ethnicity'
          },
          location: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Location'
          },
          weight: {
            list: false,
            type: 'string',
            order: 11,
            title: 'Weight'
          },
          additionalPatientId: {
            list: false,
            type: 'string',
            order: 2,
            title: 'Additional Patient ID'
          },
          dateOfBirth: {
            list: false,
            type: 'date',
            order: 4,
            title: 'Date of Birth'
          },
          id: {
            list: true,
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          admissionStatus: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Admission Status'
          },
          hospitalInstitution: {
            list: false,
            type: 'string',
            order: 17,
            title: 'Hospital'
          }
        },
        deviceTypeExternalId: 'AbbottM2000',
        diseaseId: '3',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '3',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '3',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '4',
            name: 'Indeterminate',
            i18nKey: 'resultCategoryIndeterminate',
            externalId: 'Indeterminate',
            assayId: '3',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '3',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '3',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '13',
            name: '< 150',
            i18nKey: 'resultCategoryLessThan150',
            externalId: 'LessThan150',
            assayId: '3',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '14',
            name: '>= 150',
            i18nKey: 'resultCategoryMoreThan150',
            externalId: 'MoreThan150',
            assayId: '3',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '15',
            name: '< 550',
            i18nKey: 'resultCategoryLessThan550',
            externalId: 'LessThan550',
            assayId: '3',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '16',
            name: '>= 550',
            i18nKey: 'resultCategoryMoreThan550',
            externalId: 'MoreThan550',
            assayId: '3',
            emphasize: 1,
            requirestreatment: 1
          }
        ],
        id: '3',
        deviceTypeName: 'm2000',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'HIV',
        assayTypeName: 'HIV VL'
      },
      {
        assayTypeAbbreviation: 'HIV',
        i18nKey: 'AssayAbbottM2000HivEid',
        externalId: 'abbottM2000HIVEID',
        resultDataSchema: {
          collectedBy: {
            type: 'string',
            title: 'Sample Collected By'
          },
          referenceRanges: {
            type: 'string',
            title: 'Reference Ranges'
          },
          resultUnit: {
            type: 'string',
            title: 'Result Unit'
          },
          actionCode: {
            type: 'string',
            title: 'Action'
          },
          assayName: {
            type: 'string',
            title: 'Assay Name'
          },
          priority: {
            type: 'string',
            title: 'Priority'
          },
          qualityControlSummary: {
            type: 'object',
            title: 'Quality Control Summary',
            properties: {
              negativeControl: {
                type: 'object',
                title: 'Negative Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  }
                }
              },
              positiveControl: {
                type: 'object',
                title: 'Positive Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'number',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text'
          },
          messageIsComplete: {
            type: 'bool',
            title: 'Message Complete'
          },
          finalResultAbnormalFlags: {
            type: 'array',
            title: 'Final Result Abnormal Flags'
          },
          preliminaryResultAbnormalFlags: {
            type: 'array',
            title: 'Preliminary Result Abnormal Flags'
          },
          orderOperatorId: {
            type: 'string',
            title: 'Ordered By'
          },
          reportType: {
            type: 'string',
            title: 'Report Type'
          },
          passedQualityControl: {
            type: 'bool',
            title: 'Passed Quality Control'
          },
          resultStatus: {
            type: 'string',
            title: 'Status'
          },
          assayProtocol: {
            type: 'string',
            title: 'Assay Protocol'
          },
          typeOfMessage: {
            type: 'string',
            title: 'Message Type'
          },
          resultType: {
            type: 'string',
            title: 'Result Type'
          },
          testQualifier: {
            type: 'string',
            title: 'Test Qualifier'
          },
          controlConsumableLotNumber: {
            type: 'string',
            title: 'Quality Control Consumable Lot'
          },
          messageSentOn: {
            type: 'time',
            title: 'Message Sent On'
          }
        },
        abilities: [
          {
            assayId: '4',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '4',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '4',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '4',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '4',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '4',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '4',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Abbott m2000 HIV EID',
        resultCategory1i18nKey: 'resultCategoryEid',
        deviceTypeId: '1',
        assayTypeId: '5',
        abbreviation: 'm2000 HIV EID',
        patientDataSchema: {
          isolationStatus: {
            list: false,
            type: 'string',
            order: 16,
            title: 'Isolation Status'
          },
          gender: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Gender'
          },
          attendingPhysician: {
            list: false,
            type: 'string',
            order: 9,
            title: 'Attending Physician'
          },
          practicePatientId: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Practice Patient ID'
          },
          height: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Height'
          },
          name: {
            list: false,
            type: 'string',
            order: 3,
            title: 'Name'
          },
          phone: {
            list: false,
            type: 'string',
            order: 8,
            title: 'Phone'
          },
          admissionOrDischargeDates: {
            list: false,
            type: 'date',
            order: 13,
            title: 'Admission/Discharge Date'
          },
          diet: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Diet'
          },
          address: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Address'
          },
          dosageCategory: {
            list: false,
            type: 'string',
            order: 18,
            title: 'Dosage Category'
          },
          ethnicOrigin: {
            list: false,
            type: 'string',
            order: 6,
            title: 'Ethnicity'
          },
          location: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Location'
          },
          weight: {
            list: false,
            type: 'string',
            order: 11,
            title: 'Weight'
          },
          additionalPatientId: {
            list: false,
            type: 'string',
            order: 2,
            title: 'Additional Patient ID'
          },
          dateOfBirth: {
            list: false,
            type: 'date',
            order: 4,
            title: 'Date of Birth'
          },
          id: {
            list: true,
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          admissionStatus: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Admission Status'
          },
          hospitalInstitution: {
            list: false,
            type: 'string',
            order: 17,
            title: 'Hospital'
          }
        },
        deviceTypeExternalId: 'AbbottM2000',
        diseaseId: '3',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '4',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '4',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '4',
            name: 'Indeterminate',
            i18nKey: 'resultCategoryIndeterminate',
            externalId: 'Indeterminate',
            assayId: '4',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '4',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '4',
            emphasize: 1,
            requirestreatment: 0
          }
        ],
        id: '4',
        deviceTypeName: 'm2000',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'HIV',
        assayTypeName: 'HIV Qual'
      },
      {
        assayTypeAbbreviation: 'HBV',
        i18nKey: 'abbottM2000PlasmaHbvVL',
        externalId: 'abbottM2000PlasmaHbvVL',
        resultDataSchema: {
          collectedBy: {
            type: 'string',
            title: 'Sample Collected By'
          },
          referenceRanges: {
            type: 'string',
            title: 'Reference Ranges'
          },
          resultUnit: {
            type: 'string',
            title: 'Result Unit'
          },
          actionCode: {
            type: 'string',
            title: 'Action'
          },
          assayName: {
            type: 'string',
            title: 'Assay Name'
          },
          priority: {
            type: 'string',
            title: 'Priority'
          },
          qualityControlSummary: {
            type: 'object',
            title: 'Quality Control Summary',
            properties: {
              negativeControl: {
                type: 'object',
                title: 'Negative Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              },
              lowPositiveControl: {
                type: 'object',
                title: 'Low Positive Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              },
              highPositiveControl: {
                type: 'object',
                title: 'High Positive Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text'
          },
          messageIsComplete: {
            type: 'bool',
            title: 'Message Complete'
          },
          finalResultAbnormalFlags: {
            type: 'array',
            title: 'Final Result Abnormal Flags'
          },
          preliminaryResultAbnormalFlags: {
            type: 'array',
            title: 'Preliminary Result Abnormal Flags'
          },
          orderOperatorId: {
            type: 'string',
            title: 'Ordered By'
          },
          reportType: {
            type: 'string',
            title: 'Report Type'
          },
          passedQualityControl: {
            type: 'bool',
            title: 'Passed Quality Control'
          },
          resultStatus: {
            type: 'string',
            title: 'Status'
          },
          assayProtocol: {
            type: 'string',
            title: 'Assay Protocol'
          },
          typeOfMessage: {
            type: 'string',
            title: 'Message Type'
          },
          resultType: {
            type: 'string',
            title: 'Result Type'
          },
          testQualifier: {
            type: 'string',
            title: 'Test Qualifier'
          },
          controlConsumableLotNumber: {
            type: 'string',
            title: 'Quality Control Consumable Lot'
          },
          messageSentOn: {
            type: 'time',
            title: 'Message Sent On'
          }
        },
        abilities: [
          {
            assayId: '2',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '2',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '2',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '2',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '2',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '2',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '2',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Abbott m2000 Plasma HBV VL',
        resultCategory1i18nKey: 'resultCategoryHbvVl',
        deviceTypeId: '1',
        assayTypeId: '4',
        abbreviation: 'M2000 Plasma HBV VL',
        patientDataSchema: {
          isolationStatus: {
            list: false,
            type: 'string',
            order: 16,
            title: 'Isolation Status'
          },
          gender: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Gender'
          },
          attendingPhysician: {
            list: false,
            type: 'string',
            order: 9,
            title: 'Attending Physician'
          },
          practicePatientId: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Practice Patient ID'
          },
          height: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Height'
          },
          name: {
            list: false,
            type: 'string',
            order: 3,
            title: 'Name'
          },
          phone: {
            list: false,
            type: 'string',
            order: 8,
            title: 'Phone'
          },
          admissionOrDischargeDates: {
            list: false,
            type: 'date',
            order: 13,
            title: 'Admission/Discharge Date'
          },
          diet: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Diet'
          },
          address: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Address'
          },
          dosageCategory: {
            list: false,
            type: 'string',
            order: 18,
            title: 'Dosage Category'
          },
          ethnicOrigin: {
            list: false,
            type: 'string',
            order: 6,
            title: 'Ethnicity'
          },
          location: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Location'
          },
          weight: {
            list: false,
            type: 'string',
            order: 11,
            title: 'Weight'
          },
          additionalPatientId: {
            list: false,
            type: 'string',
            order: 2,
            title: 'Additional Patient ID'
          },
          dateOfBirth: {
            list: false,
            type: 'date',
            order: 4,
            title: 'Date of Birth'
          },
          id: {
            list: true,
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          admissionStatus: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Admission Status'
          },
          hospitalInstitution: {
            list: false,
            type: 'string',
            order: 17,
            title: 'Hospital'
          }
        },
        deviceTypeExternalId: 'AbbottM2000',
        diseaseId: '4',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '2',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '2',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '4',
            name: 'Indeterminate',
            i18nKey: 'resultCategoryIndeterminate',
            externalId: 'Indeterminate',
            assayId: '2',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '2',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '2',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '11',
            name: '< 40',
            i18nKey: 'resultCategoryLessThan40',
            externalId: 'LessThan40',
            assayId: '2',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '12',
            name: '>= 40',
            i18nKey: 'resultCategoryMoreThan40',
            externalId: 'MoreThan40',
            assayId: '2',
            emphasize: 1,
            requirestreatment: 1
          }
        ],
        id: '2',
        deviceTypeName: 'm2000',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'HBV',
        assayTypeName: 'HBV VL'
      },
      {
        assayTypeAbbreviation: 'HIV',
        i18nKey: 'abbottM2000PlasmaHivVL',
        externalId: 'abbottM2000PlasmaHivVL',
        resultDataSchema: {
          collectedBy: {
            type: 'string',
            title: 'Sample Collected By'
          },
          referenceRanges: {
            type: 'string',
            title: 'Reference Ranges'
          },
          resultUnit: {
            type: 'string',
            title: 'Result Unit'
          },
          actionCode: {
            type: 'string',
            title: 'Action'
          },
          assayName: {
            type: 'string',
            title: 'Assay Name'
          },
          priority: {
            type: 'string',
            title: 'Priority'
          },
          qualityControlSummary: {
            type: 'object',
            title: 'Quality Control Summary',
            properties: {
              negativeControl: {
                type: 'object',
                title: 'Negative Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              },
              lowPositiveControl: {
                type: 'object',
                title: 'Low Positive Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              },
              highPositiveControl: {
                type: 'object',
                title: 'High Positive Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text'
          },
          messageIsComplete: {
            type: 'bool',
            title: 'Message Complete'
          },
          finalResultAbnormalFlags: {
            type: 'array',
            title: 'Final Result Abnormal Flags'
          },
          preliminaryResultAbnormalFlags: {
            type: 'array',
            title: 'Preliminary Result Abnormal Flags'
          },
          orderOperatorId: {
            type: 'string',
            title: 'Ordered By'
          },
          reportType: {
            type: 'string',
            title: 'Report Type'
          },
          passedQualityControl: {
            type: 'bool',
            title: 'Passed Quality Control'
          },
          resultStatus: {
            type: 'string',
            title: 'Status'
          },
          assayProtocol: {
            type: 'string',
            title: 'Assay Protocol'
          },
          typeOfMessage: {
            type: 'string',
            title: 'Message Type'
          },
          resultType: {
            type: 'string',
            title: 'Result Type'
          },
          testQualifier: {
            type: 'string',
            title: 'Test Qualifier'
          },
          controlConsumableLotNumber: {
            type: 'string',
            title: 'Quality Control Consumable Lot'
          },
          messageSentOn: {
            type: 'time',
            title: 'Message Sent On'
          }
        },
        abilities: [
          {
            assayId: '1',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '1',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '1',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '1',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '1',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '1',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '1',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Abbott m2000 Plasma HIV VL',
        resultCategory1i18nKey: 'resultCategoryHivVl',
        deviceTypeId: '1',
        assayTypeId: '3',
        abbreviation: 'M2000 Plasma HIV VL',
        patientDataSchema: {
          isolationStatus: {
            list: false,
            type: 'string',
            order: 16,
            title: 'Isolation Status'
          },
          gender: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Gender'
          },
          attendingPhysician: {
            list: false,
            type: 'string',
            order: 9,
            title: 'Attending Physician'
          },
          practicePatientId: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Practice Patient ID'
          },
          height: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Height'
          },
          name: {
            list: false,
            type: 'string',
            order: 3,
            title: 'Name'
          },
          phone: {
            list: false,
            type: 'string',
            order: 8,
            title: 'Phone'
          },
          admissionOrDischargeDates: {
            list: false,
            type: 'date',
            order: 13,
            title: 'Admission/Discharge Date'
          },
          diet: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Diet'
          },
          address: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Address'
          },
          dosageCategory: {
            list: false,
            type: 'string',
            order: 18,
            title: 'Dosage Category'
          },
          ethnicOrigin: {
            list: false,
            type: 'string',
            order: 6,
            title: 'Ethnicity'
          },
          location: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Location'
          },
          weight: {
            list: false,
            type: 'string',
            order: 11,
            title: 'Weight'
          },
          additionalPatientId: {
            list: false,
            type: 'string',
            order: 2,
            title: 'Additional Patient ID'
          },
          dateOfBirth: {
            list: false,
            type: 'date',
            order: 4,
            title: 'Date of Birth'
          },
          id: {
            list: true,
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          admissionStatus: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Admission Status'
          },
          hospitalInstitution: {
            list: false,
            type: 'string',
            order: 17,
            title: 'Hospital'
          }
        },
        deviceTypeExternalId: 'AbbottM2000',
        diseaseId: '3',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '1',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '1',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '4',
            name: 'Indeterminate',
            i18nKey: 'resultCategoryIndeterminate',
            externalId: 'Indeterminate',
            assayId: '1',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '1',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '1',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '11',
            name: '< 40',
            i18nKey: 'resultCategoryLessThan40',
            externalId: 'LessThan40',
            assayId: '1',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '12',
            name: '>= 40',
            i18nKey: 'resultCategoryMoreThan40',
            externalId: 'MoreThan40',
            assayId: '1',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '13',
            name: '< 150',
            i18nKey: 'resultCategoryLessThan150',
            externalId: 'LessThan150',
            assayId: '1',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '14',
            name: '>= 150',
            i18nKey: 'resultCategoryMoreThan150',
            externalId: 'MoreThan150',
            assayId: '1',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '15',
            name: '< 550',
            i18nKey: 'resultCategoryLessThan550',
            externalId: 'LessThan550',
            assayId: '1',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '16',
            name: '>= 550',
            i18nKey: 'resultCategoryMoreThan550',
            externalId: 'MoreThan550',
            assayId: '1',
            emphasize: 1,
            requirestreatment: 1
          }
        ],
        id: '1',
        deviceTypeName: 'm2000',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'HIV',
        assayTypeName: 'HIV VL'
      },
      {
        assayTypeAbbreviation: 'HIV',
        i18nKey: 'assayAlereQHiv12Detect',
        externalId: 'assayAlereQHiv12Detect',
        resultDataSchema: {
          operator: {
            list: true,
            type: 'string',
            order: 10,
            title: 'Operator'
          },
          sampleId: {
            list: true,
            type: 'string',
            order: 5,
            title: 'Sample ID'
          },
          cartridgeId: {
            list: true,
            type: 'string',
            order: 4,
            title: 'Cartridge ID'
          },
          hiv2PositiveControl: {
            list: false,
            type: 'string',
            order: 15,
            title: 'HIV-2 Positive Control'
          },
          hiv1PositiveControl: {
            list: false,
            type: 'string',
            order: 14,
            title: 'HIV-1 Positive Control'
          },
          negativeControl: {
            list: false,
            type: 'string',
            order: 16,
            title: 'Negative Control'
          },
          deviceSerial: {
            list: true,
            type: 'string',
            order: 2,
            title: 'Device Serial'
          },
          analysisCheck: {
            list: false,
            type: 'string',
            order: 17,
            title: 'Analysis Check'
          },
          hiv1OResult: {
            list: true,
            type: 'string',
            order: 7,
            title: 'HIV-1 O'
          },
          softwareVersion: {
            list: false,
            type: 'string',
            order: 18,
            title: 'Device Software Version'
          },
          deviceCheck: {
            list: false,
            type: 'string',
            order: 13,
            title: 'Device Check'
          },
          errorCode: {
            list: true,
            type: 'string',
            order: 9,
            title: 'Error Code'
          },
          timeStamp: {
            list: true,
            type: 'time',
            order: 11,
            title: 'Timestamp'
          },
          sourceFile: {
            list: false,
            type: 'string',
            order: 19,
            title: 'Source File'
          },
          hiv1MNResult: {
            list: true,
            type: 'string',
            order: 6,
            title: 'HIV-1 M/N'
          },
          hiv2Result: {
            list: true,
            type: 'string',
            order: 8,
            title: 'HIV-2'
          },
          pickedUpOn: {
            list: false,
            type: 'time',
            order: 20,
            title: 'Picked Up On'
          },
          sampleDetection: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Sample Detection Check'
          },
          testName: {
            list: true,
            type: 'string',
            order: 3,
            title: 'Test Name'
          },
          resultNo: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Result No'
          }
        },
        abilities: [
          {
            assayId: '24',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '24',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '24',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '24',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '24',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '24',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '24',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Alere Q HIV-1/2 Detect',
        resultCategory1i18nKey: null,
        deviceTypeId: '3',
        assayTypeId: '5',
        abbreviation: 'Q HIV detect',
        patientDataSchema: {
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          ward: {
            type: 'string',
            order: 3,
            title: 'Ward'
          },
          surname: {
            type: 'string',
            order: 2,
            title: 'Surname'
          },
          firstName: {
            type: 'string',
            order: 1,
            title: 'First Name'
          },
          hospitalNumber: {
            type: 'string',
            order: 4,
            title: 'Hospital Number'
          }
        },
        deviceTypeExternalId: 'AlereQ',
        diseaseId: '3',
        id: '24',
        deviceTypeName: 'Alere Q',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'Result',
        assayTypeName: 'HIV Qual'
      },
      {
        assayTypeAbbreviation: 'HIV',
        i18nKey: 'assayAlereQHiv12VLPlasma',
        externalId: 'assayAlereQHiv12VLPlasma',
        resultDataSchema: {
          operator: {
            list: true,
            type: 'string',
            order: 10,
            title: 'Operator'
          },
          sampleId: {
            list: true,
            type: 'string',
            order: 5,
            title: 'Sample ID'
          },
          cartridgeId: {
            list: true,
            type: 'string',
            order: 4,
            title: 'Cartridge ID'
          },
          hiv2PositiveControl: {
            list: false,
            type: 'string',
            order: 15,
            title: 'HIV-2 Positive Control'
          },
          hiv1PositiveControl: {
            list: false,
            type: 'string',
            order: 14,
            title: 'HIV-1 Positive Control'
          },
          negativeControl: {
            list: false,
            type: 'string',
            order: 16,
            title: 'Negative Control'
          },
          deviceSerial: {
            list: true,
            type: 'string',
            order: 2,
            title: 'Device Serial'
          },
          analysisCheck: {
            list: false,
            type: 'string',
            order: 17,
            title: 'Analysis Check'
          },
          hiv1OResult: {
            list: true,
            type: 'string',
            order: 7,
            title: 'HIV-1 O cp/mL'
          },
          softwareVersion: {
            list: false,
            type: 'string',
            order: 18,
            title: 'Device Software Version'
          },
          deviceCheck: {
            list: false,
            type: 'string',
            order: 13,
            title: 'Device Check'
          },
          status: {
            list: false,
            type: 'string',
            order: 20,
            title: 'Status'
          },
          errorCode: {
            list: true,
            type: 'string',
            order: 9,
            title: 'Error Code'
          },
          timeStamp: {
            list: true,
            type: 'time',
            order: 11,
            title: 'Timestamp'
          },
          sourceFile: {
            list: false,
            type: 'string',
            order: 21,
            title: 'Source File'
          },
          deviceMode: {
            list: false,
            type: 'string',
            order: 19,
            title: 'Device Mode'
          },
          hiv1MNResult: {
            list: true,
            type: 'string',
            order: 6,
            title: 'HIV-1 M/N cp/mL'
          },
          hiv2Result: {
            list: true,
            type: 'string',
            order: 8,
            title: 'HIV-2 cp/mL'
          },
          pickedUpOn: {
            list: false,
            type: 'time',
            order: 22,
            title: 'Picked Up On'
          },
          sampleDetection: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Sample Detection Check'
          },
          testName: {
            list: true,
            type: 'string',
            order: 3,
            title: 'Test Name'
          },
          resultNo: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Result No'
          }
        },
        abilities: [
          {
            assayId: '25',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '25',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '25',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '25',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '25',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '25',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '25',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Alere Q HIV-1/2 VL plasma',
        resultCategory1i18nKey: null,
        deviceTypeId: '3',
        assayTypeId: '3',
        abbreviation: 'Q HIV Plasma',
        patientDataSchema: {
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          ward: {
            type: 'string',
            order: 3,
            title: 'Ward'
          },
          surname: {
            type: 'string',
            order: 2,
            title: 'Surname'
          },
          firstName: {
            type: 'string',
            order: 1,
            title: 'First Name'
          },
          hospitalNumber: {
            type: 'string',
            order: 4,
            title: 'Hospital Number'
          }
        },
        deviceTypeExternalId: 'AlereQ',
        diseaseId: '3',
        id: '25',
        deviceTypeName: 'Alere Q',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'Result',
        assayTypeName: 'HIV VL'
      },
      {
        assayTypeAbbreviation: 'TB',
        i18nKey: 'assayBdMgitAst',
        externalId: 'assayBdMgitAst',
        resultDataSchema: {
          senderName: {
            list: false,
            type: 'string',
            order: 9,
            title: 'Sender Name'
          },
          versionNumber: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Version Number'
          },
          instrumentType: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Instrument Type'
          },
          INH: {
            list: false,
            type: 'object',
            order: 5,
            title: 'INH',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          resultTypeCode: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Result Type Code'
          },
          EM: {
            list: false,
            type: 'object',
            order: 3,
            title: 'EM',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          testId: {
            list: false,
            type: 'string',
            order: 13,
            title: 'Test ID'
          },
          RIF: {
            list: false,
            type: 'object',
            order: 1,
            title: 'RIF',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          RA: {
            list: false,
            type: 'object',
            order: 4,
            title: 'RA',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          instrumentNumber: {
            list: false,
            type: 'string',
            order: 11,
            title: 'Instrument Number'
          },
          preliminaryFinalStatus: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Preliminary/Final'
          },
          senaiteResult: {
            list: false,
            type: 'object',
            order: 19,
            title: 'Senaite LIMS Result',
            properties: {
              analyst: {
                type: 'string',
                order: 14,
                title: 'Analyst'
              },
              verificators: {
                type: 'string',
                order: 15,
                title: 'Verificators'
              },
              retested: {
                type: 'number',
                order: 1,
                title: 'Retested'
              },
              unit: {
                type: 'string',
                order: 7,
                title: 'Unit'
              },
              testReviewState: {
                type: 'string',
                order: 16,
                title: 'Test Review State'
              },
              instrument: {
                type: 'string',
                order: 10,
                title: 'Instrument'
              },
              hidden: {
                type: 'number',
                order: 12,
                title: 'Hidden'
              },
              resultText: {
                type: 'string',
                order: 3,
                title: 'Result Text'
              },
              modificationDate: {
                type: 'time',
                order: 20,
                title: 'Modified On'
              },
              creator: {
                type: 'string',
                order: 18,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 19,
                title: 'Created On'
              },
              worksheetAnalysisReviewState: {
                type: 'string',
                order: 17,
                title: 'Worksheet Analysis Review State'
              },
              value: {
                type: 'string',
                order: 4,
                title: 'Result Value'
              },
              remarks: {
                type: 'string',
                order: 6,
                title: 'Remarks'
              },
              manualEntryOfResults: {
                type: 'string',
                order: 9,
                title: 'Sample Partition ID'
              },
              instrumentEntryOfResults: {
                type: 'number',
                order: 11,
                title: 'Entered by Instrument'
              },
              resultCaptureDate: {
                type: 'time',
                order: 5,
                title: 'Capture date'
              },
              title: {
                type: 'string',
                order: 0,
                title: 'Test Type'
              },
              result: {
                type: 'string',
                order: 2,
                title: 'Selected Result'
              },
              hiddenManually: {
                type: 'number',
                order: 13,
                title: 'Hidden Manually'
              },
              pointOfCapture: {
                type: 'string',
                order: 8,
                title: 'Point of Capture'
              }
            }
          },
          S: {
            list: false,
            type: 'object',
            order: 2,
            title: 'S',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          isolateNumber: {
            list: false,
            type: 'number',
            order: 8,
            title: 'Isolate Number'
          },
          EMB: {
            list: false,
            type: 'object',
            order: 0,
            title: 'EMB',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          instrumentLocation: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Specimen Instrument Location'
          },
          senaiteAnalysisRequest: {
            list: false,
            type: 'object',
            order: 16,
            title: 'Senaite LIMS Analysis Request',
            properties: {
              priority: {
                type: 'number',
                order: 1,
                title: 'Priority'
              },
              creatorFullName: {
                type: 'string',
                order: 6,
                title: 'Created By (Name)'
              },
              profile: {
                type: 'string',
                order: 0,
                title: 'Profile'
              },
              modificationDate: {
                type: 'time',
                order: 9,
                title: 'Modified On'
              },
              printed: {
                type: 'number',
                order: 4,
                title: 'Printed'
              },
              creator: {
                type: 'string',
                order: 5,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 8,
                title: 'Created On'
              },
              creatorEmail: {
                type: 'string',
                order: 7,
                title: 'Created By (Email)'
              },
              dateVerified: {
                type: 'time',
                order: 3,
                title: 'verified On'
              },
              doctorTitle: {
                type: 'string',
                order: 2,
                title: 'Doctor Title'
              }
            }
          },
          senaiteReferringFacility: {
            list: false,
            type: 'object',
            order: 17,
            title: 'Senaite LIMS Referring Facility',
            properties: {
              contactEmail: {
                type: 'string',
                order: 1,
                title: 'Contact Email'
              },
              contactFullName: {
                type: 'string',
                order: 0,
                title: 'Contact Name'
              }
            }
          },
          protocolLength: {
            list: false,
            type: 'number',
            order: 6,
            title: 'Protocol Length'
          },
          senaiteSample: {
            list: false,
            type: 'object',
            order: 18,
            title: 'Senaite LIMS Sample',
            properties: {
              volume: {
                type: 'string',
                order: 3,
                title: 'Volume'
              },
              appearance: {
                type: 'string',
                order: 1,
                title: 'Appearance'
              },
              receivedBy: {
                type: 'string',
                order: 6,
                title: 'Received By'
              },
              partitionId: {
                type: 'string',
                order: 0,
                title: 'Sample Partition ID'
              },
              dateReceived: {
                type: 'time',
                order: 5,
                title: 'Date Received'
              },
              samplerEmail: {
                type: 'string',
                order: 7,
                title: 'Sampler Email'
              },
              volumeRemarks: {
                type: 'string',
                order: 4,
                title: 'Volume Remarks'
              },
              appearanceRemarks: {
                type: 'string',
                order: 2,
                title: 'Appearance Remarks'
              }
            }
          }
        },
        abilities: [
          {
            assayId: '6',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '6',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '6',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '6',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '6',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '6',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '6',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'BD MGIT AST',
        resultCategory1i18nKey: null,
        deviceTypeId: '8',
        assayTypeId: '12',
        abbreviation: 'MGIT AST',
        patientDataSchema: {
          xpertMtbRifResult: {
            type: 'string',
            order: 8,
            title: 'XPERT MTB RIF Result'
          },
          gender: {
            type: 'string',
            order: 2,
            title: 'Sex'
          },
          contactDetails: {
            type: 'string',
            order: 7,
            title: 'Contact Details'
          },
          lpaFl: {
            type: 'string',
            order: 5,
            title: 'LPA FL'
          },
          dateStartedOnTreatment: {
            type: 'string',
            order: 9,
            title: 'Date Started on TX'
          },
          site: {
            type: 'string',
            order: 5,
            title: 'Site'
          },
          baselineCulture: {
            type: 'string',
            order: 10,
            title: 'Baseline Culture'
          },
          name: {
            type: 'string',
            order: 0,
            title: 'Name of patient'
          },
          mgitSire: {
            type: 'string',
            order: 12,
            title: 'MGIT SIRE'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'Province'
          },
          lpaSl: {
            type: 'string',
            order: 11,
            title: 'LPA SL'
          },
          referringFacilitySampleId: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Sample ID from Referring Facility'
          },
          dateOfBirth: {
            type: 'string',
            order: 3,
            title: 'Date of Birth'
          },
          focalPerson: {
            type: 'string',
            order: 6,
            title: 'Focal Person'
          },
          id: {
            list: true,
            type: 'string',
            order: 13,
            title: 'Patient ID'
          },
          referringFacilityPatientName: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Patient Name from Referring Facility'
          },
          age: {
            type: 'number',
            order: 1,
            title: 'Age'
          }
        },
        deviceTypeExternalId: 'BDMGIT',
        diseaseId: '1',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '6',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '6',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '6',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '8',
            name: 'Success',
            i18nKey: 'resultCategorySuccess',
            externalId: 'Success',
            assayId: '6',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '20',
            name: 'Missing',
            i18nKey: 'resultCategoryMissing',
            externalId: 'Missing',
            assayId: '6',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '21',
            name: 'Unknown',
            i18nKey: 'resultCategoryUnknown',
            externalId: 'Unknown',
            assayId: '6',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '22',
            name: 'Susceptible',
            i18nKey: 'resultCategorySusceptible',
            externalId: 'Susceptible',
            assayId: '6',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '23',
            name: 'Resistant',
            i18nKey: 'resultCategoryResistant',
            externalId: 'Resistant',
            assayId: '6',
            emphasize: 0,
            requirestreatment: 0
          }
        ],
        id: '6',
        deviceTypeName: 'BD MGIT',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'Result',
        assayTypeName: 'TB AST'
      },
      {
        assayTypeAbbreviation: 'TB',
        i18nKey: 'assayBdMgitGnd',
        externalId: 'assayBdMgitGnd',
        resultDataSchema: {
          senderName: {
            list: false,
            type: 'string',
            order: 3,
            title: 'Sender Name'
          },
          versionNumber: {
            list: false,
            type: 'string',
            order: 6,
            title: 'Version Number'
          },
          instrumentType: {
            list: false,
            type: 'string',
            order: 4,
            title: 'Instrument Type'
          },
          resultTypeCode: {
            list: false,
            type: 'string',
            order: 8,
            title: 'Result Type Code'
          },
          testId: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Test ID'
          },
          instrumentNumber: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Instrument Number'
          },
          preliminaryFinalStatus: {
            list: false,
            type: 'string',
            order: 9,
            title: 'Preliminary/Final'
          },
          senaiteResult: {
            list: false,
            type: 'object',
            order: 13,
            title: 'Senaite LIMS Result',
            properties: {
              analyst: {
                type: 'string',
                order: 14,
                title: 'Analyst'
              },
              verificators: {
                type: 'string',
                order: 15,
                title: 'Verificators'
              },
              retested: {
                type: 'number',
                order: 1,
                title: 'Retested'
              },
              unit: {
                type: 'string',
                order: 7,
                title: 'Unit'
              },
              testReviewState: {
                type: 'string',
                order: 16,
                title: 'Test Review State'
              },
              instrument: {
                type: 'string',
                order: 10,
                title: 'Instrument'
              },
              hidden: {
                type: 'number',
                order: 12,
                title: 'Hidden'
              },
              resultText: {
                type: 'string',
                order: 3,
                title: 'Result Text'
              },
              modificationDate: {
                type: 'time',
                order: 20,
                title: 'Modified On'
              },
              creator: {
                type: 'string',
                order: 18,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 19,
                title: 'Created On'
              },
              worksheetAnalysisReviewState: {
                type: 'string',
                order: 17,
                title: 'Worksheet Analysis Review State'
              },
              value: {
                type: 'string',
                order: 4,
                title: 'Result Value'
              },
              remarks: {
                type: 'string',
                order: 6,
                title: 'Remarks'
              },
              manualEntryOfResults: {
                type: 'string',
                order: 9,
                title: 'Sample Partition ID'
              },
              instrumentEntryOfResults: {
                type: 'number',
                order: 11,
                title: 'Entered by Instrument'
              },
              resultCaptureDate: {
                type: 'time',
                order: 5,
                title: 'Capture date'
              },
              title: {
                type: 'string',
                order: 0,
                title: 'Test Type'
              },
              result: {
                type: 'string',
                order: 2,
                title: 'Selected Result'
              },
              hiddenManually: {
                type: 'number',
                order: 13,
                title: 'Hidden Manually'
              },
              pointOfCapture: {
                type: 'string',
                order: 8,
                title: 'Point of Capture'
              }
            }
          },
          isolateNumber: {
            list: false,
            type: 'number',
            order: 2,
            title: 'Isolate Number'
          },
          instrumentLocation: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Specimen Instrument Location'
          },
          senaiteAnalysisRequest: {
            list: false,
            type: 'object',
            order: 10,
            title: 'Senaite LIMS Analysis Request',
            properties: {
              priority: {
                type: 'number',
                order: 1,
                title: 'Priority'
              },
              creatorFullName: {
                type: 'string',
                order: 6,
                title: 'Created By (Name)'
              },
              profile: {
                type: 'string',
                order: 0,
                title: 'Profile'
              },
              modificationDate: {
                type: 'time',
                order: 9,
                title: 'Modified On'
              },
              printed: {
                type: 'number',
                order: 4,
                title: 'Printed'
              },
              creator: {
                type: 'string',
                order: 5,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 8,
                title: 'Created On'
              },
              creatorEmail: {
                type: 'string',
                order: 7,
                title: 'Created By (Email)'
              },
              dateVerified: {
                type: 'time',
                order: 3,
                title: 'verified On'
              },
              doctorTitle: {
                type: 'string',
                order: 2,
                title: 'Doctor Title'
              }
            }
          },
          senaiteReferringFacility: {
            list: false,
            type: 'object',
            order: 11,
            title: 'Senaite LIMS Referring Facility',
            properties: {
              contactEmail: {
                type: 'string',
                order: 1,
                title: 'Contact Email'
              },
              contactFullName: {
                type: 'string',
                order: 0,
                title: 'Contact Name'
              }
            }
          },
          protocolLength: {
            list: false,
            type: 'number',
            order: 0,
            title: 'Protocol Length'
          },
          senaiteSample: {
            list: false,
            type: 'object',
            order: 12,
            title: 'Senaite LIMS Sample',
            properties: {
              volume: {
                type: 'string',
                order: 3,
                title: 'Volume'
              },
              appearance: {
                type: 'string',
                order: 1,
                title: 'Appearance'
              },
              receivedBy: {
                type: 'string',
                order: 6,
                title: 'Received By'
              },
              partitionId: {
                type: 'string',
                order: 0,
                title: 'Sample Partition ID'
              },
              dateReceived: {
                type: 'time',
                order: 5,
                title: 'Date Received'
              },
              samplerEmail: {
                type: 'string',
                order: 7,
                title: 'Sampler Email'
              },
              volumeRemarks: {
                type: 'string',
                order: 4,
                title: 'Volume Remarks'
              },
              appearanceRemarks: {
                type: 'string',
                order: 2,
                title: 'Appearance Remarks'
              }
            }
          }
        },
        abilities: [
          {
            assayId: '7',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '7',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '7',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '7',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '7',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '7',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '7',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'BD MGIT GND',
        resultCategory1i18nKey: null,
        deviceTypeId: '8',
        assayTypeId: '13',
        abbreviation: 'MGIT GND',
        patientDataSchema: {
          xpertMtbRifResult: {
            type: 'string',
            order: 8,
            title: 'XPERT MTB RIF Result'
          },
          gender: {
            type: 'string',
            order: 2,
            title: 'Sex'
          },
          contactDetails: {
            type: 'string',
            order: 7,
            title: 'Contact Details'
          },
          lpaFl: {
            type: 'string',
            order: 5,
            title: 'LPA FL'
          },
          dateStartedOnTreatment: {
            type: 'string',
            order: 9,
            title: 'Date Started on TX'
          },
          site: {
            type: 'string',
            order: 5,
            title: 'Site'
          },
          baselineCulture: {
            type: 'string',
            order: 10,
            title: 'Baseline Culture'
          },
          name: {
            type: 'string',
            order: 0,
            title: 'Name of patient'
          },
          mgitSire: {
            type: 'string',
            order: 12,
            title: 'MGIT SIRE'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'Province'
          },
          lpaSl: {
            type: 'string',
            order: 11,
            title: 'LPA SL'
          },
          referringFacilitySampleId: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Sample ID from Referring Facility'
          },
          dateOfBirth: {
            type: 'string',
            order: 3,
            title: 'Date of Birth'
          },
          focalPerson: {
            type: 'string',
            order: 6,
            title: 'Focal Person'
          },
          id: {
            list: true,
            type: 'string',
            order: 13,
            title: 'Patient ID'
          },
          referringFacilityPatientName: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Patient Name from Referring Facility'
          },
          age: {
            type: 'number',
            order: 1,
            title: 'Age'
          }
        },
        deviceTypeExternalId: 'BDMGIT',
        diseaseId: '1',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '7',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '7',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '7',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '8',
            name: 'Success',
            i18nKey: 'resultCategorySuccess',
            externalId: 'Success',
            assayId: '7',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '20',
            name: 'Missing',
            i18nKey: 'resultCategoryMissing',
            externalId: 'Missing',
            assayId: '7',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '21',
            name: 'Unknown',
            i18nKey: 'resultCategoryUnknown',
            externalId: 'Unknown',
            assayId: '7',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '24',
            name: 'Negative',
            i18nKey: 'resultCategoryNegative',
            externalId: 'Negative',
            assayId: '7',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '33',
            name: 'Positive',
            i18nKey: 'resultCategoryPositive',
            externalId: 'Positive',
            assayId: '7',
            emphasize: 1,
            requirestreatment: 1
          }
        ],
        id: '7',
        deviceTypeName: 'BD MGIT',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'Result',
        assayTypeName: 'TB G&D'
      },
      {
        assayTypeAbbreviation: 'HIV',
        i18nKey: 'assayCobasHivVl',
        externalId: 'assayCobasHivVl',
        resultDataSchema: {
          collectedBy: {
            type: 'string',
            title: 'Sample Collected By'
          },
          referenceRanges: {
            type: 'string',
            title: 'Reference Ranges'
          },
          resultUnit: {
            type: 'string',
            title: 'Result Unit'
          },
          actionCode: {
            type: 'string',
            title: 'Action'
          },
          assayName: {
            type: 'string',
            title: 'Assay Name'
          },
          priority: {
            type: 'string',
            title: 'Priority'
          },
          qualityControlSummary: {
            type: 'object',
            title: 'Quality Control Summary',
            properties: {
              negativeControl: {
                type: 'object',
                title: 'Negative Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              },
              lowPositiveControl: {
                type: 'object',
                title: 'Low Positive Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              },
              highPositiveControl: {
                type: 'object',
                title: 'High Positive Control',
                properties: {
                  moduleSerial: {
                    type: 'string',
                    title: 'Instrument Serial'
                  },
                  assayName: {
                    type: 'string',
                    title: 'Assay Name'
                  },
                  assayCode: {
                    type: 'string',
                    title: 'Assay Code'
                  },
                  finalResultAbnormalFlags: {
                    type: 'array',
                    title: 'Final Result Abnormal Flags'
                  },
                  preliminaryResultAbnormalFlags: {
                    type: 'array',
                    title: 'Preliminary Result Abnormal Flags'
                  },
                  orderOperatorId: {
                    type: 'string',
                    title: 'Ordered By'
                  },
                  consumableLot: {
                    type: 'string',
                    title: 'Consumable Lot Number'
                  },
                  reportType: {
                    type: 'string',
                    title: 'Report Type'
                  },
                  cycleNumber: {
                    type: 'string',
                    title: 'Cycle Number'
                  },
                  passed: {
                    type: 'bool',
                    title: 'Passed'
                  },
                  consumableSerial: {
                    type: 'string',
                    title: 'Consumable Serial Number'
                  },
                  moduleName: {
                    type: 'string',
                    title: 'Well Position'
                  },
                  senderOperator: {
                    type: 'string',
                    title: 'Sent By'
                  },
                  endedOn: {
                    type: 'time',
                    title: 'Time Ended'
                  },
                  controlConsumableLotNumber: {
                    type: 'string',
                    title: 'Control Consumable Lot Number'
                  },
                  result: {
                    type: 'string',
                    title: 'Result'
                  }
                }
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text'
          },
          messageIsComplete: {
            type: 'bool',
            title: 'Message Complete'
          },
          finalResultAbnormalFlags: {
            type: 'array',
            title: 'Final Result Abnormal Flags'
          },
          preliminaryResultAbnormalFlags: {
            type: 'array',
            title: 'Preliminary Result Abnormal Flags'
          },
          orderOperatorId: {
            type: 'string',
            title: 'Ordered By'
          },
          reportType: {
            type: 'string',
            title: 'Report Type'
          },
          passedQualityControl: {
            type: 'bool',
            title: 'Passed Quality Control'
          },
          resultStatus: {
            type: 'string',
            title: 'Status'
          },
          assayProtocol: {
            type: 'string',
            title: 'Assay Protocol'
          },
          typeOfMessage: {
            type: 'string',
            title: 'Message Type'
          },
          resultType: {
            type: 'string',
            title: 'Result Type'
          },
          testQualifier: {
            type: 'string',
            title: 'Test Qualifier'
          },
          controlConsumableLotNumber: {
            type: 'string',
            title: 'Quality Control Consumable Lot'
          },
          messageSentOn: {
            type: 'time',
            title: 'Message Sent On'
          }
        },
        abilities: [
          {
            assayId: '29',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '29',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '29',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '29',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '29',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '29',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '29',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'COBAS 4800 VL',
        resultCategory1i18nKey: 'resultCategoryHivVl',
        deviceTypeId: '12',
        assayTypeId: '3',
        abbreviation: 'Cobas Hiv VL',
        patientDataSchema: {
          isolationStatus: {
            list: false,
            type: 'string',
            order: 16,
            title: 'Isolation Status'
          },
          gender: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Gender'
          },
          attendingPhysician: {
            list: false,
            type: 'string',
            order: 9,
            title: 'Attending Physician'
          },
          practicePatientId: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Practice Patient ID'
          },
          height: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Height'
          },
          name: {
            list: false,
            type: 'string',
            order: 3,
            title: 'Name'
          },
          phone: {
            list: false,
            type: 'string',
            order: 8,
            title: 'Phone'
          },
          admissionOrDischargeDates: {
            list: false,
            type: 'date',
            order: 13,
            title: 'Admission/Discharge Date'
          },
          diet: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Diet'
          },
          address: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Address'
          },
          dosageCategory: {
            list: false,
            type: 'string',
            order: 18,
            title: 'Dosage Category'
          },
          ethnicOrigin: {
            list: false,
            type: 'string',
            order: 6,
            title: 'Ethnicity'
          },
          location: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Location'
          },
          weight: {
            list: false,
            type: 'string',
            order: 11,
            title: 'Weight'
          },
          additionalPatientId: {
            list: false,
            type: 'string',
            order: 2,
            title: 'Additional Patient ID'
          },
          dateOfBirth: {
            list: false,
            type: 'date',
            order: 4,
            title: 'Date of Birth'
          },
          id: {
            list: true,
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          admissionStatus: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Admission Status'
          },
          hospitalInstitution: {
            list: false,
            type: 'string',
            order: 17,
            title: 'Hospital'
          }
        },
        deviceTypeExternalId: 'COBAS4800',
        diseaseId: '3',
        id: '29',
        deviceTypeName: 'ROCHE COBAS 4800',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'HIV',
        assayTypeName: 'HIV VL'
      },
      {
        assayTypeAbbreviation: 'CV',
        i18nKey: 'assayGenericCovid19',
        externalId: 'assayGenericCovid19',
        resultDataSchema: {
          resultText: {
            type: 'string',
            title: 'COVID-19 Result'
          },
          typeOfTest: {
            type: 'string',
            title: 'Type of Test'
          }
        },
        abilities: [
          {
            assayId: '30',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '30',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '30',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '30',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '30',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '30',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '30',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: true,
            canDelete: true,
            canEdit: true
          }
        ],
        resultCategory2i18nKey: null,
        name: 'COVID-19 Generic Test',
        resultCategory1i18nKey: 'resultCategoryCovid19',
        deviceTypeId: '11',
        assayTypeId: '18',
        abbreviation: 'Generic COVID-19',
        patientDataSchema: {
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          age: {
            type: 'string',
            order: 3,
            title: 'Age'
          },
          caseId: {
            type: 'string',
            order: 2,
            title: 'Unique Case Identifier'
          },
          gender: {
            type: 'string',
            order: 4,
            title: 'Sex at birth'
          },
          testReason: {
            type: 'string',
            order: 1,
            title: 'Why tested for COVID-19'
          }
        },
        deviceTypeExternalId: 'Aspect',
        diseaseId: '8',
        resultCategories: [
          {
            id: '21',
            name: 'Unknown',
            i18nKey: 'resultCategoryUnknown',
            externalId: 'Unknown',
            assayId: '30',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '24',
            name: 'Negative',
            i18nKey: 'resultCategoryNegative',
            externalId: 'Negative',
            assayId: '30',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '32',
            name: 'Inconclusive',
            i18nKey: 'resultCategoryInconclusive',
            externalId: 'Inconclusive',
            assayId: '30',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '33',
            name: 'Positive',
            i18nKey: 'resultCategoryPositive',
            externalId: 'Positive',
            assayId: '30',
            emphasize: 1,
            requirestreatment: 1
          }
        ],
        id: '30',
        deviceTypeName: 'Aspect',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'COVID-19',
        assayTypeName: 'COVID-19 Test'
      },
      {
        assayTypeAbbreviation: 'TB',
        i18nKey: 'assayGenericCulture',
        externalId: 'assayGenericCulture',
        resultDataSchema: {
          senderName: {
            list: false,
            type: 'string',
            order: 3,
            title: 'Sender Name'
          },
          versionNumber: {
            list: false,
            type: 'string',
            order: 6,
            title: 'Version Number'
          },
          instrumentType: {
            list: false,
            type: 'string',
            order: 4,
            title: 'Instrument Type'
          },
          resultTypeCode: {
            list: false,
            type: 'string',
            order: 8,
            title: 'Result Type Code'
          },
          testId: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Test ID'
          },
          instrumentNumber: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Instrument Number'
          },
          preliminaryFinalStatus: {
            list: false,
            type: 'string',
            order: 9,
            title: 'Preliminary/Final'
          },
          isolateNumber: {
            list: false,
            type: 'number',
            order: 2,
            title: 'Isolate Number'
          },
          instrumentLocation: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Specimen Instrument Location'
          },
          protocolLength: {
            list: false,
            type: 'number',
            order: 0,
            title: 'Protocol Length'
          }
        },
        abilities: [
          {
            assayId: '9',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '9',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '9',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '9',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '9',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '9',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '9',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: 'resultCategoryFinalResult',
        name: 'Culture',
        resultCategory1i18nKey: 'resultCategoryCultureResult',
        deviceTypeId: '6',
        assayTypeId: '13',
        abbreviation: 'CULTURE',
        patientDataSchema: {
          xpertMtbRifResult: {
            type: 'string',
            order: 8,
            title: 'XPERT MTB RIF Result'
          },
          gender: {
            type: 'string',
            order: 2,
            title: 'Sex'
          },
          contactDetails: {
            type: 'string',
            order: 7,
            title: 'Contact Details'
          },
          lpaFl: {
            type: 'string',
            order: 5,
            title: 'LPA FL'
          },
          dateStartedOnTreatment: {
            type: 'string',
            order: 9,
            title: 'Date Started on TX'
          },
          site: {
            type: 'string',
            order: 5,
            title: 'Site'
          },
          baselineCulture: {
            type: 'string',
            order: 10,
            title: 'Baseline Culture'
          },
          name: {
            type: 'string',
            order: 0,
            title: 'Name of patient'
          },
          mgitSire: {
            type: 'string',
            order: 12,
            title: 'MGIT SIRE'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'Province'
          },
          lpaSl: {
            type: 'string',
            order: 11,
            title: 'LPA SL'
          },
          dateOfBirth: {
            type: 'string',
            order: 3,
            title: 'Date of Birth'
          },
          focalPerson: {
            type: 'string',
            order: 6,
            title: 'Focal Person'
          },
          age: {
            type: 'number',
            order: 1,
            title: 'Age'
          }
        },
        deviceTypeExternalId: 'SenaiteLims',
        diseaseId: '1',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '9',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '9',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '9',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '9',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '8',
            name: 'Success',
            i18nKey: 'resultCategorySuccess',
            externalId: 'Success',
            assayId: '9',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '20',
            name: 'Missing',
            i18nKey: 'resultCategoryMissing',
            externalId: 'Missing',
            assayId: '9',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '21',
            name: 'Unknown',
            i18nKey: 'resultCategoryUnknown',
            externalId: 'Unknown',
            assayId: '9',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '29',
            name: 'Contaminated',
            i18nKey: 'resultCategoryContaminated',
            externalId: 'Contaminated',
            assayId: '9',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '30',
            name: 'Positive MOTT',
            i18nKey: 'resultCategoryPositiveMOTT',
            externalId: 'PositiveMOTT',
            assayId: '9',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '31',
            name: 'Positive MTB',
            i18nKey: 'resultCategoryPositiveMTB',
            externalId: 'PositiveMTB',
            assayId: '9',
            emphasize: 0,
            requirestreatment: 0
          }
        ],
        id: '9',
        deviceTypeName: 'Senaite LIMS',
        hasResults: false,
        resultCategory2Label: 'Final Result',
        resultCategory1Label: 'Culture Result',
        assayTypeName: 'TB G&D'
      },
      {
        assayTypeAbbreviation: 'CV',
        i18nKey: 'assayGXCovid19',
        externalId: 'assayGXCovid19',
        resultDataSchema: {
          resultText: {
            type: 'string',
            title: 'COVID-19 Result'
          }
        },
        abilities: [
          {
            assayId: '33',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '33',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '33',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '33',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '33',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '33',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '33',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: true,
            canDelete: true,
            canEdit: true
          }
        ],
        resultCategory2i18nKey: null,
        name: 'GeneXpert COVID-19',
        resultCategory1i18nKey: 'resultCategoryCovid19',
        deviceTypeId: '2',
        assayTypeId: '18',
        abbreviation: 'GX COVID-19',
        patientDataSchema: {
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          age: {
            type: 'string',
            order: 3,
            title: 'Age'
          },
          caseId: {
            type: 'string',
            order: 2,
            title: 'Unique Case Identifier'
          },
          gender: {
            type: 'string',
            order: 4,
            title: 'Sex at birth'
          },
          testReason: {
            type: 'string',
            order: 1,
            title: 'Why tested for COVID-19'
          }
        },
        deviceTypeExternalId: 'CepheidGeneXpert',
        diseaseId: '8',
        resultCategories: [
          {
            id: '21',
            name: 'Unknown',
            i18nKey: 'resultCategoryUnknown',
            externalId: 'Unknown',
            assayId: '33',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '24',
            name: 'Negative',
            i18nKey: 'resultCategoryNegative',
            externalId: 'Negative',
            assayId: '33',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '32',
            name: 'Inconclusive',
            i18nKey: 'resultCategoryInconclusive',
            externalId: 'Inconclusive',
            assayId: '33',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '33',
            name: 'Positive',
            i18nKey: 'resultCategoryPositive',
            externalId: 'Positive',
            assayId: '33',
            emphasize: 1,
            requirestreatment: 1
          }
        ],
        id: '33',
        deviceTypeName: 'GeneXpert',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'COVID-19',
        assayTypeName: 'COVID-19 Test'
      },
      {
        assayTypeAbbreviation: 'EB',
        i18nKey: 'assayGeneXpertEbola',
        externalId: 'GxEbola',
        resultDataSchema: {
          probes: {
            type: 'object',
            title: 'Probes',
            i18nKey: 'Probes',
            properties: {
              qc2: {
                type: 'string',
                title: 'QC2'
              },
              qc1Endpt: {
                type: 'number',
                title: 'QC1 Endpt'
              },
              probeACt: {
                type: 'number',
                title: 'Probe A Ct'
              },
              probeBCt: {
                type: 'number',
                title: 'Probe B Ct'
              },
              probeCCt: {
                type: 'number',
                title: 'Probe C Ct'
              },
              probeDCt: {
                type: 'number',
                title: 'Probe D Ct'
              },
              probeECt: {
                type: 'number',
                title: 'Probe E Ct'
              },
              probeSpcCt: {
                type: 'number',
                title: 'Probe Spc Ct'
              },
              probeSpcEndpt: {
                type: 'number',
                title: 'Probe Spc Endpt'
              },
              probeEEndpt: {
                type: 'number',
                title: 'Probe E Endpt'
              },
              probeDEndpt: {
                type: 'number',
                title: 'Probe D Endpt'
              },
              probeCEndpt: {
                type: 'number',
                title: 'Probe C Endpt'
              },
              probeBEndpt: {
                type: 'number',
                title: 'Probe B Endpt'
              },
              probeAEndpt: {
                type: 'number',
                title: 'Probe A Endpt'
              },
              qc1Ct: {
                type: 'number',
                title: 'QC1 Ct'
              },
              qc2Ct: {
                type: 'number',
                title: 'QC2 Ct'
              },
              probeA: {
                type: 'string',
                title: 'Probe A'
              },
              probeB: {
                type: 'string',
                title: 'Probe B'
              },
              probeC: {
                type: 'string',
                title: 'Probe C'
              },
              probeD: {
                type: 'string',
                title: 'Probe D'
              },
              probeE: {
                type: 'string',
                title: 'Probe E'
              },
              probeSpc: {
                type: 'string',
                title: 'Probe Spc'
              },
              qc1: {
                type: 'string',
                title: 'QC1'
              },
              qc2Endpt: {
                type: 'number',
                title: 'QC2 Endpt'
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text'
          }
        },
        abilities: [
          {
            assayId: '18',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '18',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '18',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '18',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '18',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '18',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '18',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: 'resultCategoryEbolaNp',
        name: 'GeneXpert Ebola',
        resultCategory1i18nKey: 'resultCategoryEbolaGp',
        deviceTypeId: '2',
        assayTypeId: '2',
        abbreviation: 'GX Ebola',
        patientDataSchema: {
          gender: {
            type: 'string',
            order: 9,
            title: 'Gender'
          },
          zip: {
            type: 'string',
            order: 5,
            title: 'Zip'
          },
          microscopyResult: {
            type: 'string',
            order: 10,
            title: 'Microscopy Result'
          },
          street: {
            type: 'string',
            order: 2,
            title: 'Street'
          },
          city: {
            type: 'string',
            order: 3,
            title: 'City'
          },
          name: {
            type: 'string',
            order: 1,
            title: 'Name'
          },
          phone: {
            type: 'string',
            order: 6,
            title: 'Phone'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'State'
          },
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          age: {
            type: 'number',
            order: 8,
            title: 'Age (in years)'
          }
        },
        deviceTypeExternalId: 'CepheidGeneXpert',
        diseaseId: '2',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '18',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '18',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '18',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '6',
            name: 'No Result',
            i18nKey: 'resultCategoryNoResult',
            externalId: 'NoResult',
            assayId: '18',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '18',
            emphasize: 1,
            requirestreatment: 0
          }
        ],
        id: '18',
        deviceTypeName: 'GeneXpert',
        hasResults: true,
        resultCategory2Label: 'NP',
        resultCategory1Label: 'GP',
        assayTypeName: 'Ebola'
      },
      {
        assayTypeAbbreviation: 'HCV',
        i18nKey: 'assayGeneXpertHcv',
        externalId: 'GxHcv',
        resultDataSchema: {
          count: {
            list: true,
            type: 'number',
            title: 'HCV Count'
          },
          probes: {
            type: 'object',
            title: 'Probes',
            i18nKey: 'probes',
            properties: {
              qc1Endpt: {
                type: 'number',
                title: 'QC1 EndPt'
              },
              cicEndPt: {
                type: 'number',
                title: 'CIC EndPt'
              },
              sacCt: {
                type: 'number',
                title: 'SAC Ct'
              },
              sacEndPt: {
                type: 'number',
                title: 'SAC EndPt'
              },
              cicCt: {
                type: 'number',
                title: 'CIC Ct'
              },
              qc1Ct: {
                type: 'number',
                title: 'QC1 Ct'
              },
              qc2Ct: {
                type: 'number',
                title: 'QC2 Ct'
              },
              npCt: {
                type: 'number',
                title: 'NP Ct'
              },
              gpEndPt: {
                type: 'number',
                title: 'GP Endpt'
              },
              gpCt: {
                type: 'number',
                title: 'GP Ct'
              },
              npEndPt: {
                type: 'number',
                title: 'NP EndPt'
              },
              qc2Endpt: {
                type: 'number',
                title: 'Qc2Endpt'
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text',
            i18nKey: 'resultText'
          }
        },
        abilities: [
          {
            assayId: '20',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '20',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '20',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '20',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '20',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '20',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '20',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'GeneXpert HCV',
        resultCategory1i18nKey: 'resultCategoryHcv',
        deviceTypeId: '2',
        assayTypeId: '8',
        abbreviation: 'GX HCV',
        patientDataSchema: {
          gender: {
            type: 'string',
            order: 9,
            title: 'Gender'
          },
          zip: {
            type: 'string',
            order: 5,
            title: 'Zip'
          },
          microscopyResult: {
            type: 'string',
            order: 10,
            title: 'Microscopy Result'
          },
          street: {
            type: 'string',
            order: 2,
            title: 'Street'
          },
          city: {
            type: 'string',
            order: 3,
            title: 'City'
          },
          name: {
            type: 'string',
            order: 1,
            title: 'Name'
          },
          phone: {
            type: 'string',
            order: 6,
            title: 'Phone'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'State'
          },
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          age: {
            type: 'number',
            order: 8,
            title: 'Age (in years)'
          }
        },
        deviceTypeExternalId: 'CepheidGeneXpert',
        diseaseId: '5',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '20',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '20',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '6',
            name: 'No Result',
            i18nKey: 'resultCategoryNoResult',
            externalId: 'NoResult',
            assayId: '20',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '20',
            emphasize: 1,
            requirestreatment: 0
          }
        ],
        id: '20',
        deviceTypeName: 'GeneXpert',
        hasResults: true,
        resultCategory2Label: null,
        resultCategory1Label: 'HCV',
        assayTypeName: 'HCV'
      },
      {
        assayTypeAbbreviation: 'HIV',
        i18nKey: 'assayGeneXpertHiv1Qual',
        externalId: 'GxHiv1Qual',
        resultDataSchema: {
          log: {
            type: 'number',
            title: 'log'
          },
          copies: {
            list: true,
            type: 'number',
            title: 'Copies/mL'
          },
          probes: {
            type: 'object',
            title: 'Probes',
            i18nKey: 'probes',
            properties: {
              qc1Endpt: {
                type: 'number',
                title: 'QC1 EndPt'
              },
              cicEndPt: {
                type: 'number',
                title: 'CIC EndPt'
              },
              sacCt: {
                type: 'number',
                title: 'SAC Ct'
              },
              sacEndPt: {
                type: 'number',
                title: 'SAC EndPt'
              },
              cicCt: {
                type: 'number',
                title: 'CIC Ct'
              },
              qc1Ct: {
                type: 'number',
                title: 'QC1 Ct'
              },
              qc2Ct: {
                type: 'number',
                title: 'QC2 Ct'
              },
              npCt: {
                type: 'number',
                title: 'NP Ct'
              },
              gpEndPt: {
                type: 'number',
                title: 'GP Endpt'
              },
              gpCt: {
                type: 'number',
                title: 'GP Ct'
              },
              npEndPt: {
                type: 'number',
                title: 'NP EndPt'
              },
              qc2Endpt: {
                type: 'number',
                title: 'Qc2Endpt'
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text',
            i18nKey: 'resultText'
          }
        },
        abilities: [
          {
            assayId: '17',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '17',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '17',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '17',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '17',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '17',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '17',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'GeneXpert HIV-1 Qual',
        resultCategory1i18nKey: 'resultCategoryHiv',
        deviceTypeId: '2',
        assayTypeId: '5',
        abbreviation: 'GX HIV Qual',
        patientDataSchema: {
          gender: {
            type: 'string',
            order: 9,
            title: 'Gender'
          },
          zip: {
            type: 'string',
            order: 5,
            title: 'Zip'
          },
          microscopyResult: {
            type: 'string',
            order: 10,
            title: 'Microscopy Result'
          },
          street: {
            type: 'string',
            order: 2,
            title: 'Street'
          },
          city: {
            type: 'string',
            order: 3,
            title: 'City'
          },
          name: {
            type: 'string',
            order: 1,
            title: 'Name'
          },
          phone: {
            type: 'string',
            order: 6,
            title: 'Phone'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'State'
          },
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          age: {
            type: 'number',
            order: 8,
            title: 'Age (in years)'
          }
        },
        deviceTypeExternalId: 'CepheidGeneXpert',
        diseaseId: '3',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '17',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '17',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '17',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '6',
            name: 'No Result',
            i18nKey: 'resultCategoryNoResult',
            externalId: 'NoResult',
            assayId: '17',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '17',
            emphasize: 1,
            requirestreatment: 0
          }
        ],
        id: '17',
        deviceTypeName: 'GeneXpert',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'HIV',
        assayTypeName: 'HIV Qual'
      },
      {
        assayTypeAbbreviation: 'HIV',
        i18nKey: 'assayGeneXpertHiv1Vl',
        externalId: 'GxHiv1Vl',
        resultDataSchema: {
          log: {
            type: 'number',
            title: 'log'
          },
          copies: {
            list: true,
            type: 'number',
            title: 'Copies/mL'
          },
          probes: {
            type: 'object',
            title: 'Probes',
            i18nKey: 'probes',
            properties: {
              qc1Endpt: {
                type: 'number',
                title: 'QC1 EndPt'
              },
              cicEndPt: {
                type: 'number',
                title: 'CIC EndPt'
              },
              sacCt: {
                type: 'number',
                title: 'SAC Ct'
              },
              sacEndPt: {
                type: 'number',
                title: 'SAC EndPt'
              },
              cicCt: {
                type: 'number',
                title: 'CIC Ct'
              },
              qc1Ct: {
                type: 'number',
                title: 'QC1 Ct'
              },
              qc2Ct: {
                type: 'number',
                title: 'QC2 Ct'
              },
              npCt: {
                type: 'number',
                title: 'NP Ct'
              },
              gpEndPt: {
                type: 'number',
                title: 'GP Endpt'
              },
              gpCt: {
                type: 'number',
                title: 'GP Ct'
              },
              npEndPt: {
                type: 'number',
                title: 'NP EndPt'
              },
              qc2Endpt: {
                type: 'number',
                title: 'Qc2Endpt'
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text',
            i18nKey: 'resultText'
          }
        },
        abilities: [
          {
            assayId: '16',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '16',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '16',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '16',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '16',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '16',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '16',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'GeneXpert HIV-1 VL',
        resultCategory1i18nKey: 'resultCategoryHiv',
        deviceTypeId: '2',
        assayTypeId: '3',
        abbreviation: 'GX HIV VL',
        patientDataSchema: {
          gender: {
            type: 'string',
            order: 9,
            title: 'Gender'
          },
          zip: {
            type: 'string',
            order: 5,
            title: 'Zip'
          },
          microscopyResult: {
            type: 'string',
            order: 10,
            title: 'Microscopy Result'
          },
          street: {
            type: 'string',
            order: 2,
            title: 'Street'
          },
          city: {
            type: 'string',
            order: 3,
            title: 'City'
          },
          name: {
            type: 'string',
            order: 1,
            title: 'Name'
          },
          phone: {
            type: 'string',
            order: 6,
            title: 'Phone'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'State'
          },
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          age: {
            type: 'number',
            order: 8,
            title: 'Age (in years)'
          }
        },
        deviceTypeExternalId: 'CepheidGeneXpert',
        diseaseId: '3',
        resultCategories: [
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '16',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '16',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '6',
            name: 'No Result',
            i18nKey: 'resultCategoryNoResult',
            externalId: 'NoResult',
            assayId: '16',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '16',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '17',
            name: '< 1000',
            i18nKey: 'resultCategoryLessThan1000',
            externalId: 'LessThan1000',
            assayId: '16',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '18',
            name: '>= 1000',
            i18nKey: 'resultCategoryMoreThan1000',
            externalId: 'MoreThan1000',
            assayId: '16',
            emphasize: 1,
            requirestreatment: 1
          }
        ],
        id: '16',
        deviceTypeName: 'GeneXpert',
        hasResults: true,
        resultCategory2Label: null,
        resultCategory1Label: 'HIV',
        assayTypeName: 'HIV VL'
      },
      {
        assayTypeAbbreviation: 'TB',
        i18nKey: 'assayGeneXpertMtbRif',
        externalId: 'GxMtbRif',
        resultDataSchema: {
          probes: {
            type: 'object',
            title: 'Probes',
            i18nKey: 'Probes',
            properties: {
              qc2: {
                type: 'string',
                title: 'QC2'
              },
              qc1Endpt: {
                type: 'number',
                title: 'QC1 Endpt'
              },
              probeACt: {
                type: 'number',
                title: 'Probe A Ct'
              },
              probeBCt: {
                type: 'number',
                title: 'Probe B Ct'
              },
              probeCCt: {
                type: 'number',
                title: 'Probe C Ct'
              },
              probeDCt: {
                type: 'number',
                title: 'Probe D Ct'
              },
              probeECt: {
                type: 'number',
                title: 'Probe E Ct'
              },
              probeSpcCt: {
                type: 'number',
                title: 'Probe Spc Ct'
              },
              probeSpcEndpt: {
                type: 'number',
                title: 'Probe Spc Endpt'
              },
              probeEEndpt: {
                type: 'number',
                title: 'Probe E Endpt'
              },
              probeDEndpt: {
                type: 'number',
                title: 'Probe D Endpt'
              },
              probeCEndpt: {
                type: 'number',
                title: 'Probe C Endpt'
              },
              probeBEndpt: {
                type: 'number',
                title: 'Probe B Endpt'
              },
              probeAEndpt: {
                type: 'number',
                title: 'Probe A Endpt'
              },
              qc1Ct: {
                type: 'number',
                title: 'QC1 Ct'
              },
              qc2Ct: {
                type: 'number',
                title: 'QC2 Ct'
              },
              probeA: {
                type: 'string',
                title: 'Probe A'
              },
              probeB: {
                type: 'string',
                title: 'Probe B'
              },
              probeC: {
                type: 'string',
                title: 'Probe C'
              },
              probeD: {
                type: 'string',
                title: 'Probe D'
              },
              probeE: {
                type: 'string',
                title: 'Probe E'
              },
              probeSpc: {
                type: 'string',
                title: 'Probe Spc'
              },
              qc1: {
                type: 'string',
                title: 'QC1'
              },
              qc2Endpt: {
                type: 'number',
                title: 'QC2 Endpt'
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text'
          }
        },
        abilities: [
          {
            assayId: '14',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '14',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '14',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '14',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '14',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '14',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '14',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: 'resultCategoryRif',
        name: 'GeneXpert MTB/Rif',
        resultCategory1i18nKey: 'resultCategoryMtb',
        deviceTypeId: '2',
        assayTypeId: '1',
        abbreviation: 'GX MTB/Rif',
        patientDataSchema: {
          gender: {
            type: 'string',
            order: 9,
            title: 'Gender'
          },
          zip: {
            type: 'string',
            order: 5,
            title: 'Zip'
          },
          microscopyResult: {
            type: 'string',
            order: 10,
            title: 'Microscopy Result'
          },
          street: {
            type: 'string',
            order: 2,
            title: 'Street'
          },
          hivStatus: {
            type: 'string',
            order: 7,
            title: 'HIV Status'
          },
          city: {
            type: 'string',
            order: 3,
            title: 'City'
          },
          name: {
            type: 'string',
            order: 1,
            title: 'Name'
          },
          phone: {
            type: 'string',
            order: 6,
            title: 'Phone'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'State'
          },
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          age: {
            type: 'number',
            order: 8,
            title: 'Age (in years)'
          }
        },
        deviceTypeExternalId: 'CepheidGeneXpert',
        diseaseId: '1',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '14',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '14',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '4',
            name: 'Indeterminate',
            i18nKey: 'resultCategoryIndeterminate',
            externalId: 'Indeterminate',
            assayId: '14',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '14',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '6',
            name: 'No Result',
            i18nKey: 'resultCategoryNoResult',
            externalId: 'NoResult',
            assayId: '14',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '14',
            emphasize: 1,
            requirestreatment: 0
          }
        ],
        id: '14',
        deviceTypeName: 'GeneXpert',
        hasResults: true,
        resultCategory2Label: 'Rif',
        resultCategory1Label: 'MTB',
        assayTypeName: 'MTB/Rif'
      },
      {
        assayTypeAbbreviation: 'TB',
        i18nKey: 'assayGeneXpertMtbRifUltra',
        externalId: 'GxMtbRifUltra',
        resultDataSchema: {
          probes: {
            type: 'object',
            title: 'Probes',
            i18nKey: 'Probes',
            properties: {
              qc2: {
                type: 'string',
                title: 'QC2'
              },
              qc1Endpt: {
                type: 'number',
                title: 'QC1 Endpt'
              },
              probeACt: {
                type: 'number',
                title: 'Probe A Ct'
              },
              probeBCt: {
                type: 'number',
                title: 'Probe B Ct'
              },
              probeCCt: {
                type: 'number',
                title: 'Probe C Ct'
              },
              probeDCt: {
                type: 'number',
                title: 'Probe D Ct'
              },
              probeECt: {
                type: 'number',
                title: 'Probe E Ct'
              },
              probeSpcCt: {
                type: 'number',
                title: 'Probe Spc Ct'
              },
              probeSpcEndpt: {
                type: 'number',
                title: 'Probe Spc Endpt'
              },
              probeEEndpt: {
                type: 'number',
                title: 'Probe E Endpt'
              },
              probeDEndpt: {
                type: 'number',
                title: 'Probe D Endpt'
              },
              probeCEndpt: {
                type: 'number',
                title: 'Probe C Endpt'
              },
              probeBEndpt: {
                type: 'number',
                title: 'Probe B Endpt'
              },
              probeAEndpt: {
                type: 'number',
                title: 'Probe A Endpt'
              },
              qc1Ct: {
                type: 'number',
                title: 'QC1 Ct'
              },
              qc2Ct: {
                type: 'number',
                title: 'QC2 Ct'
              },
              probeA: {
                type: 'string',
                title: 'Probe A'
              },
              probeB: {
                type: 'string',
                title: 'Probe B'
              },
              probeC: {
                type: 'string',
                title: 'Probe C'
              },
              probeD: {
                type: 'string',
                title: 'Probe D'
              },
              probeE: {
                type: 'string',
                title: 'Probe E'
              },
              probeSpc: {
                type: 'string',
                title: 'Probe Spc'
              },
              qc1: {
                type: 'string',
                title: 'QC1'
              },
              qc2Endpt: {
                type: 'number',
                title: 'QC2 Endpt'
              }
            }
          },
          resultText: {
            type: 'string',
            title: 'Result Text'
          }
        },
        abilities: [
          {
            assayId: '15',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '15',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '15',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '15',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '15',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '15',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '15',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: 'resultCategoryRif',
        name: 'GeneXpert MTB/Rif Ultra',
        resultCategory1i18nKey: 'resultCategoryMtb',
        deviceTypeId: '2',
        assayTypeId: '1',
        abbreviation: 'GX MTB/ULTRA',
        patientDataSchema: {
          gender: {
            type: 'string',
            order: 9,
            title: 'Gender'
          },
          zip: {
            type: 'string',
            order: 5,
            title: 'Zip'
          },
          microscopyResult: {
            type: 'string',
            order: 10,
            title: 'Microscopy Result'
          },
          street: {
            type: 'string',
            order: 2,
            title: 'Street'
          },
          hivStatus: {
            type: 'string',
            order: 7,
            title: 'HIV Status'
          },
          city: {
            type: 'string',
            order: 3,
            title: 'City'
          },
          name: {
            type: 'string',
            order: 1,
            title: 'Name'
          },
          phone: {
            type: 'string',
            order: 6,
            title: 'Phone'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'State'
          },
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          age: {
            type: 'number',
            order: 8,
            title: 'Age (in years)'
          }
        },
        deviceTypeExternalId: 'CepheidGeneXpert',
        diseaseId: '1',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '15',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '2',
            name: 'Trace Detected',
            i18nKey: 'ResultCategoryTraceDetected',
            externalId: 'Trace Detected',
            assayId: '15',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '15',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '4',
            name: 'Indeterminate',
            i18nKey: 'resultCategoryIndeterminate',
            externalId: 'Indeterminate',
            assayId: '15',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '15',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '6',
            name: 'No Result',
            i18nKey: 'resultCategoryNoResult',
            externalId: 'NoResult',
            assayId: '15',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '15',
            emphasize: 1,
            requirestreatment: 0
          }
        ],
        id: '15',
        deviceTypeName: 'GeneXpert',
        hasResults: false,
        resultCategory2Label: 'Rif',
        resultCategory1Label: 'MTB',
        assayTypeName: 'MTB/Rif'
      },
      {
        assayTypeAbbreviation: 'UK',
        i18nKey: 'assayGeneXpertUnknown',
        externalId: 'GxUnknown',
        resultDataSchema: null,
        abilities: [
          {
            assayId: '19',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '19',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '19',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '19',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '19',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '19',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '19',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'GeneXpert Unknown',
        resultCategory1i18nKey: null,
        deviceTypeId: '2',
        assayTypeId: '15',
        abbreviation: 'GX UK',
        patientDataSchema: {
          gender: {
            type: 'string',
            order: 9,
            title: 'Gender'
          },
          zip: {
            type: 'string',
            order: 5,
            title: 'Zip'
          },
          microscopyResult: {
            type: 'string',
            order: 10,
            title: 'Microscopy Result'
          },
          street: {
            type: 'string',
            order: 2,
            title: 'Street'
          },
          city: {
            type: 'string',
            order: 3,
            title: 'City'
          },
          name: {
            type: 'string',
            order: 1,
            title: 'Name'
          },
          phone: {
            type: 'string',
            order: 6,
            title: 'Phone'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'State'
          },
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          age: {
            type: 'number',
            order: 8,
            title: 'Age (in years)'
          }
        },
        deviceTypeExternalId: 'CepheidGeneXpert',
        diseaseId: null,
        id: '19',
        deviceTypeName: 'GeneXpert',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: null,
        assayTypeName: 'Unknown'
      },
      {
        assayTypeAbbreviation: 'GTTS',
        i18nKey: 'assayGenoTypeMTBCV1',
        externalId: 'assayGenoTypeMTBCV1',
        resultDataSchema: {
          band10Co: {
            list: false,
            type: 'number',
            order: 66,
            title: 'Relative Intensity of Band 10 compared to CutOff'
          },
          cutOffTolerance: {
            list: false,
            type: 'number',
            order: 21,
            title: 'Cut-Off Tolerance value'
          },
          band6A: {
            list: false,
            type: 'number',
            order: 51,
            title: 'Integral (Area) of Band 6 on Strip'
          },
          dateOfAnalysis: {
            list: false,
            type: 'date',
            order: 20,
            title: 'Date of Analysis'
          },
          no: {
            list: false,
            type: 'number',
            order: 1,
            title: 'Order-Number of Strip in Analysis'
          },
          lastName: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Last name of Patient'
          },
          band5A: {
            list: false,
            type: 'number',
            order: 47,
            title: 'Integral (Area) of Band 5 on Strip'
          },
          band4A: {
            list: false,
            type: 'number',
            order: 43,
            title: 'Integral (Area) of Band 4 on Strip'
          },
          checkSum: {
            list: false,
            type: 'number',
            order: 28,
            title: 'Checksum for data row'
          },
          typeOfTest: {
            list: true,
            type: 'string',
            order: 3,
            title: 'Internal name of setcard'
          },
          band3A: {
            list: false,
            type: 'number',
            order: 39,
            title: 'Integral (Area) of Band N on Strip'
          },
          band2A: {
            list: false,
            type: 'number',
            order: 35,
            title: 'Integral (Area) of Band 2 on Strip'
          },
          band9I: {
            list: false,
            type: 'number',
            order: 61,
            title: 'Intensity of Band 9 on Strip'
          },
          antigens: {
            list: false,
            type: 'string',
            order: 25,
            title: 'Antigens'
          },
          band1A: {
            list: false,
            type: 'number',
            order: 31,
            title: 'Integral (Area) of Band 1 on Strip'
          },
          band8I: {
            list: false,
            type: 'number',
            order: 57,
            title: 'Intensity of Band 8 on Strip'
          },
          sex: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Sex of Patient'
          },
          band7I: {
            list: false,
            type: 'number',
            order: 53,
            title: 'Intensity of Band 7 on Strip'
          },
          band1Co: {
            list: false,
            type: 'number',
            order: 30,
            title: 'Relative Intensity of Band 1 compared to CutOff'
          },
          revAntigens: {
            list: false,
            type: 'string',
            order: 26,
            title: 'Content of "Revised Antigens" Field in Analysis Window'
          },
          band6I: {
            list: false,
            type: 'number',
            order: 49,
            title: 'Intensity of Band 6 on Strip'
          },
          band2Co: {
            list: false,
            type: 'number',
            order: 34,
            title: 'Relative Intensity of Band 2 compared to CutOff'
          },
          band5I: {
            list: false,
            type: 'number',
            order: 45,
            title: 'Intensity of Band 5 on Strip'
          },
          dateOfRequest: {
            list: false,
            type: 'date',
            order: 19,
            title: 'Date of Request'
          },
          band3Co: {
            list: false,
            type: 'number',
            order: 38,
            title: 'Relative Intensity of Band N compared to CutOff'
          },
          rShort: {
            list: true,
            type: 'string',
            order: 22,
            title: 'Short form of result'
          },
          band4I: {
            list: false,
            type: 'number',
            order: 41,
            title: 'Intensity of Band 4 on Strip'
          },
          band4Co: {
            list: false,
            type: 'number',
            order: 42,
            title: 'Relative Intensity of Band 4 compared to CutOff'
          },
          pid: {
            list: true,
            type: 'string',
            order: 11,
            title: 'External Patient-ID'
          },
          band3I: {
            list: false,
            type: 'number',
            order: 37,
            title: 'Intensity of Band N on Strip'
          },
          band5Co: {
            list: false,
            type: 'number',
            order: 46,
            title: 'Relative Intensity of Band 5 compared to CutOff'
          },
          band2I: {
            list: false,
            type: 'number',
            order: 33,
            title: 'Intensity of Band 2 on Strip'
          },
          band6Co: {
            list: false,
            type: 'number',
            order: 50,
            title: 'Relative Intensity of Band 6 compared to CutOff'
          },
          band1I: {
            list: false,
            type: 'number',
            order: 29,
            title: 'Intensity of Band 1 on Strip'
          },
          band10A: {
            list: false,
            type: 'number',
            order: 67,
            title: 'Integral (Area) of Band 10 on Strip'
          },
          band9R: {
            list: false,
            type: 'number',
            order: 64,
            title: 'Relative Intensity of Band 9'
          },
          band7Co: {
            list: false,
            type: 'number',
            order: 54,
            title: 'Relative Intensity of Band 7 compared to CutOff'
          },
          windowsUser: {
            list: false,
            type: 'string',
            order: 27,
            title: 'User logged onto Windows System'
          },
          band8R: {
            list: false,
            type: 'number',
            order: 60,
            title: 'Relative Intensity of Band 8'
          },
          band8Co: {
            list: false,
            type: 'number',
            order: 58,
            title: 'Relative Intensity of Band 8 compared to CutOff'
          },
          band9Co: {
            list: false,
            type: 'number',
            order: 62,
            title: 'Relative Intensity of Band 9 compared to CutOff'
          },
          band7R: {
            list: false,
            type: 'number',
            order: 56,
            title: 'Relative Intensity of Band 7'
          },
          band6R: {
            list: false,
            type: 'number',
            order: 52,
            title: 'Relative Intensity of Band 6'
          },
          stripType: {
            list: true,
            type: 'string',
            order: 8,
            title: 'Internal Type of Strip'
          },
          senaiteResult: {
            list: false,
            type: 'object',
            order: 72,
            title: 'Senaite LIMS Result',
            properties: {
              analyst: {
                type: 'string',
                order: 14,
                title: 'Analyst'
              },
              verificators: {
                type: 'string',
                order: 15,
                title: 'Verificators'
              },
              retested: {
                type: 'number',
                order: 1,
                title: 'Retested'
              },
              unit: {
                type: 'string',
                order: 7,
                title: 'Unit'
              },
              testReviewState: {
                type: 'string',
                order: 16,
                title: 'Test Review State'
              },
              instrument: {
                type: 'string',
                order: 10,
                title: 'Instrument'
              },
              hidden: {
                type: 'number',
                order: 12,
                title: 'Hidden'
              },
              resultText: {
                type: 'string',
                order: 3,
                title: 'Result Text'
              },
              modificationDate: {
                type: 'time',
                order: 20,
                title: 'Modified On'
              },
              creator: {
                type: 'string',
                order: 18,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 19,
                title: 'Created On'
              },
              worksheetAnalysisReviewState: {
                type: 'string',
                order: 17,
                title: 'Worksheet Analysis Review State'
              },
              value: {
                type: 'string',
                order: 4,
                title: 'Result Value'
              },
              remarks: {
                type: 'string',
                order: 6,
                title: 'Remarks'
              },
              manualEntryOfResults: {
                type: 'string',
                order: 9,
                title: 'Sample Partition ID'
              },
              instrumentEntryOfResults: {
                type: 'number',
                order: 11,
                title: 'Entered by Instrument'
              },
              resultCaptureDate: {
                type: 'time',
                order: 5,
                title: 'Capture date'
              },
              title: {
                type: 'string',
                order: 0,
                title: 'Test Type'
              },
              result: {
                type: 'string',
                order: 2,
                title: 'Selected Result'
              },
              hiddenManually: {
                type: 'number',
                order: 13,
                title: 'Hidden Manually'
              },
              pointOfCapture: {
                type: 'string',
                order: 8,
                title: 'Point of Capture'
              }
            }
          },
          band5R: {
            list: false,
            type: 'number',
            order: 48,
            title: 'Relative Intensity of Band 5'
          },
          elisaIgA: {
            list: true,
            type: 'string',
            order: 16,
            title: 'Result Elisa IgA'
          },
          band4R: {
            list: false,
            type: 'number',
            order: 44,
            title: 'Relative Intensity of Band 4'
          },
          cw: {
            list: false,
            type: 'number',
            order: 9,
            title: 'Internal Connected-With-Strip number'
          },
          charge: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Lot-Number of Testkit'
          },
          band3R: {
            list: false,
            type: 'number',
            order: 40,
            title: 'Relative Intensity of Band N'
          },
          band2R: {
            list: false,
            type: 'number',
            order: 36,
            title: 'Relative Intensity of Band 2'
          },
          band10I: {
            list: false,
            type: 'number',
            order: 65,
            title: 'Intensity of Band 10 on Strip'
          },
          band1R: {
            list: false,
            type: 'number',
            order: 32,
            title: 'Relative Intensity of Band 1'
          },
          igType: {
            list: true,
            type: 'string',
            order: 6,
            title: 'Internal Ig-Type'
          },
          elisaIgG: {
            list: true,
            type: 'string',
            order: 17,
            title: 'Result Elisa IgG'
          },
          probeNumber: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Blood-Sample-ID'
          },
          firstName: {
            list: false,
            type: 'string',
            order: 13,
            title: 'First name of Patient'
          },
          rjoined: {
            list: false,
            type: 'string',
            order: 24,
            title: 'Result for joined Analysis'
          },
          revision: {
            list: false,
            type: 'number',
            order: 4,
            title: 'Internal revision number of setcard'
          },
          result: {
            list: false,
            type: 'string',
            order: 23,
            title: 'Long form of result'
          },
          band9A: {
            list: false,
            type: 'number',
            order: 63,
            title: 'Integral (Area) of Band 9 on Strip'
          },
          company: {
            list: true,
            type: 'string',
            order: 2,
            title: 'Producer of Testkit'
          },
          control: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Internal name of control'
          },
          birthday: {
            list: false,
            type: 'date',
            order: 14,
            title: 'Date of Birth of Patient'
          },
          senaiteAnalysisRequest: {
            list: false,
            type: 'object',
            order: 69,
            title: 'Senaite LIMS Analysis Request',
            properties: {
              priority: {
                type: 'number',
                order: 1,
                title: 'Priority'
              },
              creatorFullName: {
                type: 'string',
                order: 6,
                title: 'Created By (Name)'
              },
              profile: {
                type: 'string',
                order: 0,
                title: 'Profile'
              },
              modificationDate: {
                type: 'time',
                order: 9,
                title: 'Modified On'
              },
              printed: {
                type: 'number',
                order: 4,
                title: 'Printed'
              },
              creator: {
                type: 'string',
                order: 5,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 8,
                title: 'Created On'
              },
              creatorEmail: {
                type: 'string',
                order: 7,
                title: 'Created By (Email)'
              },
              dateVerified: {
                type: 'time',
                order: 3,
                title: 'verified On'
              },
              doctorTitle: {
                type: 'string',
                order: 2,
                title: 'Doctor Title'
              }
            }
          },
          senaiteReferringFacility: {
            list: false,
            type: 'object',
            order: 70,
            title: 'Senaite LIMS Referring Facility',
            properties: {
              contactEmail: {
                type: 'string',
                order: 1,
                title: 'Contact Email'
              },
              contactFullName: {
                type: 'string',
                order: 0,
                title: 'Contact Name'
              }
            }
          },
          band10R: {
            list: false,
            type: 'number',
            order: 68,
            title: 'Relative Intensity of Band 10'
          },
          band8A: {
            list: false,
            type: 'number',
            order: 59,
            title: 'Integral (Area) of Band 8 on Strip'
          },
          senaiteSample: {
            list: false,
            type: 'object',
            order: 71,
            title: 'Senaite LIMS Sample',
            properties: {
              volume: {
                type: 'string',
                order: 3,
                title: 'Volume'
              },
              appearance: {
                type: 'string',
                order: 1,
                title: 'Appearance'
              },
              receivedBy: {
                type: 'string',
                order: 6,
                title: 'Received By'
              },
              partitionId: {
                type: 'string',
                order: 0,
                title: 'Sample Partition ID'
              },
              dateReceived: {
                type: 'time',
                order: 5,
                title: 'Date Received'
              },
              samplerEmail: {
                type: 'string',
                order: 7,
                title: 'Sampler Email'
              },
              volumeRemarks: {
                type: 'string',
                order: 4,
                title: 'Volume Remarks'
              },
              appearanceRemarks: {
                type: 'string',
                order: 2,
                title: 'Appearance Remarks'
              }
            }
          },
          elisaIgM: {
            list: true,
            type: 'string',
            order: 18,
            title: 'Result Elisa IgM'
          },
          band7A: {
            list: false,
            type: 'number',
            order: 55,
            title: 'Integral (Area) of Band 7 on Strip'
          }
        },
        abilities: [
          {
            assayId: '10',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '10',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '10',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '10',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '10',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '10',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '10',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'GenoType MTBC VER 1.X',
        resultCategory1i18nKey: null,
        deviceTypeId: '7',
        assayTypeId: '17',
        abbreviation: 'GTMTBCV1',
        patientDataSchema: {
          xpertMtbRifResult: {
            type: 'string',
            order: 8,
            title: 'XPERT MTB RIF Result'
          },
          gender: {
            type: 'string',
            order: 2,
            title: 'Sex'
          },
          contactDetails: {
            type: 'string',
            order: 7,
            title: 'Contact Details'
          },
          lpaFl: {
            type: 'string',
            order: 5,
            title: 'LPA FL'
          },
          dateStartedOnTreatment: {
            type: 'string',
            order: 9,
            title: 'Date Started on TX'
          },
          site: {
            type: 'string',
            order: 5,
            title: 'Site'
          },
          baselineCulture: {
            type: 'string',
            order: 10,
            title: 'Baseline Culture'
          },
          name: {
            type: 'string',
            order: 0,
            title: 'Name of patient'
          },
          mgitSire: {
            type: 'string',
            order: 12,
            title: 'MGIT SIRE'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'Province'
          },
          lpaSl: {
            type: 'string',
            order: 11,
            title: 'LPA SL'
          },
          referringFacilitySampleId: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Sample ID from Referring Facility'
          },
          dateOfBirth: {
            type: 'string',
            order: 3,
            title: 'Date of Birth'
          },
          focalPerson: {
            type: 'string',
            order: 6,
            title: 'Focal Person'
          },
          id: {
            list: true,
            type: 'string',
            order: 13,
            title: 'Patient ID'
          },
          referringFacilityPatientName: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Patient Name from Referring Facility'
          },
          age: {
            type: 'number',
            order: 1,
            title: 'Age'
          }
        },
        deviceTypeExternalId: 'HainGenoScan',
        diseaseId: '1',
        id: '10',
        deviceTypeName: 'Hain GenoScan',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'Result',
        assayTypeName: 'GenoType Test Strip'
      },
      {
        assayTypeAbbreviation: 'GTTS',
        i18nKey: 'assayGenoTypeMTBDRplusV2',
        externalId: 'assayGenoTypeMTBDRplusV2',
        resultDataSchema: {
          band10Co: {
            list: false,
            type: 'number',
            order: 66,
            title: 'Relative Intensity of Band 10 compared to CutOff'
          },
          cutOffTolerance: {
            list: false,
            type: 'number',
            order: 21,
            title: 'Cut-Off Tolerance value'
          },
          band21Co: {
            list: false,
            type: 'number',
            order: 110,
            title: 'Relative Intensity of Band 21 compared to CutOff'
          },
          band6A: {
            list: false,
            type: 'number',
            order: 51,
            title: 'Integral (Area) of Band 6 on Strip'
          },
          dateOfAnalysis: {
            list: false,
            type: 'date',
            order: 20,
            title: 'Date of Analysis'
          },
          no: {
            list: false,
            type: 'number',
            order: 1,
            title: 'Order-Number of Strip in Analysis'
          },
          lastName: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Last name of Patient'
          },
          band11Co: {
            list: false,
            type: 'number',
            order: 70,
            title: 'Relative Intensity of Band 11 compared to CutOff'
          },
          band22Co: {
            list: false,
            type: 'number',
            order: 114,
            title: 'Relative Intensity of Band 22 compared to CutOff'
          },
          band5A: {
            list: false,
            type: 'number',
            order: 47,
            title: 'Integral (Area) of Band 5 on Strip'
          },
          band12Co: {
            list: false,
            type: 'number',
            order: 74,
            title: 'Relative Intensity of Band 12 compared to CutOff'
          },
          band23Co: {
            list: false,
            type: 'number',
            order: 118,
            title: 'Relative Intensity of Band 23 compared to CutOff'
          },
          band4A: {
            list: false,
            type: 'number',
            order: 43,
            title: 'Integral (Area) of Band 4 on Strip'
          },
          checkSum: {
            list: false,
            type: 'number',
            order: 28,
            title: 'Checksum for data row'
          },
          band13Co: {
            list: false,
            type: 'number',
            order: 78,
            title: 'Relative Intensity of Band 13 compared to CutOff'
          },
          band24Co: {
            list: false,
            type: 'number',
            order: 122,
            title: 'Relative Intensity of Band 24 compared to CutOff'
          },
          typeOfTest: {
            list: true,
            type: 'string',
            order: 3,
            title: 'Internal name of setcard'
          },
          band3A: {
            list: false,
            type: 'number',
            order: 39,
            title: 'Integral (Area) of Band N on Strip'
          },
          band19A: {
            list: false,
            type: 'number',
            order: 103,
            title: 'Integral (Area) of Band 19 on Strip'
          },
          band14Co: {
            list: false,
            type: 'number',
            order: 82,
            title: 'Relative Intensity of Band 14 compared to CutOff'
          },
          band25Co: {
            list: false,
            type: 'number',
            order: 126,
            title: 'Relative Intensity of Band 25 compared to CutOff'
          },
          band2A: {
            list: false,
            type: 'number',
            order: 35,
            title: 'Integral (Area) of Band 2 on Strip'
          },
          band9I: {
            list: false,
            type: 'number',
            order: 61,
            title: 'Intensity of Band 9 on Strip'
          },
          band18A: {
            list: false,
            type: 'number',
            order: 99,
            title: 'Integral (Area) of Band 18 on Strip'
          },
          band15Co: {
            list: false,
            type: 'number',
            order: 86,
            title: 'Relative Intensity of Band 15 compared to CutOff'
          },
          antigens: {
            list: false,
            type: 'string',
            order: 25,
            title: 'Antigens'
          },
          band26Co: {
            list: false,
            type: 'number',
            order: 130,
            title: 'Relative Intensity of Band 26 compared to CutOff'
          },
          band1A: {
            list: false,
            type: 'number',
            order: 31,
            title: 'Integral (Area) of Band 1 on Strip'
          },
          band8I: {
            list: false,
            type: 'number',
            order: 57,
            title: 'Intensity of Band 8 on Strip'
          },
          sex: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Sex of Patient'
          },
          band17A: {
            list: false,
            type: 'number',
            order: 95,
            title: 'Integral (Area) of Band 17 on Strip'
          },
          band16Co: {
            list: false,
            type: 'number',
            order: 90,
            title: 'Relative Intensity of Band 16 compared to CutOff'
          },
          band27Co: {
            list: false,
            type: 'number',
            order: 134,
            title: 'Relative Intensity of Band 27 compared to CutOff'
          },
          band27A: {
            list: false,
            type: 'number',
            order: 135,
            title: 'Integral (Area) of Band 27 on Strip'
          },
          band16A: {
            list: false,
            type: 'number',
            order: 91,
            title: 'Integral (Area) of Band 16 on Strip'
          },
          band17Co: {
            list: false,
            type: 'number',
            order: 94,
            title: 'Relative Intensity of Band 17 compared to CutOff'
          },
          band7I: {
            list: false,
            type: 'number',
            order: 53,
            title: 'Intensity of Band 7 on Strip'
          },
          band26A: {
            list: false,
            type: 'number',
            order: 131,
            title: 'Integral (Area) of Band 26 on Strip'
          },
          band15A: {
            list: false,
            type: 'number',
            order: 87,
            title: 'Integral (Area) of Band 15 on Strip'
          },
          band18Co: {
            list: false,
            type: 'number',
            order: 98,
            title: 'Relative Intensity of Band 18 compared to CutOff'
          },
          band1Co: {
            list: false,
            type: 'number',
            order: 30,
            title: 'Relative Intensity of Band 1 compared to CutOff'
          },
          revAntigens: {
            list: false,
            type: 'string',
            order: 26,
            title: 'Content of "Revised Antigens" Field in Analysis Window'
          },
          band6I: {
            list: false,
            type: 'number',
            order: 49,
            title: 'Intensity of Band 6 on Strip'
          },
          band25A: {
            list: false,
            type: 'number',
            order: 127,
            title: 'Integral (Area) of Band 25 on Strip'
          },
          band14A: {
            list: false,
            type: 'number',
            order: 83,
            title: 'Integral (Area) of Band 14 on Strip'
          },
          band19Co: {
            list: false,
            type: 'number',
            order: 102,
            title: 'Relative Intensity of Band 19 compared to CutOff'
          },
          band2Co: {
            list: false,
            type: 'number',
            order: 34,
            title: 'Relative Intensity of Band 2 compared to CutOff'
          },
          band5I: {
            list: false,
            type: 'number',
            order: 45,
            title: 'Intensity of Band 5 on Strip'
          },
          band13A: {
            list: false,
            type: 'number',
            order: 79,
            title: 'Integral (Area) of Band 13 on Strip'
          },
          dateOfRequest: {
            list: false,
            type: 'date',
            order: 19,
            title: 'Date of Request'
          },
          band3Co: {
            list: false,
            type: 'number',
            order: 38,
            title: 'Relative Intensity of Band N compared to CutOff'
          },
          rShort: {
            list: true,
            type: 'string',
            order: 22,
            title: 'Short form of result'
          },
          band4I: {
            list: false,
            type: 'number',
            order: 41,
            title: 'Intensity of Band 4 on Strip'
          },
          band24A: {
            list: false,
            type: 'number',
            order: 123,
            title: 'Integral (Area) of Band 24 on Strip'
          },
          band4Co: {
            list: false,
            type: 'number',
            order: 42,
            title: 'Relative Intensity of Band 4 compared to CutOff'
          },
          pid: {
            list: true,
            type: 'string',
            order: 11,
            title: 'External Patient-ID'
          },
          band3I: {
            list: false,
            type: 'number',
            order: 37,
            title: 'Intensity of Band N on Strip'
          },
          band23A: {
            list: false,
            type: 'number',
            order: 119,
            title: 'Integral (Area) of Band 23 on Strip'
          },
          band12A: {
            list: false,
            type: 'number',
            order: 75,
            title: 'Integral (Area) of Band 12 on Strip'
          },
          band19I: {
            list: false,
            type: 'number',
            order: 101,
            title: 'Intensity of Band 19 on Strip'
          },
          band5Co: {
            list: false,
            type: 'number',
            order: 46,
            title: 'Relative Intensity of Band 5 compared to CutOff'
          },
          band2I: {
            list: false,
            type: 'number',
            order: 33,
            title: 'Intensity of Band 2 on Strip'
          },
          band22A: {
            list: false,
            type: 'number',
            order: 115,
            title: 'Integral (Area) of Band 22 on Strip'
          },
          band11A: {
            list: false,
            type: 'number',
            order: 71,
            title: 'Integral (Area) of Band 11 on Strip'
          },
          band18I: {
            list: false,
            type: 'number',
            order: 97,
            title: 'Intensity of Band 18 on Strip'
          },
          band6Co: {
            list: false,
            type: 'number',
            order: 50,
            title: 'Relative Intensity of Band 6 compared to CutOff'
          },
          band1I: {
            list: false,
            type: 'number',
            order: 29,
            title: 'Intensity of Band 1 on Strip'
          },
          band21A: {
            list: false,
            type: 'number',
            order: 111,
            title: 'Integral (Area) of Band 21 on Strip'
          },
          band10A: {
            list: false,
            type: 'number',
            order: 67,
            title: 'Integral (Area) of Band 10 on Strip'
          },
          band9R: {
            list: false,
            type: 'number',
            order: 64,
            title: 'Relative Intensity of Band 9'
          },
          band17I: {
            list: false,
            type: 'number',
            order: 93,
            title: 'Intensity of Band 17 on Strip'
          },
          band7Co: {
            list: false,
            type: 'number',
            order: 54,
            title: 'Relative Intensity of Band 7 compared to CutOff'
          },
          windowsUser: {
            list: false,
            type: 'string',
            order: 27,
            title: 'User logged onto Windows System'
          },
          band20A: {
            list: false,
            type: 'number',
            order: 107,
            title: 'Integral (Area) of Band 20 on Strip'
          },
          band8R: {
            list: false,
            type: 'number',
            order: 60,
            title: 'Relative Intensity of Band 8'
          },
          band27I: {
            list: false,
            type: 'number',
            order: 133,
            title: 'Intensity of Band 27 on Strip'
          },
          band16I: {
            list: false,
            type: 'number',
            order: 89,
            title: 'Intensity of Band 16 on Strip'
          },
          band8Co: {
            list: false,
            type: 'number',
            order: 58,
            title: 'Relative Intensity of Band 8 compared to CutOff'
          },
          band26I: {
            list: false,
            type: 'number',
            order: 129,
            title: 'Intensity of Band 26 on Strip'
          },
          band9Co: {
            list: false,
            type: 'number',
            order: 62,
            title: 'Relative Intensity of Band 9 compared to CutOff'
          },
          band15I: {
            list: false,
            type: 'number',
            order: 85,
            title: 'Intensity of Band 15 on Strip'
          },
          band7R: {
            list: false,
            type: 'number',
            order: 56,
            title: 'Relative Intensity of Band 7'
          },
          band25I: {
            list: false,
            type: 'number',
            order: 125,
            title: 'Intensity of Band 25 on Strip'
          },
          band14I: {
            list: false,
            type: 'number',
            order: 81,
            title: 'Intensity of Band 14 on Strip'
          },
          band6R: {
            list: false,
            type: 'number',
            order: 52,
            title: 'Relative Intensity of Band 6'
          },
          band13I: {
            list: false,
            type: 'number',
            order: 77,
            title: 'Intensity of Band 13 on Strip'
          },
          stripType: {
            list: true,
            type: 'string',
            order: 8,
            title: 'Internal Type of Strip'
          },
          senaiteResult: {
            list: false,
            type: 'object',
            order: 140,
            title: 'Senaite LIMS Result',
            properties: {
              analyst: {
                type: 'string',
                order: 14,
                title: 'Analyst'
              },
              verificators: {
                type: 'string',
                order: 15,
                title: 'Verificators'
              },
              retested: {
                type: 'number',
                order: 1,
                title: 'Retested'
              },
              unit: {
                type: 'string',
                order: 7,
                title: 'Unit'
              },
              testReviewState: {
                type: 'string',
                order: 16,
                title: 'Test Review State'
              },
              instrument: {
                type: 'string',
                order: 10,
                title: 'Instrument'
              },
              hidden: {
                type: 'number',
                order: 12,
                title: 'Hidden'
              },
              resultText: {
                type: 'string',
                order: 3,
                title: 'Result Text'
              },
              modificationDate: {
                type: 'time',
                order: 20,
                title: 'Modified On'
              },
              creator: {
                type: 'string',
                order: 18,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 19,
                title: 'Created On'
              },
              worksheetAnalysisReviewState: {
                type: 'string',
                order: 17,
                title: 'Worksheet Analysis Review State'
              },
              value: {
                type: 'string',
                order: 4,
                title: 'Result Value'
              },
              remarks: {
                type: 'string',
                order: 6,
                title: 'Remarks'
              },
              manualEntryOfResults: {
                type: 'string',
                order: 9,
                title: 'Sample Partition ID'
              },
              instrumentEntryOfResults: {
                type: 'number',
                order: 11,
                title: 'Entered by Instrument'
              },
              resultCaptureDate: {
                type: 'time',
                order: 5,
                title: 'Capture date'
              },
              title: {
                type: 'string',
                order: 0,
                title: 'Test Type'
              },
              result: {
                type: 'string',
                order: 2,
                title: 'Selected Result'
              },
              hiddenManually: {
                type: 'number',
                order: 13,
                title: 'Hidden Manually'
              },
              pointOfCapture: {
                type: 'string',
                order: 8,
                title: 'Point of Capture'
              }
            }
          },
          band5R: {
            list: false,
            type: 'number',
            order: 48,
            title: 'Relative Intensity of Band 5'
          },
          band24I: {
            list: false,
            type: 'number',
            order: 121,
            title: 'Intensity of Band 24 on Strip'
          },
          elisaIgA: {
            list: true,
            type: 'string',
            order: 16,
            title: 'Result Elisa IgA'
          },
          band4R: {
            list: false,
            type: 'number',
            order: 44,
            title: 'Relative Intensity of Band 4'
          },
          band23I: {
            list: false,
            type: 'number',
            order: 117,
            title: 'Intensity of Band 23 on Strip'
          },
          band12I: {
            list: false,
            type: 'number',
            order: 73,
            title: 'Intensity of Band 12 on Strip'
          },
          cw: {
            list: false,
            type: 'number',
            order: 9,
            title: 'Internal Connected-With-Strip number'
          },
          charge: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Lot-Number of Testkit'
          },
          band3R: {
            list: false,
            type: 'number',
            order: 40,
            title: 'Relative Intensity of Band N'
          },
          band22I: {
            list: false,
            type: 'number',
            order: 113,
            title: 'Intensity of Band 22 on Strip'
          },
          band11I: {
            list: false,
            type: 'number',
            order: 69,
            title: 'Intensity of Band 11 on Strip'
          },
          band19R: {
            list: false,
            type: 'number',
            order: 104,
            title: 'Relative Intensity of Band 19'
          },
          band2R: {
            list: false,
            type: 'number',
            order: 36,
            title: 'Relative Intensity of Band 2'
          },
          band21I: {
            list: false,
            type: 'number',
            order: 109,
            title: 'Intensity of Band 21 on Strip'
          },
          band10I: {
            list: false,
            type: 'number',
            order: 65,
            title: 'Intensity of Band 10 on Strip'
          },
          band18R: {
            list: false,
            type: 'number',
            order: 100,
            title: 'Relative Intensity of Band 18'
          },
          band1R: {
            list: false,
            type: 'number',
            order: 32,
            title: 'Relative Intensity of Band 1'
          },
          band20I: {
            list: false,
            type: 'number',
            order: 105,
            title: 'Intensity of Band 20 on Strip'
          },
          band17R: {
            list: false,
            type: 'number',
            order: 96,
            title: 'Relative Intensity of Band 17'
          },
          band27R: {
            list: false,
            type: 'number',
            order: 136,
            title: 'Relative Intensity of Band 27'
          },
          band16R: {
            list: false,
            type: 'number',
            order: 92,
            title: 'Relative Intensity of Band 16'
          },
          igType: {
            list: true,
            type: 'string',
            order: 6,
            title: 'Internal Ig-Type'
          },
          band26R: {
            list: false,
            type: 'number',
            order: 132,
            title: 'Relative Intensity of Band 26'
          },
          band15R: {
            list: false,
            type: 'number',
            order: 88,
            title: 'Relative Intensity of Band 15'
          },
          elisaIgG: {
            list: true,
            type: 'string',
            order: 17,
            title: 'Result Elisa IgG'
          },
          probeNumber: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Blood-Sample-ID'
          },
          band25R: {
            list: false,
            type: 'number',
            order: 128,
            title: 'Relative Intensity of Band 25'
          },
          band14R: {
            list: false,
            type: 'number',
            order: 84,
            title: 'Relative Intensity of Band 14'
          },
          band13R: {
            list: false,
            type: 'number',
            order: 80,
            title: 'Relative Intensity of Band 13'
          },
          firstName: {
            list: false,
            type: 'string',
            order: 13,
            title: 'First name of Patient'
          },
          rjoined: {
            list: false,
            type: 'string',
            order: 24,
            title: 'Result for joined Analysis'
          },
          revision: {
            list: false,
            type: 'number',
            order: 4,
            title: 'Internal revision number of setcard'
          },
          band24R: {
            list: false,
            type: 'number',
            order: 124,
            title: 'Relative Intensity of Band 24'
          },
          band23R: {
            list: false,
            type: 'number',
            order: 120,
            title: 'Relative Intensity of Band 23'
          },
          band12R: {
            list: false,
            type: 'number',
            order: 76,
            title: 'Relative Intensity of Band 12'
          },
          result: {
            list: false,
            type: 'string',
            order: 23,
            title: 'Long form of result'
          },
          band9A: {
            list: false,
            type: 'number',
            order: 63,
            title: 'Integral (Area) of Band 9 on Strip'
          },
          company: {
            list: true,
            type: 'string',
            order: 2,
            title: 'Producer of Testkit'
          },
          control: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Internal name of control'
          },
          birthday: {
            list: false,
            type: 'date',
            order: 14,
            title: 'Date of Birth of Patient'
          },
          band22R: {
            list: false,
            type: 'number',
            order: 116,
            title: 'Relative Intensity of Band 22'
          },
          band11R: {
            list: false,
            type: 'number',
            order: 72,
            title: 'Relative Intensity of Band 11'
          },
          senaiteAnalysisRequest: {
            list: false,
            type: 'object',
            order: 137,
            title: 'Senaite LIMS Analysis Request',
            properties: {
              priority: {
                type: 'number',
                order: 1,
                title: 'Priority'
              },
              creatorFullName: {
                type: 'string',
                order: 6,
                title: 'Created By (Name)'
              },
              profile: {
                type: 'string',
                order: 0,
                title: 'Profile'
              },
              modificationDate: {
                type: 'time',
                order: 9,
                title: 'Modified On'
              },
              printed: {
                type: 'number',
                order: 4,
                title: 'Printed'
              },
              creator: {
                type: 'string',
                order: 5,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 8,
                title: 'Created On'
              },
              creatorEmail: {
                type: 'string',
                order: 7,
                title: 'Created By (Email)'
              },
              dateVerified: {
                type: 'time',
                order: 3,
                title: 'verified On'
              },
              doctorTitle: {
                type: 'string',
                order: 2,
                title: 'Doctor Title'
              }
            }
          },
          senaiteReferringFacility: {
            list: false,
            type: 'object',
            order: 138,
            title: 'Senaite LIMS Referring Facility',
            properties: {
              contactEmail: {
                type: 'string',
                order: 1,
                title: 'Contact Email'
              },
              contactFullName: {
                type: 'string',
                order: 0,
                title: 'Contact Name'
              }
            }
          },
          band21R: {
            list: false,
            type: 'number',
            order: 112,
            title: 'Relative Intensity of Band 21'
          },
          band10R: {
            list: false,
            type: 'number',
            order: 68,
            title: 'Relative Intensity of Band 10'
          },
          band8A: {
            list: false,
            type: 'number',
            order: 59,
            title: 'Integral (Area) of Band 8 on Strip'
          },
          senaiteSample: {
            list: false,
            type: 'object',
            order: 139,
            title: 'Senaite LIMS Sample',
            properties: {
              volume: {
                type: 'string',
                order: 3,
                title: 'Volume'
              },
              appearance: {
                type: 'string',
                order: 1,
                title: 'Appearance'
              },
              receivedBy: {
                type: 'string',
                order: 6,
                title: 'Received By'
              },
              partitionId: {
                type: 'string',
                order: 0,
                title: 'Sample Partition ID'
              },
              dateReceived: {
                type: 'time',
                order: 5,
                title: 'Date Received'
              },
              samplerEmail: {
                type: 'string',
                order: 7,
                title: 'Sampler Email'
              },
              volumeRemarks: {
                type: 'string',
                order: 4,
                title: 'Volume Remarks'
              },
              appearanceRemarks: {
                type: 'string',
                order: 2,
                title: 'Appearance Remarks'
              }
            }
          },
          elisaIgM: {
            list: true,
            type: 'string',
            order: 18,
            title: 'Result Elisa IgM'
          },
          band20Co: {
            list: false,
            type: 'number',
            order: 106,
            title: 'Relative Intensity of Band 20 compared to CutOff'
          },
          band20R: {
            list: false,
            type: 'number',
            order: 108,
            title: 'Relative Intensity of Band 20'
          },
          band7A: {
            list: false,
            type: 'number',
            order: 55,
            title: 'Integral (Area) of Band 7 on Strip'
          }
        },
        abilities: [
          {
            assayId: '11',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '11',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '11',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '11',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '11',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '11',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '11',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'GenoType MTBDRplus VER 2.0',
        resultCategory1i18nKey: null,
        deviceTypeId: '7',
        assayTypeId: '17',
        abbreviation: 'GTMTBDRplusV2',
        patientDataSchema: {
          xpertMtbRifResult: {
            type: 'string',
            order: 8,
            title: 'XPERT MTB RIF Result'
          },
          gender: {
            type: 'string',
            order: 2,
            title: 'Sex'
          },
          contactDetails: {
            type: 'string',
            order: 7,
            title: 'Contact Details'
          },
          lpaFl: {
            type: 'string',
            order: 5,
            title: 'LPA FL'
          },
          dateStartedOnTreatment: {
            type: 'string',
            order: 9,
            title: 'Date Started on TX'
          },
          site: {
            type: 'string',
            order: 5,
            title: 'Site'
          },
          baselineCulture: {
            type: 'string',
            order: 10,
            title: 'Baseline Culture'
          },
          name: {
            type: 'string',
            order: 0,
            title: 'Name of patient'
          },
          mgitSire: {
            type: 'string',
            order: 12,
            title: 'MGIT SIRE'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'Province'
          },
          lpaSl: {
            type: 'string',
            order: 11,
            title: 'LPA SL'
          },
          referringFacilitySampleId: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Sample ID from Referring Facility'
          },
          dateOfBirth: {
            type: 'string',
            order: 3,
            title: 'Date of Birth'
          },
          focalPerson: {
            type: 'string',
            order: 6,
            title: 'Focal Person'
          },
          id: {
            list: true,
            type: 'string',
            order: 13,
            title: 'Patient ID'
          },
          referringFacilityPatientName: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Patient Name from Referring Facility'
          },
          age: {
            type: 'number',
            order: 1,
            title: 'Age'
          }
        },
        deviceTypeExternalId: 'HainGenoScan',
        diseaseId: '1',
        id: '11',
        deviceTypeName: 'Hain GenoScan',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'Result',
        assayTypeName: 'GenoType Test Strip'
      },
      {
        assayTypeAbbreviation: 'GTTS',
        i18nKey: 'assayGenoTypeMTBDRslV1',
        externalId: 'assayGenoTypeMTBDRslV1',
        resultDataSchema: {
          band10Co: {
            list: false,
            type: 'number',
            order: 66,
            title: 'Relative Intensity of Band 10 compared to CutOff'
          },
          cutOffTolerance: {
            list: false,
            type: 'number',
            order: 21,
            title: 'Cut-Off Tolerance value'
          },
          band21Co: {
            list: false,
            type: 'number',
            order: 110,
            title: 'Relative Intensity of Band 21 compared to CutOff'
          },
          band6A: {
            list: false,
            type: 'number',
            order: 51,
            title: 'Integral (Area) of Band 6 on Strip'
          },
          dateOfAnalysis: {
            list: false,
            type: 'date',
            order: 20,
            title: 'Date of Analysis'
          },
          no: {
            list: false,
            type: 'number',
            order: 1,
            title: 'Order-Number of Strip in Analysis'
          },
          lastName: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Last name of Patient'
          },
          band11Co: {
            list: false,
            type: 'number',
            order: 70,
            title: 'Relative Intensity of Band 11 compared to CutOff'
          },
          band22Co: {
            list: false,
            type: 'number',
            order: 114,
            title: 'Relative Intensity of Band 22 compared to CutOff'
          },
          band5A: {
            list: false,
            type: 'number',
            order: 47,
            title: 'Integral (Area) of Band 5 on Strip'
          },
          band12Co: {
            list: false,
            type: 'number',
            order: 74,
            title: 'Relative Intensity of Band 12 compared to CutOff'
          },
          band4A: {
            list: false,
            type: 'number',
            order: 43,
            title: 'Integral (Area) of Band 4 on Strip'
          },
          checkSum: {
            list: false,
            type: 'number',
            order: 28,
            title: 'Checksum for data row'
          },
          band13Co: {
            list: false,
            type: 'number',
            order: 78,
            title: 'Relative Intensity of Band 13 compared to CutOff'
          },
          typeOfTest: {
            list: true,
            type: 'string',
            order: 3,
            title: 'Internal name of setcard'
          },
          band3A: {
            list: false,
            type: 'number',
            order: 39,
            title: 'Integral (Area) of Band N on Strip'
          },
          band19A: {
            list: false,
            type: 'number',
            order: 103,
            title: 'Integral (Area) of Band 19 on Strip'
          },
          band14Co: {
            list: false,
            type: 'number',
            order: 82,
            title: 'Relative Intensity of Band 14 compared to CutOff'
          },
          band2A: {
            list: false,
            type: 'number',
            order: 35,
            title: 'Integral (Area) of Band 2 on Strip'
          },
          band9I: {
            list: false,
            type: 'number',
            order: 61,
            title: 'Intensity of Band 9 on Strip'
          },
          band18A: {
            list: false,
            type: 'number',
            order: 99,
            title: 'Integral (Area) of Band 18 on Strip'
          },
          band15Co: {
            list: false,
            type: 'number',
            order: 86,
            title: 'Relative Intensity of Band 15 compared to CutOff'
          },
          antigens: {
            list: false,
            type: 'string',
            order: 25,
            title: 'Antigens'
          },
          band1A: {
            list: false,
            type: 'number',
            order: 31,
            title: 'Integral (Area) of Band 1 on Strip'
          },
          band8I: {
            list: false,
            type: 'number',
            order: 57,
            title: 'Intensity of Band 8 on Strip'
          },
          sex: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Sex of Patient'
          },
          band17A: {
            list: false,
            type: 'number',
            order: 95,
            title: 'Integral (Area) of Band 17 on Strip'
          },
          band16Co: {
            list: false,
            type: 'number',
            order: 90,
            title: 'Relative Intensity of Band 16 compared to CutOff'
          },
          band16A: {
            list: false,
            type: 'number',
            order: 91,
            title: 'Integral (Area) of Band 16 on Strip'
          },
          band17Co: {
            list: false,
            type: 'number',
            order: 94,
            title: 'Relative Intensity of Band 17 compared to CutOff'
          },
          band7I: {
            list: false,
            type: 'number',
            order: 53,
            title: 'Intensity of Band 7 on Strip'
          },
          band15A: {
            list: false,
            type: 'number',
            order: 87,
            title: 'Integral (Area) of Band 15 on Strip'
          },
          band18Co: {
            list: false,
            type: 'number',
            order: 98,
            title: 'Relative Intensity of Band 18 compared to CutOff'
          },
          band1Co: {
            list: false,
            type: 'number',
            order: 30,
            title: 'Relative Intensity of Band 1 compared to CutOff'
          },
          revAntigens: {
            list: false,
            type: 'string',
            order: 26,
            title: 'Content of "Revised Antigens" Field in Analysis Window'
          },
          band6I: {
            list: false,
            type: 'number',
            order: 49,
            title: 'Intensity of Band 6 on Strip'
          },
          band14A: {
            list: false,
            type: 'number',
            order: 83,
            title: 'Integral (Area) of Band 14 on Strip'
          },
          band19Co: {
            list: false,
            type: 'number',
            order: 102,
            title: 'Relative Intensity of Band 19 compared to CutOff'
          },
          band2Co: {
            list: false,
            type: 'number',
            order: 34,
            title: 'Relative Intensity of Band 2 compared to CutOff'
          },
          band5I: {
            list: false,
            type: 'number',
            order: 45,
            title: 'Intensity of Band 5 on Strip'
          },
          band13A: {
            list: false,
            type: 'number',
            order: 79,
            title: 'Integral (Area) of Band 13 on Strip'
          },
          dateOfRequest: {
            list: false,
            type: 'date',
            order: 19,
            title: 'Date of Request'
          },
          band3Co: {
            list: false,
            type: 'number',
            order: 38,
            title: 'Relative Intensity of Band N compared to CutOff'
          },
          rShort: {
            list: true,
            type: 'string',
            order: 22,
            title: 'Short form of result'
          },
          band4I: {
            list: false,
            type: 'number',
            order: 41,
            title: 'Intensity of Band 4 on Strip'
          },
          band4Co: {
            list: false,
            type: 'number',
            order: 42,
            title: 'Relative Intensity of Band 4 compared to CutOff'
          },
          pid: {
            list: true,
            type: 'string',
            order: 11,
            title: 'External Patient-ID'
          },
          band3I: {
            list: false,
            type: 'number',
            order: 37,
            title: 'Intensity of Band N on Strip'
          },
          band12A: {
            list: false,
            type: 'number',
            order: 75,
            title: 'Integral (Area) of Band 12 on Strip'
          },
          band19I: {
            list: false,
            type: 'number',
            order: 101,
            title: 'Intensity of Band 19 on Strip'
          },
          band5Co: {
            list: false,
            type: 'number',
            order: 46,
            title: 'Relative Intensity of Band 5 compared to CutOff'
          },
          band2I: {
            list: false,
            type: 'number',
            order: 33,
            title: 'Intensity of Band 2 on Strip'
          },
          band22A: {
            list: false,
            type: 'number',
            order: 115,
            title: 'Integral (Area) of Band 22 on Strip'
          },
          band11A: {
            list: false,
            type: 'number',
            order: 71,
            title: 'Integral (Area) of Band 11 on Strip'
          },
          band18I: {
            list: false,
            type: 'number',
            order: 97,
            title: 'Intensity of Band 18 on Strip'
          },
          band6Co: {
            list: false,
            type: 'number',
            order: 50,
            title: 'Relative Intensity of Band 6 compared to CutOff'
          },
          band1I: {
            list: false,
            type: 'number',
            order: 29,
            title: 'Intensity of Band 1 on Strip'
          },
          band21A: {
            list: false,
            type: 'number',
            order: 111,
            title: 'Integral (Area) of Band 21 on Strip'
          },
          band10A: {
            list: false,
            type: 'number',
            order: 67,
            title: 'Integral (Area) of Band 10 on Strip'
          },
          band9R: {
            list: false,
            type: 'number',
            order: 64,
            title: 'Relative Intensity of Band 9'
          },
          band17I: {
            list: false,
            type: 'number',
            order: 93,
            title: 'Intensity of Band 17 on Strip'
          },
          band7Co: {
            list: false,
            type: 'number',
            order: 54,
            title: 'Relative Intensity of Band 7 compared to CutOff'
          },
          windowsUser: {
            list: false,
            type: 'string',
            order: 27,
            title: 'User logged onto Windows System'
          },
          band20A: {
            list: false,
            type: 'number',
            order: 107,
            title: 'Integral (Area) of Band 20 on Strip'
          },
          band8R: {
            list: false,
            type: 'number',
            order: 60,
            title: 'Relative Intensity of Band 8'
          },
          band16I: {
            list: false,
            type: 'number',
            order: 89,
            title: 'Intensity of Band 16 on Strip'
          },
          band8Co: {
            list: false,
            type: 'number',
            order: 58,
            title: 'Relative Intensity of Band 8 compared to CutOff'
          },
          band9Co: {
            list: false,
            type: 'number',
            order: 62,
            title: 'Relative Intensity of Band 9 compared to CutOff'
          },
          band15I: {
            list: false,
            type: 'number',
            order: 85,
            title: 'Intensity of Band 15 on Strip'
          },
          band7R: {
            list: false,
            type: 'number',
            order: 56,
            title: 'Relative Intensity of Band 7'
          },
          band14I: {
            list: false,
            type: 'number',
            order: 81,
            title: 'Intensity of Band 14 on Strip'
          },
          band6R: {
            list: false,
            type: 'number',
            order: 52,
            title: 'Relative Intensity of Band 6'
          },
          band13I: {
            list: false,
            type: 'number',
            order: 77,
            title: 'Intensity of Band 13 on Strip'
          },
          stripType: {
            list: true,
            type: 'string',
            order: 8,
            title: 'Internal Type of Strip'
          },
          senaiteResult: {
            list: false,
            type: 'object',
            order: 120,
            title: 'Senaite LIMS Result',
            properties: {
              analyst: {
                type: 'string',
                order: 14,
                title: 'Analyst'
              },
              verificators: {
                type: 'string',
                order: 15,
                title: 'Verificators'
              },
              retested: {
                type: 'number',
                order: 1,
                title: 'Retested'
              },
              unit: {
                type: 'string',
                order: 7,
                title: 'Unit'
              },
              testReviewState: {
                type: 'string',
                order: 16,
                title: 'Test Review State'
              },
              instrument: {
                type: 'string',
                order: 10,
                title: 'Instrument'
              },
              hidden: {
                type: 'number',
                order: 12,
                title: 'Hidden'
              },
              resultText: {
                type: 'string',
                order: 3,
                title: 'Result Text'
              },
              modificationDate: {
                type: 'time',
                order: 20,
                title: 'Modified On'
              },
              creator: {
                type: 'string',
                order: 18,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 19,
                title: 'Created On'
              },
              worksheetAnalysisReviewState: {
                type: 'string',
                order: 17,
                title: 'Worksheet Analysis Review State'
              },
              value: {
                type: 'string',
                order: 4,
                title: 'Result Value'
              },
              remarks: {
                type: 'string',
                order: 6,
                title: 'Remarks'
              },
              manualEntryOfResults: {
                type: 'string',
                order: 9,
                title: 'Sample Partition ID'
              },
              instrumentEntryOfResults: {
                type: 'number',
                order: 11,
                title: 'Entered by Instrument'
              },
              resultCaptureDate: {
                type: 'time',
                order: 5,
                title: 'Capture date'
              },
              title: {
                type: 'string',
                order: 0,
                title: 'Test Type'
              },
              result: {
                type: 'string',
                order: 2,
                title: 'Selected Result'
              },
              hiddenManually: {
                type: 'number',
                order: 13,
                title: 'Hidden Manually'
              },
              pointOfCapture: {
                type: 'string',
                order: 8,
                title: 'Point of Capture'
              }
            }
          },
          band5R: {
            list: false,
            type: 'number',
            order: 48,
            title: 'Relative Intensity of Band 5'
          },
          elisaIgA: {
            list: true,
            type: 'string',
            order: 16,
            title: 'Result Elisa IgA'
          },
          band4R: {
            list: false,
            type: 'number',
            order: 44,
            title: 'Relative Intensity of Band 4'
          },
          band12I: {
            list: false,
            type: 'number',
            order: 73,
            title: 'Intensity of Band 12 on Strip'
          },
          cw: {
            list: false,
            type: 'number',
            order: 9,
            title: 'Internal Connected-With-Strip number'
          },
          charge: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Lot-Number of Testkit'
          },
          band3R: {
            list: false,
            type: 'number',
            order: 40,
            title: 'Relative Intensity of Band N'
          },
          band22I: {
            list: false,
            type: 'number',
            order: 113,
            title: 'Intensity of Band 22 on Strip'
          },
          band11I: {
            list: false,
            type: 'number',
            order: 69,
            title: 'Intensity of Band 11 on Strip'
          },
          band19R: {
            list: false,
            type: 'number',
            order: 104,
            title: 'Relative Intensity of Band 19'
          },
          band2R: {
            list: false,
            type: 'number',
            order: 36,
            title: 'Relative Intensity of Band 2'
          },
          band21I: {
            list: false,
            type: 'number',
            order: 109,
            title: 'Intensity of Band 21 on Strip'
          },
          band10I: {
            list: false,
            type: 'number',
            order: 65,
            title: 'Intensity of Band 10 on Strip'
          },
          band18R: {
            list: false,
            type: 'number',
            order: 100,
            title: 'Relative Intensity of Band 18'
          },
          band1R: {
            list: false,
            type: 'number',
            order: 32,
            title: 'Relative Intensity of Band 1'
          },
          band20I: {
            list: false,
            type: 'number',
            order: 105,
            title: 'Intensity of Band 20 on Strip'
          },
          band17R: {
            list: false,
            type: 'number',
            order: 96,
            title: 'Relative Intensity of Band 17'
          },
          band16R: {
            list: false,
            type: 'number',
            order: 92,
            title: 'Relative Intensity of Band 16'
          },
          igType: {
            list: true,
            type: 'string',
            order: 6,
            title: 'Internal Ig-Type'
          },
          band15R: {
            list: false,
            type: 'number',
            order: 88,
            title: 'Relative Intensity of Band 15'
          },
          elisaIgG: {
            list: true,
            type: 'string',
            order: 17,
            title: 'Result Elisa IgG'
          },
          probeNumber: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Blood-Sample-ID'
          },
          band14R: {
            list: false,
            type: 'number',
            order: 84,
            title: 'Relative Intensity of Band 14'
          },
          band13R: {
            list: false,
            type: 'number',
            order: 80,
            title: 'Relative Intensity of Band 13'
          },
          firstName: {
            list: false,
            type: 'string',
            order: 13,
            title: 'First name of Patient'
          },
          rjoined: {
            list: false,
            type: 'string',
            order: 24,
            title: 'Result for joined Analysis'
          },
          revision: {
            list: false,
            type: 'number',
            order: 4,
            title: 'Internal revision number of setcard'
          },
          band12R: {
            list: false,
            type: 'number',
            order: 76,
            title: 'Relative Intensity of Band 12'
          },
          result: {
            list: false,
            type: 'string',
            order: 23,
            title: 'Long form of result'
          },
          band9A: {
            list: false,
            type: 'number',
            order: 63,
            title: 'Integral (Area) of Band 9 on Strip'
          },
          company: {
            list: true,
            type: 'string',
            order: 2,
            title: 'Producer of Testkit'
          },
          control: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Internal name of control'
          },
          birthday: {
            list: false,
            type: 'date',
            order: 14,
            title: 'Date of Birth of Patient'
          },
          band22R: {
            list: false,
            type: 'number',
            order: 116,
            title: 'Relative Intensity of Band 22'
          },
          band11R: {
            list: false,
            type: 'number',
            order: 72,
            title: 'Relative Intensity of Band 11'
          },
          senaiteAnalysisRequest: {
            list: false,
            type: 'object',
            order: 117,
            title: 'Senaite LIMS Analysis Request',
            properties: {
              priority: {
                type: 'number',
                order: 1,
                title: 'Priority'
              },
              creatorFullName: {
                type: 'string',
                order: 6,
                title: 'Created By (Name)'
              },
              profile: {
                type: 'string',
                order: 0,
                title: 'Profile'
              },
              modificationDate: {
                type: 'time',
                order: 9,
                title: 'Modified On'
              },
              printed: {
                type: 'number',
                order: 4,
                title: 'Printed'
              },
              creator: {
                type: 'string',
                order: 5,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 8,
                title: 'Created On'
              },
              creatorEmail: {
                type: 'string',
                order: 7,
                title: 'Created By (Email)'
              },
              dateVerified: {
                type: 'time',
                order: 3,
                title: 'verified On'
              },
              doctorTitle: {
                type: 'string',
                order: 2,
                title: 'Doctor Title'
              }
            }
          },
          senaiteReferringFacility: {
            list: false,
            type: 'object',
            order: 118,
            title: 'Senaite LIMS Referring Facility',
            properties: {
              contactEmail: {
                type: 'string',
                order: 1,
                title: 'Contact Email'
              },
              contactFullName: {
                type: 'string',
                order: 0,
                title: 'Contact Name'
              }
            }
          },
          band21R: {
            list: false,
            type: 'number',
            order: 112,
            title: 'Relative Intensity of Band 21'
          },
          band10R: {
            list: false,
            type: 'number',
            order: 68,
            title: 'Relative Intensity of Band 10'
          },
          band8A: {
            list: false,
            type: 'number',
            order: 59,
            title: 'Integral (Area) of Band 8 on Strip'
          },
          senaiteSample: {
            list: false,
            type: 'object',
            order: 119,
            title: 'Senaite LIMS Sample',
            properties: {
              volume: {
                type: 'string',
                order: 3,
                title: 'Volume'
              },
              appearance: {
                type: 'string',
                order: 1,
                title: 'Appearance'
              },
              receivedBy: {
                type: 'string',
                order: 6,
                title: 'Received By'
              },
              partitionId: {
                type: 'string',
                order: 0,
                title: 'Sample Partition ID'
              },
              dateReceived: {
                type: 'time',
                order: 5,
                title: 'Date Received'
              },
              samplerEmail: {
                type: 'string',
                order: 7,
                title: 'Sampler Email'
              },
              volumeRemarks: {
                type: 'string',
                order: 4,
                title: 'Volume Remarks'
              },
              appearanceRemarks: {
                type: 'string',
                order: 2,
                title: 'Appearance Remarks'
              }
            }
          },
          elisaIgM: {
            list: true,
            type: 'string',
            order: 18,
            title: 'Result Elisa IgM'
          },
          band20Co: {
            list: false,
            type: 'number',
            order: 106,
            title: 'Relative Intensity of Band 20 compared to CutOff'
          },
          band20R: {
            list: false,
            type: 'number',
            order: 108,
            title: 'Relative Intensity of Band 20'
          },
          band7A: {
            list: false,
            type: 'number',
            order: 55,
            title: 'Integral (Area) of Band 7 on Strip'
          }
        },
        abilities: [
          {
            assayId: '12',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '12',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '12',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '12',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '12',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '12',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '12',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'GenoType MTBDRsl VER 1.0',
        resultCategory1i18nKey: null,
        deviceTypeId: '7',
        assayTypeId: '17',
        abbreviation: 'GTMTBDRslV1',
        patientDataSchema: {
          xpertMtbRifResult: {
            type: 'string',
            order: 8,
            title: 'XPERT MTB RIF Result'
          },
          gender: {
            type: 'string',
            order: 2,
            title: 'Sex'
          },
          contactDetails: {
            type: 'string',
            order: 7,
            title: 'Contact Details'
          },
          lpaFl: {
            type: 'string',
            order: 5,
            title: 'LPA FL'
          },
          dateStartedOnTreatment: {
            type: 'string',
            order: 9,
            title: 'Date Started on TX'
          },
          site: {
            type: 'string',
            order: 5,
            title: 'Site'
          },
          baselineCulture: {
            type: 'string',
            order: 10,
            title: 'Baseline Culture'
          },
          name: {
            type: 'string',
            order: 0,
            title: 'Name of patient'
          },
          mgitSire: {
            type: 'string',
            order: 12,
            title: 'MGIT SIRE'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'Province'
          },
          lpaSl: {
            type: 'string',
            order: 11,
            title: 'LPA SL'
          },
          referringFacilitySampleId: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Sample ID from Referring Facility'
          },
          dateOfBirth: {
            type: 'string',
            order: 3,
            title: 'Date of Birth'
          },
          focalPerson: {
            type: 'string',
            order: 6,
            title: 'Focal Person'
          },
          id: {
            list: true,
            type: 'string',
            order: 13,
            title: 'Patient ID'
          },
          referringFacilityPatientName: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Patient Name from Referring Facility'
          },
          age: {
            type: 'number',
            order: 1,
            title: 'Age'
          }
        },
        deviceTypeExternalId: 'HainGenoScan',
        diseaseId: '1',
        id: '12',
        deviceTypeName: 'Hain GenoScan',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'Result',
        assayTypeName: 'GenoType Test Strip'
      },
      {
        assayTypeAbbreviation: 'GTTS',
        i18nKey: 'assayGenoTypeMTBDRslV2',
        externalId: 'assayGenoTypeMTBDRslV2',
        resultDataSchema: {
          band10Co: {
            list: false,
            type: 'number',
            order: 66,
            title: 'Relative Intensity of Band 10 compared to CutOff'
          },
          cutOffTolerance: {
            list: false,
            type: 'number',
            order: 21,
            title: 'Cut-Off Tolerance value'
          },
          band21Co: {
            list: false,
            type: 'number',
            order: 110,
            title: 'Relative Intensity of Band 21 compared to CutOff'
          },
          band6A: {
            list: false,
            type: 'number',
            order: 51,
            title: 'Integral (Area) of Band 6 on Strip'
          },
          dateOfAnalysis: {
            list: false,
            type: 'date',
            order: 20,
            title: 'Date of Analysis'
          },
          no: {
            list: false,
            type: 'number',
            order: 1,
            title: 'Order-Number of Strip in Analysis'
          },
          lastName: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Last name of Patient'
          },
          band11Co: {
            list: false,
            type: 'number',
            order: 70,
            title: 'Relative Intensity of Band 11 compared to CutOff'
          },
          band22Co: {
            list: false,
            type: 'number',
            order: 114,
            title: 'Relative Intensity of Band 22 compared to CutOff'
          },
          band5A: {
            list: false,
            type: 'number',
            order: 47,
            title: 'Integral (Area) of Band 5 on Strip'
          },
          band12Co: {
            list: false,
            type: 'number',
            order: 74,
            title: 'Relative Intensity of Band 12 compared to CutOff'
          },
          band23Co: {
            list: false,
            type: 'number',
            order: 118,
            title: 'Relative Intensity of Band 23 compared to CutOff'
          },
          band4A: {
            list: false,
            type: 'number',
            order: 43,
            title: 'Integral (Area) of Band 4 on Strip'
          },
          checkSum: {
            list: false,
            type: 'number',
            order: 28,
            title: 'Checksum for data row'
          },
          band13Co: {
            list: false,
            type: 'number',
            order: 78,
            title: 'Relative Intensity of Band 13 compared to CutOff'
          },
          band24Co: {
            list: false,
            type: 'number',
            order: 122,
            title: 'Relative Intensity of Band 24 compared to CutOff'
          },
          typeOfTest: {
            list: true,
            type: 'string',
            order: 3,
            title: 'Internal name of setcard'
          },
          band3A: {
            list: false,
            type: 'number',
            order: 39,
            title: 'Integral (Area) of Band N on Strip'
          },
          band19A: {
            list: false,
            type: 'number',
            order: 103,
            title: 'Integral (Area) of Band 19 on Strip'
          },
          band14Co: {
            list: false,
            type: 'number',
            order: 82,
            title: 'Relative Intensity of Band 14 compared to CutOff'
          },
          band25Co: {
            list: false,
            type: 'number',
            order: 126,
            title: 'Relative Intensity of Band 25 compared to CutOff'
          },
          band2A: {
            list: false,
            type: 'number',
            order: 35,
            title: 'Integral (Area) of Band 2 on Strip'
          },
          band9I: {
            list: false,
            type: 'number',
            order: 61,
            title: 'Intensity of Band 9 on Strip'
          },
          band18A: {
            list: false,
            type: 'number',
            order: 99,
            title: 'Integral (Area) of Band 18 on Strip'
          },
          band15Co: {
            list: false,
            type: 'number',
            order: 86,
            title: 'Relative Intensity of Band 15 compared to CutOff'
          },
          antigens: {
            list: false,
            type: 'string',
            order: 25,
            title: 'Antigens'
          },
          band26Co: {
            list: false,
            type: 'number',
            order: 130,
            title: 'Relative Intensity of Band 26 compared to CutOff'
          },
          band1A: {
            list: false,
            type: 'number',
            order: 31,
            title: 'Integral (Area) of Band 1 on Strip'
          },
          band8I: {
            list: false,
            type: 'number',
            order: 57,
            title: 'Intensity of Band 8 on Strip'
          },
          sex: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Sex of Patient'
          },
          band17A: {
            list: false,
            type: 'number',
            order: 95,
            title: 'Integral (Area) of Band 17 on Strip'
          },
          band16Co: {
            list: false,
            type: 'number',
            order: 90,
            title: 'Relative Intensity of Band 16 compared to CutOff'
          },
          band27Co: {
            list: false,
            type: 'number',
            order: 134,
            title: 'Relative Intensity of Band 27 compared to CutOff'
          },
          band27A: {
            list: false,
            type: 'number',
            order: 135,
            title: 'Integral (Area) of Band 27 on Strip'
          },
          band16A: {
            list: false,
            type: 'number',
            order: 91,
            title: 'Integral (Area) of Band 16 on Strip'
          },
          band17Co: {
            list: false,
            type: 'number',
            order: 94,
            title: 'Relative Intensity of Band 17 compared to CutOff'
          },
          band7I: {
            list: false,
            type: 'number',
            order: 53,
            title: 'Intensity of Band 7 on Strip'
          },
          band26A: {
            list: false,
            type: 'number',
            order: 131,
            title: 'Integral (Area) of Band 26 on Strip'
          },
          band15A: {
            list: false,
            type: 'number',
            order: 87,
            title: 'Integral (Area) of Band 15 on Strip'
          },
          band18Co: {
            list: false,
            type: 'number',
            order: 98,
            title: 'Relative Intensity of Band 18 compared to CutOff'
          },
          band1Co: {
            list: false,
            type: 'number',
            order: 30,
            title: 'Relative Intensity of Band 1 compared to CutOff'
          },
          revAntigens: {
            list: false,
            type: 'string',
            order: 26,
            title: 'Content of "Revised Antigens" Field in Analysis Window'
          },
          band6I: {
            list: false,
            type: 'number',
            order: 49,
            title: 'Intensity of Band 6 on Strip'
          },
          band25A: {
            list: false,
            type: 'number',
            order: 127,
            title: 'Integral (Area) of Band 25 on Strip'
          },
          band14A: {
            list: false,
            type: 'number',
            order: 83,
            title: 'Integral (Area) of Band 14 on Strip'
          },
          band19Co: {
            list: false,
            type: 'number',
            order: 102,
            title: 'Relative Intensity of Band 19 compared to CutOff'
          },
          band2Co: {
            list: false,
            type: 'number',
            order: 34,
            title: 'Relative Intensity of Band 2 compared to CutOff'
          },
          band5I: {
            list: false,
            type: 'number',
            order: 45,
            title: 'Intensity of Band 5 on Strip'
          },
          band13A: {
            list: false,
            type: 'number',
            order: 79,
            title: 'Integral (Area) of Band 13 on Strip'
          },
          dateOfRequest: {
            list: false,
            type: 'date',
            order: 19,
            title: 'Date of Request'
          },
          band3Co: {
            list: false,
            type: 'number',
            order: 38,
            title: 'Relative Intensity of Band N compared to CutOff'
          },
          rShort: {
            list: true,
            type: 'string',
            order: 22,
            title: 'Short form of result'
          },
          band4I: {
            list: false,
            type: 'number',
            order: 41,
            title: 'Intensity of Band 4 on Strip'
          },
          band24A: {
            list: false,
            type: 'number',
            order: 123,
            title: 'Integral (Area) of Band 24 on Strip'
          },
          band4Co: {
            list: false,
            type: 'number',
            order: 42,
            title: 'Relative Intensity of Band 4 compared to CutOff'
          },
          pid: {
            list: true,
            type: 'string',
            order: 11,
            title: 'External Patient-ID'
          },
          band3I: {
            list: false,
            type: 'number',
            order: 37,
            title: 'Intensity of Band N on Strip'
          },
          band23A: {
            list: false,
            type: 'number',
            order: 119,
            title: 'Integral (Area) of Band 23 on Strip'
          },
          band12A: {
            list: false,
            type: 'number',
            order: 75,
            title: 'Integral (Area) of Band 12 on Strip'
          },
          band19I: {
            list: false,
            type: 'number',
            order: 101,
            title: 'Intensity of Band 19 on Strip'
          },
          band5Co: {
            list: false,
            type: 'number',
            order: 46,
            title: 'Relative Intensity of Band 5 compared to CutOff'
          },
          band2I: {
            list: false,
            type: 'number',
            order: 33,
            title: 'Intensity of Band 2 on Strip'
          },
          band22A: {
            list: false,
            type: 'number',
            order: 115,
            title: 'Integral (Area) of Band 22 on Strip'
          },
          band11A: {
            list: false,
            type: 'number',
            order: 71,
            title: 'Integral (Area) of Band 11 on Strip'
          },
          band18I: {
            list: false,
            type: 'number',
            order: 97,
            title: 'Intensity of Band 18 on Strip'
          },
          band6Co: {
            list: false,
            type: 'number',
            order: 50,
            title: 'Relative Intensity of Band 6 compared to CutOff'
          },
          band1I: {
            list: false,
            type: 'number',
            order: 29,
            title: 'Intensity of Band 1 on Strip'
          },
          band21A: {
            list: false,
            type: 'number',
            order: 111,
            title: 'Integral (Area) of Band 21 on Strip'
          },
          band10A: {
            list: false,
            type: 'number',
            order: 67,
            title: 'Integral (Area) of Band 10 on Strip'
          },
          band9R: {
            list: false,
            type: 'number',
            order: 64,
            title: 'Relative Intensity of Band 9'
          },
          band17I: {
            list: false,
            type: 'number',
            order: 93,
            title: 'Intensity of Band 17 on Strip'
          },
          band7Co: {
            list: false,
            type: 'number',
            order: 54,
            title: 'Relative Intensity of Band 7 compared to CutOff'
          },
          windowsUser: {
            list: false,
            type: 'string',
            order: 27,
            title: 'User logged onto Windows System'
          },
          band20A: {
            list: false,
            type: 'number',
            order: 107,
            title: 'Integral (Area) of Band 20 on Strip'
          },
          band8R: {
            list: false,
            type: 'number',
            order: 60,
            title: 'Relative Intensity of Band 8'
          },
          band27I: {
            list: false,
            type: 'number',
            order: 133,
            title: 'Intensity of Band 27 on Strip'
          },
          band16I: {
            list: false,
            type: 'number',
            order: 89,
            title: 'Intensity of Band 16 on Strip'
          },
          band8Co: {
            list: false,
            type: 'number',
            order: 58,
            title: 'Relative Intensity of Band 8 compared to CutOff'
          },
          band26I: {
            list: false,
            type: 'number',
            order: 129,
            title: 'Intensity of Band 26 on Strip'
          },
          band9Co: {
            list: false,
            type: 'number',
            order: 62,
            title: 'Relative Intensity of Band 9 compared to CutOff'
          },
          band15I: {
            list: false,
            type: 'number',
            order: 85,
            title: 'Intensity of Band 15 on Strip'
          },
          band7R: {
            list: false,
            type: 'number',
            order: 56,
            title: 'Relative Intensity of Band 7'
          },
          band25I: {
            list: false,
            type: 'number',
            order: 125,
            title: 'Intensity of Band 25 on Strip'
          },
          band14I: {
            list: false,
            type: 'number',
            order: 81,
            title: 'Intensity of Band 14 on Strip'
          },
          band6R: {
            list: false,
            type: 'number',
            order: 52,
            title: 'Relative Intensity of Band 6'
          },
          band13I: {
            list: false,
            type: 'number',
            order: 77,
            title: 'Intensity of Band 13 on Strip'
          },
          stripType: {
            list: true,
            type: 'string',
            order: 8,
            title: 'Internal Type of Strip'
          },
          senaiteResult: {
            list: false,
            type: 'object',
            order: 140,
            title: 'Senaite LIMS Result',
            properties: {
              analyst: {
                type: 'string',
                order: 14,
                title: 'Analyst'
              },
              verificators: {
                type: 'string',
                order: 15,
                title: 'Verificators'
              },
              retested: {
                type: 'number',
                order: 1,
                title: 'Retested'
              },
              unit: {
                type: 'string',
                order: 7,
                title: 'Unit'
              },
              testReviewState: {
                type: 'string',
                order: 16,
                title: 'Test Review State'
              },
              instrument: {
                type: 'string',
                order: 10,
                title: 'Instrument'
              },
              hidden: {
                type: 'number',
                order: 12,
                title: 'Hidden'
              },
              resultText: {
                type: 'string',
                order: 3,
                title: 'Result Text'
              },
              modificationDate: {
                type: 'time',
                order: 20,
                title: 'Modified On'
              },
              creator: {
                type: 'string',
                order: 18,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 19,
                title: 'Created On'
              },
              worksheetAnalysisReviewState: {
                type: 'string',
                order: 17,
                title: 'Worksheet Analysis Review State'
              },
              value: {
                type: 'string',
                order: 4,
                title: 'Result Value'
              },
              remarks: {
                type: 'string',
                order: 6,
                title: 'Remarks'
              },
              manualEntryOfResults: {
                type: 'string',
                order: 9,
                title: 'Sample Partition ID'
              },
              instrumentEntryOfResults: {
                type: 'number',
                order: 11,
                title: 'Entered by Instrument'
              },
              resultCaptureDate: {
                type: 'time',
                order: 5,
                title: 'Capture date'
              },
              title: {
                type: 'string',
                order: 0,
                title: 'Test Type'
              },
              result: {
                type: 'string',
                order: 2,
                title: 'Selected Result'
              },
              hiddenManually: {
                type: 'number',
                order: 13,
                title: 'Hidden Manually'
              },
              pointOfCapture: {
                type: 'string',
                order: 8,
                title: 'Point of Capture'
              }
            }
          },
          band5R: {
            list: false,
            type: 'number',
            order: 48,
            title: 'Relative Intensity of Band 5'
          },
          band24I: {
            list: false,
            type: 'number',
            order: 121,
            title: 'Intensity of Band 24 on Strip'
          },
          elisaIgA: {
            list: true,
            type: 'string',
            order: 16,
            title: 'Result Elisa IgA'
          },
          band4R: {
            list: false,
            type: 'number',
            order: 44,
            title: 'Relative Intensity of Band 4'
          },
          band23I: {
            list: false,
            type: 'number',
            order: 117,
            title: 'Intensity of Band 23 on Strip'
          },
          band12I: {
            list: false,
            type: 'number',
            order: 73,
            title: 'Intensity of Band 12 on Strip'
          },
          cw: {
            list: false,
            type: 'number',
            order: 9,
            title: 'Internal Connected-With-Strip number'
          },
          charge: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Lot-Number of Testkit'
          },
          band3R: {
            list: false,
            type: 'number',
            order: 40,
            title: 'Relative Intensity of Band N'
          },
          band22I: {
            list: false,
            type: 'number',
            order: 113,
            title: 'Intensity of Band 22 on Strip'
          },
          band11I: {
            list: false,
            type: 'number',
            order: 69,
            title: 'Intensity of Band 11 on Strip'
          },
          band19R: {
            list: false,
            type: 'number',
            order: 104,
            title: 'Relative Intensity of Band 19'
          },
          band2R: {
            list: false,
            type: 'number',
            order: 36,
            title: 'Relative Intensity of Band 2'
          },
          band21I: {
            list: false,
            type: 'number',
            order: 109,
            title: 'Intensity of Band 21 on Strip'
          },
          band10I: {
            list: false,
            type: 'number',
            order: 65,
            title: 'Intensity of Band 10 on Strip'
          },
          band18R: {
            list: false,
            type: 'number',
            order: 100,
            title: 'Relative Intensity of Band 18'
          },
          band1R: {
            list: false,
            type: 'number',
            order: 32,
            title: 'Relative Intensity of Band 1'
          },
          band20I: {
            list: false,
            type: 'number',
            order: 105,
            title: 'Intensity of Band 20 on Strip'
          },
          band17R: {
            list: false,
            type: 'number',
            order: 96,
            title: 'Relative Intensity of Band 17'
          },
          band27R: {
            list: false,
            type: 'number',
            order: 136,
            title: 'Relative Intensity of Band 27'
          },
          band16R: {
            list: false,
            type: 'number',
            order: 92,
            title: 'Relative Intensity of Band 16'
          },
          igType: {
            list: true,
            type: 'string',
            order: 6,
            title: 'Internal Ig-Type'
          },
          band26R: {
            list: false,
            type: 'number',
            order: 132,
            title: 'Relative Intensity of Band 26'
          },
          band15R: {
            list: false,
            type: 'number',
            order: 88,
            title: 'Relative Intensity of Band 15'
          },
          elisaIgG: {
            list: true,
            type: 'string',
            order: 17,
            title: 'Result Elisa IgG'
          },
          probeNumber: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Blood-Sample-ID'
          },
          band25R: {
            list: false,
            type: 'number',
            order: 128,
            title: 'Relative Intensity of Band 25'
          },
          band14R: {
            list: false,
            type: 'number',
            order: 84,
            title: 'Relative Intensity of Band 14'
          },
          band13R: {
            list: false,
            type: 'number',
            order: 80,
            title: 'Relative Intensity of Band 13'
          },
          firstName: {
            list: false,
            type: 'string',
            order: 13,
            title: 'First name of Patient'
          },
          rjoined: {
            list: false,
            type: 'string',
            order: 24,
            title: 'Result for joined Analysis'
          },
          revision: {
            list: false,
            type: 'number',
            order: 4,
            title: 'Internal revision number of setcard'
          },
          band24R: {
            list: false,
            type: 'number',
            order: 124,
            title: 'Relative Intensity of Band 24'
          },
          band23R: {
            list: false,
            type: 'number',
            order: 120,
            title: 'Relative Intensity of Band 23'
          },
          band12R: {
            list: false,
            type: 'number',
            order: 76,
            title: 'Relative Intensity of Band 12'
          },
          result: {
            list: false,
            type: 'string',
            order: 23,
            title: 'Long form of result'
          },
          band9A: {
            list: false,
            type: 'number',
            order: 63,
            title: 'Integral (Area) of Band 9 on Strip'
          },
          company: {
            list: true,
            type: 'string',
            order: 2,
            title: 'Producer of Testkit'
          },
          control: {
            list: false,
            type: 'string',
            order: 5,
            title: 'Internal name of control'
          },
          birthday: {
            list: false,
            type: 'date',
            order: 14,
            title: 'Date of Birth of Patient'
          },
          band22R: {
            list: false,
            type: 'number',
            order: 116,
            title: 'Relative Intensity of Band 22'
          },
          band11R: {
            list: false,
            type: 'number',
            order: 72,
            title: 'Relative Intensity of Band 11'
          },
          senaiteAnalysisRequest: {
            list: false,
            type: 'object',
            order: 137,
            title: 'Senaite LIMS Analysis Request',
            properties: {
              priority: {
                type: 'number',
                order: 1,
                title: 'Priority'
              },
              creatorFullName: {
                type: 'string',
                order: 6,
                title: 'Created By (Name)'
              },
              profile: {
                type: 'string',
                order: 0,
                title: 'Profile'
              },
              modificationDate: {
                type: 'time',
                order: 9,
                title: 'Modified On'
              },
              printed: {
                type: 'number',
                order: 4,
                title: 'Printed'
              },
              creator: {
                type: 'string',
                order: 5,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 8,
                title: 'Created On'
              },
              creatorEmail: {
                type: 'string',
                order: 7,
                title: 'Created By (Email)'
              },
              dateVerified: {
                type: 'time',
                order: 3,
                title: 'verified On'
              },
              doctorTitle: {
                type: 'string',
                order: 2,
                title: 'Doctor Title'
              }
            }
          },
          senaiteReferringFacility: {
            list: false,
            type: 'object',
            order: 138,
            title: 'Senaite LIMS Referring Facility',
            properties: {
              contactEmail: {
                type: 'string',
                order: 1,
                title: 'Contact Email'
              },
              contactFullName: {
                type: 'string',
                order: 0,
                title: 'Contact Name'
              }
            }
          },
          band21R: {
            list: false,
            type: 'number',
            order: 112,
            title: 'Relative Intensity of Band 21'
          },
          band10R: {
            list: false,
            type: 'number',
            order: 68,
            title: 'Relative Intensity of Band 10'
          },
          band8A: {
            list: false,
            type: 'number',
            order: 59,
            title: 'Integral (Area) of Band 8 on Strip'
          },
          senaiteSample: {
            list: false,
            type: 'object',
            order: 139,
            title: 'Senaite LIMS Sample',
            properties: {
              volume: {
                type: 'string',
                order: 3,
                title: 'Volume'
              },
              appearance: {
                type: 'string',
                order: 1,
                title: 'Appearance'
              },
              receivedBy: {
                type: 'string',
                order: 6,
                title: 'Received By'
              },
              partitionId: {
                type: 'string',
                order: 0,
                title: 'Sample Partition ID'
              },
              dateReceived: {
                type: 'time',
                order: 5,
                title: 'Date Received'
              },
              samplerEmail: {
                type: 'string',
                order: 7,
                title: 'Sampler Email'
              },
              volumeRemarks: {
                type: 'string',
                order: 4,
                title: 'Volume Remarks'
              },
              appearanceRemarks: {
                type: 'string',
                order: 2,
                title: 'Appearance Remarks'
              }
            }
          },
          elisaIgM: {
            list: true,
            type: 'string',
            order: 18,
            title: 'Result Elisa IgM'
          },
          band20Co: {
            list: false,
            type: 'number',
            order: 106,
            title: 'Relative Intensity of Band 20 compared to CutOff'
          },
          band20R: {
            list: false,
            type: 'number',
            order: 108,
            title: 'Relative Intensity of Band 20'
          },
          band7A: {
            list: false,
            type: 'number',
            order: 55,
            title: 'Integral (Area) of Band 7 on Strip'
          }
        },
        abilities: [
          {
            assayId: '13',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '13',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '13',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '13',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '13',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '13',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '13',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'GenoType MTBDRsl VER 2.0',
        resultCategory1i18nKey: null,
        deviceTypeId: '7',
        assayTypeId: '17',
        abbreviation: 'GTMTBDRslV2',
        patientDataSchema: {
          xpertMtbRifResult: {
            type: 'string',
            order: 8,
            title: 'XPERT MTB RIF Result'
          },
          gender: {
            type: 'string',
            order: 2,
            title: 'Sex'
          },
          contactDetails: {
            type: 'string',
            order: 7,
            title: 'Contact Details'
          },
          lpaFl: {
            type: 'string',
            order: 5,
            title: 'LPA FL'
          },
          dateStartedOnTreatment: {
            type: 'string',
            order: 9,
            title: 'Date Started on TX'
          },
          site: {
            type: 'string',
            order: 5,
            title: 'Site'
          },
          baselineCulture: {
            type: 'string',
            order: 10,
            title: 'Baseline Culture'
          },
          name: {
            type: 'string',
            order: 0,
            title: 'Name of patient'
          },
          mgitSire: {
            type: 'string',
            order: 12,
            title: 'MGIT SIRE'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'Province'
          },
          lpaSl: {
            type: 'string',
            order: 11,
            title: 'LPA SL'
          },
          referringFacilitySampleId: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Sample ID from Referring Facility'
          },
          dateOfBirth: {
            type: 'string',
            order: 3,
            title: 'Date of Birth'
          },
          focalPerson: {
            type: 'string',
            order: 6,
            title: 'Focal Person'
          },
          id: {
            list: true,
            type: 'string',
            order: 13,
            title: 'Patient ID'
          },
          referringFacilityPatientName: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Patient Name from Referring Facility'
          },
          age: {
            type: 'number',
            order: 1,
            title: 'Age'
          }
        },
        deviceTypeExternalId: 'HainGenoScan',
        diseaseId: '1',
        id: '13',
        deviceTypeName: 'Hain GenoScan',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'Result',
        assayTypeName: 'GenoType Test Strip'
      },
      {
        assayTypeAbbreviation: 'CV',
        i18nKey: 'assayMP96Covid19',
        externalId: 'assayMP96Covid19',
        resultDataSchema: {
          resultText: {
            type: 'string',
            title: 'COVID-19 Result'
          }
        },
        abilities: [
          {
            assayId: '31',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '31',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '31',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '31',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '31',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '31',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '31',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: true,
            canDelete: true,
            canEdit: true
          }
        ],
        resultCategory2i18nKey: null,
        name: 'MagNA Pure-96 COVID-19',
        resultCategory1i18nKey: 'resultCategoryCovid19',
        deviceTypeId: '13',
        assayTypeId: '18',
        abbreviation: 'MP96 COVID-19',
        patientDataSchema: {
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          age: {
            type: 'string',
            order: 3,
            title: 'Age'
          },
          caseId: {
            type: 'string',
            order: 2,
            title: 'Unique Case Identifier'
          },
          gender: {
            type: 'string',
            order: 4,
            title: 'Sex at birth'
          },
          testReason: {
            type: 'string',
            order: 1,
            title: 'Why tested for COVID-19'
          }
        },
        deviceTypeExternalId: 'rocheMagnaPure96',
        diseaseId: '8',
        resultCategories: [
          {
            id: '21',
            name: 'Unknown',
            i18nKey: 'resultCategoryUnknown',
            externalId: 'Unknown',
            assayId: '31',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '24',
            name: 'Negative',
            i18nKey: 'resultCategoryNegative',
            externalId: 'Negative',
            assayId: '31',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '32',
            name: 'Inconclusive',
            i18nKey: 'resultCategoryInconclusive',
            externalId: 'Inconclusive',
            assayId: '31',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '33',
            name: 'Positive',
            i18nKey: 'resultCategoryPositive',
            externalId: 'Positive',
            assayId: '31',
            emphasize: 1,
            requirestreatment: 1
          }
        ],
        id: '31',
        deviceTypeName: 'MagNA Pure-96',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'COVID-19',
        assayTypeName: 'COVID-19 Test'
      },
      {
        assayTypeAbbreviation: 'HIV',
        i18nKey: 'assayQHivVl',
        externalId: 'QHivVL',
        resultDataSchema: null,
        abilities: [
          {
            assayId: '21',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '21',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '21',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '21',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '21',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '21',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '21',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Q HIV VL',
        resultCategory1i18nKey: 'resultCategoryHivVl',
        deviceTypeId: '3',
        assayTypeId: '3',
        abbreviation: 'Q HIV VL',
        patientDataSchema: null,
        deviceTypeExternalId: 'AlereQ',
        diseaseId: '3',
        id: '21',
        deviceTypeName: 'Alere Q',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'HIV',
        assayTypeName: 'HIV VL'
      },
      {
        assayTypeAbbreviation: 'CV',
        i18nKey: 'assayQS7Covid19',
        externalId: 'assayQS7Covid19',
        resultDataSchema: {
          resultText: {
            type: 'string',
            title: 'COVID-19 Result'
          }
        },
        abilities: [
          {
            assayId: '32',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '32',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '32',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '32',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '32',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '32',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: true,
            canDelete: true,
            canEdit: true
          },
          {
            assayId: '32',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: true,
            canDelete: true,
            canEdit: true
          }
        ],
        resultCategory2i18nKey: null,
        name: 'QuantStudio7 Flex COVID-19',
        resultCategory1i18nKey: 'resultCategoryCovid19',
        deviceTypeId: '14',
        assayTypeId: '18',
        abbreviation: 'QS7 COVID-19',
        patientDataSchema: {
          id: {
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          age: {
            type: 'string',
            order: 3,
            title: 'Age'
          },
          caseId: {
            type: 'string',
            order: 2,
            title: 'Unique Case Identifier'
          },
          gender: {
            type: 'string',
            order: 4,
            title: 'Sex at birth'
          },
          testReason: {
            type: 'string',
            order: 1,
            title: 'Why tested for COVID-19'
          }
        },
        deviceTypeExternalId: 'appliedBiosystemsQuantStudio7Flex',
        diseaseId: '8',
        resultCategories: [
          {
            id: '21',
            name: 'Unknown',
            i18nKey: 'resultCategoryUnknown',
            externalId: 'Unknown',
            assayId: '32',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '24',
            name: 'Negative',
            i18nKey: 'resultCategoryNegative',
            externalId: 'Negative',
            assayId: '32',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '32',
            name: 'Inconclusive',
            i18nKey: 'resultCategoryInconclusive',
            externalId: 'Inconclusive',
            assayId: '32',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '33',
            name: 'Positive',
            i18nKey: 'resultCategoryPositive',
            externalId: 'Positive',
            assayId: '32',
            emphasize: 1,
            requirestreatment: 1
          }
        ],
        id: '32',
        deviceTypeName: 'QuantStudio7 Flex',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'COVID-19',
        assayTypeName: 'COVID-19 Test'
      },
      {
        assayTypeAbbreviation: 'EID',
        i18nKey: 'AssayReporterEid',
        externalId: 'ReporterEID',
        resultDataSchema: {
          resultText: {
            type: 'string',
            title: 'Result'
          },
          interpretation: {
            type: 'string',
            title: 'Interpretation'
          }
        },
        abilities: [
          {
            assayId: '23',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '23',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '23',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '23',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '23',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '23',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '23',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Reporter EID',
        resultCategory1i18nKey: 'resultCategoryEid',
        deviceTypeId: '9',
        assayTypeId: '7',
        abbreviation: 'Reporter EID',
        patientDataSchema: {
          gender: {
            type: 'string',
            order: 5,
            title: 'Gender'
          },
          name: {
            type: 'string',
            order: 1,
            title: 'Client Name'
          },
          phone: {
            type: 'string',
            order: 9,
            title: 'Phone #'
          },
          motherName: {
            type: 'string',
            order: 7,
            title: 'Mother Name'
          },
          hccNumber: {
            type: 'string',
            order: 6,
            title: 'HCC #'
          },
          motherSurname: {
            type: 'string',
            order: 8,
            title: 'Mother Surname'
          },
          dateOfBirth: {
            type: 'string',
            order: 4,
            title: 'Date of Birth'
          },
          surname: {
            type: 'string',
            order: 2,
            title: 'Client Surname'
          },
          age: {
            type: 'string',
            order: 3,
            title: 'Age (months)'
          }
        },
        deviceTypeExternalId: 'AspectReporter',
        diseaseId: '3',
        id: '23',
        deviceTypeName: 'Aspect Reporter',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'EID',
        assayTypeName: 'EID'
      },
      {
        assayTypeAbbreviation: 'HIV',
        i18nKey: 'AssayReporterHivVl',
        externalId: 'ReporterHivVL',
        resultDataSchema: {
          resultText: {
            type: 'string',
            title: 'Result'
          },
          interpretation: {
            type: 'string',
            title: 'Interpretation'
          }
        },
        abilities: [
          {
            assayId: '22',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '22',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '22',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '22',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '22',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '22',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '22',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Reporter HIV VL',
        resultCategory1i18nKey: 'resultCategoryHivVl',
        deviceTypeId: '9',
        assayTypeId: '3',
        abbreviation: 'Reporter HIV VL',
        patientDataSchema: {
          age: {
            type: 'string',
            order: 3,
            title: 'Age (months)'
          },
          name: {
            type: 'string',
            order: 1,
            title: 'Client Name'
          },
          phone: {
            type: 'string',
            order: 8,
            title: 'Phone #'
          },
          gender: {
            type: 'string',
            order: 5,
            title: 'Gender'
          },
          surname: {
            type: 'string',
            order: 2,
            title: 'Client Surname'
          },
          provider: {
            type: 'string',
            order: 7,
            title: 'Provider'
          },
          artNumber: {
            type: 'string',
            order: 4,
            title: 'ART #'
          },
          dateOfBirth: {
            type: 'string',
            order: 4,
            title: 'Date of Birth'
          }
        },
        deviceTypeExternalId: 'AspectReporter',
        diseaseId: '3',
        id: '22',
        deviceTypeName: 'Aspect Reporter',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'HIV',
        assayTypeName: 'HIV VL'
      },
      {
        assayTypeAbbreviation: 'TB',
        i18nKey: 'assaySenaiteLIMSSmearMicroscopy',
        externalId: 'senaiteSmearMicroscopy',
        resultDataSchema: {
          senaiteResult: {
            list: false,
            type: 'object',
            order: 3,
            title: 'Senaite LIMS Result',
            properties: {
              analyst: {
                type: 'string',
                order: 14,
                title: 'Analyst'
              },
              verificators: {
                type: 'string',
                order: 15,
                title: 'Verificators'
              },
              retested: {
                type: 'number',
                order: 1,
                title: 'Retested'
              },
              unit: {
                type: 'string',
                order: 7,
                title: 'Unit'
              },
              testReviewState: {
                type: 'string',
                order: 16,
                title: 'Test Review State'
              },
              instrument: {
                type: 'string',
                order: 10,
                title: 'Instrument'
              },
              hidden: {
                type: 'number',
                order: 12,
                title: 'Hidden'
              },
              resultText: {
                type: 'string',
                order: 3,
                title: 'Result Text'
              },
              modificationDate: {
                type: 'time',
                order: 20,
                title: 'Modified On'
              },
              creator: {
                type: 'string',
                order: 18,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 19,
                title: 'Created On'
              },
              worksheetAnalysisReviewState: {
                type: 'string',
                order: 17,
                title: 'Worksheet Analysis Review State'
              },
              value: {
                type: 'string',
                order: 4,
                title: 'Result Value'
              },
              remarks: {
                type: 'string',
                order: 6,
                title: 'Remarks'
              },
              manualEntryOfResults: {
                type: 'string',
                order: 9,
                title: 'Sample Partition ID'
              },
              instrumentEntryOfResults: {
                type: 'number',
                order: 11,
                title: 'Entered by Instrument'
              },
              resultCaptureDate: {
                type: 'time',
                order: 5,
                title: 'Capture date'
              },
              title: {
                type: 'string',
                order: 0,
                title: 'Test Type'
              },
              result: {
                type: 'string',
                order: 2,
                title: 'Selected Result'
              },
              hiddenManually: {
                type: 'number',
                order: 13,
                title: 'Hidden Manually'
              },
              pointOfCapture: {
                type: 'string',
                order: 8,
                title: 'Point of Capture'
              }
            }
          },
          senaiteSample: {
            list: false,
            type: 'object',
            order: 2,
            title: 'Senaite LIMS Sample',
            properties: {
              volume: {
                type: 'string',
                order: 3,
                title: 'Volume'
              },
              appearance: {
                type: 'string',
                order: 1,
                title: 'Appearance'
              },
              receivedBy: {
                type: 'string',
                order: 6,
                title: 'Received By'
              },
              partitionId: {
                type: 'string',
                order: 0,
                title: 'Sample Partition ID'
              },
              dateReceived: {
                type: 'time',
                order: 5,
                title: 'Date Received'
              },
              samplerEmail: {
                type: 'string',
                order: 7,
                title: 'Sampler Email'
              },
              volumeRemarks: {
                type: 'string',
                order: 4,
                title: 'Volume Remarks'
              },
              appearanceRemarks: {
                type: 'string',
                order: 2,
                title: 'Appearance Remarks'
              }
            }
          },
          senaiteAnalysisRequest: {
            list: false,
            type: 'object',
            order: 0,
            title: 'Senaite LIMS Analysis Request',
            properties: {
              priority: {
                type: 'number',
                order: 1,
                title: 'Priority'
              },
              creatorFullName: {
                type: 'string',
                order: 6,
                title: 'Created By (Name)'
              },
              profile: {
                type: 'string',
                order: 0,
                title: 'Profile'
              },
              modificationDate: {
                type: 'time',
                order: 9,
                title: 'Modified On'
              },
              printed: {
                type: 'number',
                order: 4,
                title: 'Printed'
              },
              creator: {
                type: 'string',
                order: 5,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 8,
                title: 'Created On'
              },
              creatorEmail: {
                type: 'string',
                order: 7,
                title: 'Created By (Email)'
              },
              dateVerified: {
                type: 'time',
                order: 3,
                title: 'verified On'
              },
              doctorTitle: {
                type: 'string',
                order: 2,
                title: 'Doctor Title'
              }
            }
          },
          senaiteReferringFacility: {
            list: false,
            type: 'object',
            order: 1,
            title: 'Senaite LIMS Referring Facility',
            properties: {
              contactEmail: {
                type: 'string',
                order: 1,
                title: 'Contact Email'
              },
              contactFullName: {
                type: 'string',
                order: 0,
                title: 'Contact Name'
              }
            }
          }
        },
        abilities: [
          {
            assayId: '26',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '26',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '26',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '26',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '26',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '26',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '26',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Senaite LIMS Smear Microscopy',
        resultCategory1i18nKey: null,
        deviceTypeId: '6',
        assayTypeId: '13',
        abbreviation: 'SL SM',
        patientDataSchema: {
          id: {
            list: true,
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          referringFacilitySampleId: {
            list: false,
            type: 'string',
            order: 2,
            title: 'Sample ID from Referring Facility'
          },
          referringFacilityPatientName: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Patient Name from Referring Facility'
          }
        },
        deviceTypeExternalId: 'SenaiteLims',
        diseaseId: '1',
        resultCategories: [
          {
            id: '21',
            name: 'Unknown',
            i18nKey: 'resultCategoryUnknown',
            externalId: 'Unknown',
            assayId: '26',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '24',
            name: 'Negative',
            i18nKey: 'resultCategoryNegative',
            externalId: 'Negative',
            assayId: '26',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '25',
            name: 'Positive (+)',
            i18nKey: 'resultCategoryPositive1',
            externalId: 'Positive1',
            assayId: '26',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '26',
            name: 'Positive (++)',
            i18nKey: 'resultCategoryPositive2',
            externalId: 'Positive2',
            assayId: '26',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '27',
            name: 'Positive (+++)',
            i18nKey: 'resultCategoryPositive3',
            externalId: 'Positive3',
            assayId: '26',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '28',
            name: 'Scanty (1-9/100)',
            i18nKey: 'resultCategoryScanty',
            externalId: 'Scanty',
            assayId: '26',
            emphasize: 0,
            requirestreatment: 0
          }
        ],
        id: '26',
        deviceTypeName: 'Senaite LIMS',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'Result',
        assayTypeName: 'TB G&D'
      },
      {
        assayTypeAbbreviation: 'TB',
        i18nKey: 'assaySenaiteLIMSTbCulture',
        externalId: 'senaiteTbCulture',
        resultDataSchema: {
          senaiteResult: {
            list: false,
            type: 'object',
            order: 3,
            title: 'Senaite LIMS Result',
            properties: {
              analyst: {
                type: 'string',
                order: 14,
                title: 'Analyst'
              },
              verificators: {
                type: 'string',
                order: 15,
                title: 'Verificators'
              },
              retested: {
                type: 'number',
                order: 1,
                title: 'Retested'
              },
              unit: {
                type: 'string',
                order: 7,
                title: 'Unit'
              },
              testReviewState: {
                type: 'string',
                order: 16,
                title: 'Test Review State'
              },
              instrument: {
                type: 'string',
                order: 10,
                title: 'Instrument'
              },
              hidden: {
                type: 'number',
                order: 12,
                title: 'Hidden'
              },
              resultText: {
                type: 'string',
                order: 3,
                title: 'Result Text'
              },
              modificationDate: {
                type: 'time',
                order: 20,
                title: 'Modified On'
              },
              creator: {
                type: 'string',
                order: 18,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 19,
                title: 'Created On'
              },
              worksheetAnalysisReviewState: {
                type: 'string',
                order: 17,
                title: 'Worksheet Analysis Review State'
              },
              value: {
                type: 'string',
                order: 4,
                title: 'Result Value'
              },
              remarks: {
                type: 'string',
                order: 6,
                title: 'Remarks'
              },
              manualEntryOfResults: {
                type: 'string',
                order: 9,
                title: 'Sample Partition ID'
              },
              instrumentEntryOfResults: {
                type: 'number',
                order: 11,
                title: 'Entered by Instrument'
              },
              resultCaptureDate: {
                type: 'time',
                order: 5,
                title: 'Capture date'
              },
              title: {
                type: 'string',
                order: 0,
                title: 'Test Type'
              },
              result: {
                type: 'string',
                order: 2,
                title: 'Selected Result'
              },
              hiddenManually: {
                type: 'number',
                order: 13,
                title: 'Hidden Manually'
              },
              pointOfCapture: {
                type: 'string',
                order: 8,
                title: 'Point of Capture'
              }
            }
          },
          senaiteSample: {
            list: false,
            type: 'object',
            order: 2,
            title: 'Senaite LIMS Sample',
            properties: {
              volume: {
                type: 'string',
                order: 3,
                title: 'Volume'
              },
              appearance: {
                type: 'string',
                order: 1,
                title: 'Appearance'
              },
              receivedBy: {
                type: 'string',
                order: 6,
                title: 'Received By'
              },
              partitionId: {
                type: 'string',
                order: 0,
                title: 'Sample Partition ID'
              },
              dateReceived: {
                type: 'time',
                order: 5,
                title: 'Date Received'
              },
              samplerEmail: {
                type: 'string',
                order: 7,
                title: 'Sampler Email'
              },
              volumeRemarks: {
                type: 'string',
                order: 4,
                title: 'Volume Remarks'
              },
              appearanceRemarks: {
                type: 'string',
                order: 2,
                title: 'Appearance Remarks'
              }
            }
          },
          senaiteAnalysisRequest: {
            list: false,
            type: 'object',
            order: 0,
            title: 'Senaite LIMS Analysis Request',
            properties: {
              priority: {
                type: 'number',
                order: 1,
                title: 'Priority'
              },
              creatorFullName: {
                type: 'string',
                order: 6,
                title: 'Created By (Name)'
              },
              profile: {
                type: 'string',
                order: 0,
                title: 'Profile'
              },
              modificationDate: {
                type: 'time',
                order: 9,
                title: 'Modified On'
              },
              printed: {
                type: 'number',
                order: 4,
                title: 'Printed'
              },
              creator: {
                type: 'string',
                order: 5,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 8,
                title: 'Created On'
              },
              creatorEmail: {
                type: 'string',
                order: 7,
                title: 'Created By (Email)'
              },
              dateVerified: {
                type: 'time',
                order: 3,
                title: 'verified On'
              },
              doctorTitle: {
                type: 'string',
                order: 2,
                title: 'Doctor Title'
              }
            }
          },
          senaiteReferringFacility: {
            list: false,
            type: 'object',
            order: 1,
            title: 'Senaite LIMS Referring Facility',
            properties: {
              contactEmail: {
                type: 'string',
                order: 1,
                title: 'Contact Email'
              },
              contactFullName: {
                type: 'string',
                order: 0,
                title: 'Contact Name'
              }
            }
          }
        },
        abilities: [
          {
            assayId: '27',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '27',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '27',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '27',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '27',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '27',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '27',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Senaite LIMS TB Culture',
        resultCategory1i18nKey: null,
        deviceTypeId: '6',
        assayTypeId: '13',
        abbreviation: 'SL TBC',
        patientDataSchema: {
          id: {
            list: true,
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          referringFacilitySampleId: {
            list: false,
            type: 'string',
            order: 2,
            title: 'Sample ID from Referring Facility'
          },
          referringFacilityPatientName: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Patient Name from Referring Facility'
          }
        },
        deviceTypeExternalId: 'SenaiteLims',
        diseaseId: '1',
        resultCategories: [
          {
            id: '21',
            name: 'Unknown',
            i18nKey: 'resultCategoryUnknown',
            externalId: 'Unknown',
            assayId: '27',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '24',
            name: 'Negative',
            i18nKey: 'resultCategoryNegative',
            externalId: 'Negative',
            assayId: '27',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '29',
            name: 'Contaminated',
            i18nKey: 'resultCategoryContaminated',
            externalId: 'Contaminated',
            assayId: '27',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '30',
            name: 'Positive MOTT',
            i18nKey: 'resultCategoryPositiveMOTT',
            externalId: 'PositiveMOTT',
            assayId: '27',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '31',
            name: 'Positive MTB',
            i18nKey: 'resultCategoryPositiveMTB',
            externalId: 'PositiveMTB',
            assayId: '27',
            emphasize: 0,
            requirestreatment: 0
          }
        ],
        id: '27',
        deviceTypeName: 'Senaite LIMS',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: 'Result',
        assayTypeName: 'TB G&D'
      },
      {
        assayTypeAbbreviation: 'UK',
        i18nKey: 'assaySenaiteLIMSUnknown',
        externalId: 'senaiteUnknown',
        resultDataSchema: {
          senaiteResult: {
            list: false,
            type: 'object',
            order: 3,
            title: 'Senaite LIMS Result',
            properties: {
              analyst: {
                type: 'string',
                order: 14,
                title: 'Analyst'
              },
              verificators: {
                type: 'string',
                order: 15,
                title: 'Verificators'
              },
              retested: {
                type: 'number',
                order: 1,
                title: 'Retested'
              },
              unit: {
                type: 'string',
                order: 7,
                title: 'Unit'
              },
              testReviewState: {
                type: 'string',
                order: 16,
                title: 'Test Review State'
              },
              instrument: {
                type: 'string',
                order: 10,
                title: 'Instrument'
              },
              hidden: {
                type: 'number',
                order: 12,
                title: 'Hidden'
              },
              resultText: {
                type: 'string',
                order: 3,
                title: 'Result Text'
              },
              modificationDate: {
                type: 'time',
                order: 20,
                title: 'Modified On'
              },
              creator: {
                type: 'string',
                order: 18,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 19,
                title: 'Created On'
              },
              worksheetAnalysisReviewState: {
                type: 'string',
                order: 17,
                title: 'Worksheet Analysis Review State'
              },
              value: {
                type: 'string',
                order: 4,
                title: 'Result Value'
              },
              remarks: {
                type: 'string',
                order: 6,
                title: 'Remarks'
              },
              manualEntryOfResults: {
                type: 'string',
                order: 9,
                title: 'Sample Partition ID'
              },
              instrumentEntryOfResults: {
                type: 'number',
                order: 11,
                title: 'Entered by Instrument'
              },
              resultCaptureDate: {
                type: 'time',
                order: 5,
                title: 'Capture date'
              },
              title: {
                type: 'string',
                order: 0,
                title: 'Test Type'
              },
              result: {
                type: 'string',
                order: 2,
                title: 'Selected Result'
              },
              hiddenManually: {
                type: 'number',
                order: 13,
                title: 'Hidden Manually'
              },
              pointOfCapture: {
                type: 'string',
                order: 8,
                title: 'Point of Capture'
              }
            }
          },
          senaiteSample: {
            list: false,
            type: 'object',
            order: 2,
            title: 'Senaite LIMS Sample',
            properties: {
              volume: {
                type: 'string',
                order: 3,
                title: 'Volume'
              },
              appearance: {
                type: 'string',
                order: 1,
                title: 'Appearance'
              },
              receivedBy: {
                type: 'string',
                order: 6,
                title: 'Received By'
              },
              partitionId: {
                type: 'string',
                order: 0,
                title: 'Sample Partition ID'
              },
              dateReceived: {
                type: 'time',
                order: 5,
                title: 'Date Received'
              },
              samplerEmail: {
                type: 'string',
                order: 7,
                title: 'Sampler Email'
              },
              volumeRemarks: {
                type: 'string',
                order: 4,
                title: 'Volume Remarks'
              },
              appearanceRemarks: {
                type: 'string',
                order: 2,
                title: 'Appearance Remarks'
              }
            }
          },
          senaiteAnalysisRequest: {
            list: false,
            type: 'object',
            order: 0,
            title: 'Senaite LIMS Analysis Request',
            properties: {
              priority: {
                type: 'number',
                order: 1,
                title: 'Priority'
              },
              creatorFullName: {
                type: 'string',
                order: 6,
                title: 'Created By (Name)'
              },
              profile: {
                type: 'string',
                order: 0,
                title: 'Profile'
              },
              modificationDate: {
                type: 'time',
                order: 9,
                title: 'Modified On'
              },
              printed: {
                type: 'number',
                order: 4,
                title: 'Printed'
              },
              creator: {
                type: 'string',
                order: 5,
                title: 'Created By'
              },
              creationDate: {
                type: 'time',
                order: 8,
                title: 'Created On'
              },
              creatorEmail: {
                type: 'string',
                order: 7,
                title: 'Created By (Email)'
              },
              dateVerified: {
                type: 'time',
                order: 3,
                title: 'verified On'
              },
              doctorTitle: {
                type: 'string',
                order: 2,
                title: 'Doctor Title'
              }
            }
          },
          senaiteReferringFacility: {
            list: false,
            type: 'object',
            order: 1,
            title: 'Senaite LIMS Referring Facility',
            properties: {
              contactEmail: {
                type: 'string',
                order: 1,
                title: 'Contact Email'
              },
              contactFullName: {
                type: 'string',
                order: 0,
                title: 'Contact Name'
              }
            }
          }
        },
        abilities: [
          {
            assayId: '28',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '28',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '28',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '28',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '28',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '28',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '28',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: null,
        name: 'Senaite LIMS Unknown',
        resultCategory1i18nKey: null,
        deviceTypeId: '6',
        assayTypeId: '15',
        abbreviation: 'SL UK',
        patientDataSchema: {
          id: {
            list: true,
            type: 'string',
            order: 0,
            title: 'Patient ID'
          },
          referringFacilitySampleId: {
            list: false,
            type: 'string',
            order: 2,
            title: 'Sample ID from Referring Facility'
          },
          referringFacilityPatientName: {
            list: false,
            type: 'string',
            order: 1,
            title: 'Patient Name from Referring Facility'
          }
        },
        deviceTypeExternalId: 'SenaiteLims',
        diseaseId: null,
        resultCategories: [
          {
            id: '21',
            name: 'Unknown',
            i18nKey: 'resultCategoryUnknown',
            externalId: 'Unknown',
            assayId: '28',
            emphasize: 0,
            requirestreatment: 0
          }
        ],
        id: '28',
        deviceTypeName: 'Senaite LIMS',
        hasResults: false,
        resultCategory2Label: null,
        resultCategory1Label: null,
        assayTypeName: 'Unknown'
      },
      {
        assayTypeAbbreviation: 'TB',
        i18nKey: 'assayGenericDst',
        externalId: 'assayGenericDst',
        resultDataSchema: {
          senderName: {
            list: false,
            type: 'string',
            order: 9,
            title: 'Sender Name'
          },
          versionNumber: {
            list: false,
            type: 'string',
            order: 12,
            title: 'Version Number'
          },
          instrumentType: {
            list: false,
            type: 'string',
            order: 10,
            title: 'Instrument Type'
          },
          INH: {
            list: false,
            type: 'object',
            order: 5,
            title: 'INH',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          resultTypeCode: {
            list: false,
            type: 'string',
            order: 14,
            title: 'Result Type Code'
          },
          EM: {
            list: false,
            type: 'object',
            order: 3,
            title: 'EM',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          testId: {
            list: false,
            type: 'string',
            order: 13,
            title: 'Test ID'
          },
          RIF: {
            list: false,
            type: 'object',
            order: 1,
            title: 'RIF',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          RA: {
            list: false,
            type: 'object',
            order: 4,
            title: 'RA',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          instrumentNumber: {
            list: false,
            type: 'string',
            order: 11,
            title: 'Instrument Number'
          },
          preliminaryFinalStatus: {
            list: false,
            type: 'string',
            order: 15,
            title: 'Preliminary/Final'
          },
          S: {
            list: false,
            type: 'object',
            order: 2,
            title: 'S',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          isolateNumber: {
            list: false,
            type: 'number',
            order: 8,
            title: 'Isolate Number'
          },
          EMB: {
            list: false,
            type: 'object',
            order: 0,
            title: 'EMB',
            properties: {
              sirStatus: {
                type: 'string',
                title: 'SIR Status'
              },
              growthUnits: {
                type: 'number',
                title: 'Growth Units'
              },
              antibioticConcentration: {
                type: 'number',
                title: 'Concentration'
              },
              antibioticConcentrationUnits: {
                type: 'string',
                title: 'Units'
              }
            }
          },
          instrumentLocation: {
            list: false,
            type: 'string',
            order: 7,
            title: 'Specimen Instrument Location'
          },
          protocolLength: {
            list: false,
            type: 'number',
            order: 6,
            title: 'Protocol Length'
          }
        },
        abilities: [
          {
            assayId: '8',
            partnerId: '1',
            partnerName: 'Partner One',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '8',
            partnerId: '2',
            partnerName: 'Partner Two',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '8',
            partnerId: '3',
            partnerName: 'Reporter',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '8',
            partnerId: '4',
            partnerName: 'Myanmar',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '8',
            partnerId: '5',
            partnerName: 'South Africa NHLS',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '8',
            partnerId: '6',
            partnerName: 'Cameroon',
            canCreate: false,
            canDelete: false,
            canEdit: false
          },
          {
            assayId: '8',
            partnerId: '7',
            partnerName: 'Wakanda',
            canCreate: false,
            canDelete: false,
            canEdit: false
          }
        ],
        resultCategory2i18nKey: 'resultCategoryResistance',
        name: 'TB DST',
        resultCategory1i18nKey: 'resultCategoryMTB',
        deviceTypeId: '6',
        assayTypeId: '12',
        abbreviation: 'GENERIC DST',
        patientDataSchema: {
          xpertMtbRifResult: {
            type: 'string',
            order: 8,
            title: 'XPERT MTB RIF Result'
          },
          gender: {
            type: 'string',
            order: 2,
            title: 'Sex'
          },
          contactDetails: {
            type: 'string',
            order: 7,
            title: 'Contact Details'
          },
          lpaFl: {
            type: 'string',
            order: 5,
            title: 'LPA FL'
          },
          dateStartedOnTreatment: {
            type: 'string',
            order: 9,
            title: 'Date Started on TX'
          },
          site: {
            type: 'string',
            order: 5,
            title: 'Site'
          },
          baselineCulture: {
            type: 'string',
            order: 10,
            title: 'Baseline Culture'
          },
          name: {
            type: 'string',
            order: 0,
            title: 'Name of patient'
          },
          mgitSire: {
            type: 'string',
            order: 12,
            title: 'MGIT SIRE'
          },
          state: {
            type: 'string',
            order: 4,
            title: 'Province'
          },
          lpaSl: {
            type: 'string',
            order: 11,
            title: 'LPA SL'
          },
          dateOfBirth: {
            type: 'string',
            order: 3,
            title: 'Date of Birth'
          },
          focalPerson: {
            type: 'string',
            order: 6,
            title: 'Focal Person'
          },
          age: {
            type: 'number',
            order: 1,
            title: 'Age'
          }
        },
        deviceTypeExternalId: 'SenaiteLims',
        diseaseId: '1',
        resultCategories: [
          {
            id: '1',
            name: 'Detected',
            i18nKey: 'ResultCategoryDetected',
            externalId: 'Detected',
            assayId: '8',
            emphasize: 1,
            requirestreatment: 1
          },
          {
            id: '3',
            name: 'Not Detected',
            i18nKey: 'resultCategoryNotDetected',
            externalId: 'NotDetected',
            assayId: '8',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '5',
            name: 'Invalid',
            i18nKey: 'resultCategoryInvalid',
            externalId: 'Invalid',
            assayId: '8',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '7',
            name: 'Error',
            i18nKey: 'resultCategoryError',
            externalId: 'Error',
            assayId: '8',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '8',
            name: 'Success',
            i18nKey: 'resultCategorySuccess',
            externalId: 'Success',
            assayId: '8',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '20',
            name: 'Missing',
            i18nKey: 'resultCategoryMissing',
            externalId: 'Missing',
            assayId: '8',
            emphasize: 1,
            requirestreatment: 0
          },
          {
            id: '21',
            name: 'Unknown',
            i18nKey: 'resultCategoryUnknown',
            externalId: 'Unknown',
            assayId: '8',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '22',
            name: 'Susceptible',
            i18nKey: 'resultCategorySusceptible',
            externalId: 'Susceptible',
            assayId: '8',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '23',
            name: 'Resistant',
            i18nKey: 'resultCategoryResistant',
            externalId: 'Resistant',
            assayId: '8',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '29',
            name: 'Contaminated',
            i18nKey: 'resultCategoryContaminated',
            externalId: 'Contaminated',
            assayId: '8',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '30',
            name: 'Positive MOTT',
            i18nKey: 'resultCategoryPositiveMOTT',
            externalId: 'PositiveMOTT',
            assayId: '8',
            emphasize: 0,
            requirestreatment: 0
          },
          {
            id: '31',
            name: 'Positive MTB',
            i18nKey: 'resultCategoryPositiveMTB',
            externalId: 'PositiveMTB',
            assayId: '8',
            emphasize: 0,
            requirestreatment: 0
          }
        ],
        id: '8',
        deviceTypeName: 'Senaite LIMS',
        hasResults: false,
        resultCategory2Label: 'Resistance',
        resultCategory1Label: 'MTB',
        assayTypeName: 'TB AST'
      }
    ],
    lastRefreshed: '2020-09-28T18:59:32.244Z'
  },
  assayType: {
    assayTypes: {
      loading: false,
      items: []
    }
  },
  'case': {
    items: {
      byId: {},
      currentIdList: []
    },
    table: {
      loading: false,
      sortCol: 'createdOn',
      sortDir: 'desc',
      page: 0,
      pageSize: 10,
      total: 0,
      extraColumns: [],
      groupBy: []
    },
    loading: true
  },
  consumable: {
    consumables: {
      loading: false,
      items: []
    },
    consumableReasons: {
      loading: false,
      items: []
    }
  },
  dashboard: {
    requestedAtSet: [],
    dashboardsCache: {},
    allSummaryItems: {
      byId: {},
      currentIdList: []
    },
    summary: {
      currentIdList: [],
      widgetGroups: {},
      loading: false
    },
    targetSummaryList: [],
    resultSiteList: [],
    resultSummaryList: [],
    inventoryItemSiteList: [
      {
        id: '534',
        name: 'Winston Clinic',
        stateAbbr: 'AL',
        latitude: 32.946663,
        longitude: -86.801384
      },
      {
        id: '535',
        name: 'Mobile Microbiology Lab',
        stateAbbr: 'AL',
        latitude: 32.924397,
        longitude: -86.662308
      },
      {
        id: '536',
        name: 'Selma Lab',
        stateAbbr: 'AL',
        latitude: 33.227036,
        longitude: -87.023643
      },
      {
        id: '537',
        name: 'Independence NMRL',
        stateAbbr: 'AL',
        latitude: 33.131271,
        longitude: -86.714676
      },
      {
        id: '538',
        name: 'Durham Clinic',
        stateAbbr: 'AL',
        latitude: 33.232929,
        longitude: -86.41256
      },
      {
        id: '542',
        name: 'Yuma NMRL',
        stateAbbr: 'AZ',
        latitude: 33.522408,
        longitude: -111.315041
      },
      {
        id: '543',
        name: 'Littleton Reference Lab',
        stateAbbr: 'AZ',
        latitude: 33.969009,
        longitude: -111.797668
      },
      {
        id: '544',
        name: 'Cooperstown Lab',
        stateAbbr: 'AZ',
        latitude: 33.925835,
        longitude: -111.613525
      },
      {
        id: '545',
        name: 'Marlboro NMRL',
        stateAbbr: 'AZ',
        latitude: 34.050819,
        longitude: -111.404533
      },
      {
        id: '546',
        name: 'Raleigh Hospital',
        stateAbbr: 'AZ',
        latitude: 33.796593,
        longitude: -111.161018
      },
      {
        id: '551',
        name: 'Maricopa Reference Lab',
        stateAbbr: 'AZ',
        latitude: 33.489246,
        longitude: -111.453506
      },
      {
        id: '552',
        name: 'Saunter Microbiology Lab',
        stateAbbr: 'AZ',
        latitude: 33.270126,
        longitude: -111.824547
      },
      {
        id: '553',
        name: 'Simi NMRL',
        stateAbbr: 'AZ',
        latitude: 33.996338,
        longitude: -111.73661
      },
      {
        id: '554',
        name: 'Lima Reference Lab',
        stateAbbr: 'AZ',
        latitude: 33.426174,
        longitude: -111.247574
      },
      {
        id: '549',
        name: 'Phoenix Clinic',
        stateAbbr: 'AZ',
        latitude: 34.115421,
        longitude: -111.388824
      },
      {
        id: '550',
        name: 'Palmdale Clinic',
        stateAbbr: 'AZ',
        latitude: 33.352154,
        longitude: -111.14653
      },
      {
        id: '564',
        name: 'Lawrence Reference Lab',
        stateAbbr: 'AL',
        latitude: 32.515026,
        longitude: -87.253647
      },
      {
        id: '565',
        name: 'Crenshaw NMRL',
        stateAbbr: 'AL',
        latitude: 33.242401,
        longitude: -86.753326
      },
      {
        id: '566',
        name: 'Morristown Hospital',
        stateAbbr: 'AL',
        latitude: 33.172203,
        longitude: -86.95224
      },
      {
        id: '559',
        name: 'Pike NMRL',
        stateAbbr: 'AL',
        latitude: 33.0667,
        longitude: -86.675201
      },
      {
        id: '560',
        name: 'Warren Hospital',
        stateAbbr: 'AL',
        latitude: 32.432152,
        longitude: -86.403793
      },
      {
        id: '561',
        name: 'Turner Reference Lab',
        stateAbbr: 'AL',
        latitude: 32.600712,
        longitude: -86.805191
      },
      {
        id: '562',
        name: 'Carter NMRL',
        stateAbbr: 'AL',
        latitude: 32.839874,
        longitude: -86.750977
      },
      {
        id: '563',
        name: 'Tucson Microbiology Lab',
        stateAbbr: 'AZ',
        latitude: 33.399883,
        longitude: -111.927711
      },
      {
        id: '555',
        name: 'Northampton Lab',
        stateAbbr: 'MA',
        latitude: 41.794682,
        longitude: -71.38501
      },
      {
        id: '556',
        name: 'Deerfield NMRL',
        stateAbbr: 'MA',
        latitude: 42.299774,
        longitude: -71.131874
      },
      {
        id: '557',
        name: 'Amherst Lab',
        stateAbbr: 'MA',
        latitude: 42.218273,
        longitude: -71.555061
      },
      {
        id: '558',
        name: 'Belchertown Lab',
        stateAbbr: 'MA',
        latitude: 42.125648,
        longitude: -71.094421
      },
      {
        id: '574',
        name: 'Boston Reference Lab',
        stateAbbr: 'MA',
        latitude: 42.11227,
        longitude: -71.418205
      },
      {
        id: '575',
        name: 'Peabody Microbiology Lab',
        stateAbbr: 'MA',
        latitude: 42.626949,
        longitude: -71.318573
      },
      {
        id: '576',
        name: 'Lowell Clinic',
        stateAbbr: 'MA',
        latitude: 41.750381,
        longitude: -71.153786
      },
      {
        id: '572',
        name: 'Wooster Microbiology Lab',
        stateAbbr: 'OH',
        latitude: 40.722164,
        longitude: -82.68914
      },
      {
        id: '573',
        name: 'Mansfield Clinic',
        stateAbbr: 'OH',
        latitude: 40.860477,
        longitude: -83.013702
      },
      {
        id: '577',
        name: 'Cleveland Microbiology Lab',
        stateAbbr: 'OH',
        latitude: 40.313553,
        longitude: -82.808884
      },
      {
        id: '567',
        name: 'Hall NMRL',
        stateAbbr: 'NE',
        latitude: 40.726669,
        longitude: -97.835556
      },
      {
        id: '568',
        name: 'Palmer Reference Lab',
        stateAbbr: 'NE',
        latitude: 41.514824,
        longitude: -98.355698
      },
      {
        id: '569',
        name: 'West Hall Lab',
        stateAbbr: 'NE',
        latitude: 40.853649,
        longitude: -98.133904
      },
      {
        id: '570',
        name: 'Lincoln NMRL',
        stateAbbr: 'NE',
        latitude: 40.828667,
        longitude: -97.914711
      },
      {
        id: '571',
        name: 'East Lincoln Reference Lab',
        stateAbbr: 'NE',
        latitude: 41.211559,
        longitude: -98.451248
      },
      {
        id: '581',
        name: 'Atlanta Reference Lab',
        stateAbbr: 'GA',
        latitude: 32.75428,
        longitude: -83.70285
      },
      {
        id: '578',
        name: 'Clearwater Reference Lab',
        stateAbbr: 'ID',
        latitude: 44.037827,
        longitude: -114.915718
      },
      {
        id: '579',
        name: 'Idaho Falls NMRL',
        stateAbbr: 'ID',
        latitude: 44.093597,
        longitude: -114.471397
      },
      {
        id: '580',
        name: 'Rome Microbiology Lab',
        stateAbbr: 'ID',
        latitude: 44.198902,
        longitude: -114.310661
      },
      {
        id: '586',
        name: 'Gooding Clinic',
        stateAbbr: 'ID',
        latitude: 44.659706,
        longitude: -114.757866
      },
      {
        id: '587',
        name: 'Cordon Reference Lab',
        stateAbbr: 'ID',
        latitude: 44.490128,
        longitude: -114.258896
      },
      {
        id: '588',
        name: 'Clayton Reference Lab',
        stateAbbr: 'GA',
        latitude: 33.277798,
        longitude: -83.420517
      },
      {
        id: '589',
        name: 'New Berlin Hospital',
        stateAbbr: 'GA',
        latitude: 32.835678,
        longitude: -83.81012
      },
      {
        id: '590',
        name: 'Athens Lab',
        stateAbbr: 'GA',
        latitude: 33.045292,
        longitude: -83.433372
      },
      {
        id: '591',
        name: 'Savannah Clinic',
        stateAbbr: 'GA',
        latitude: 32.807514,
        longitude: -83.342102
      },
      {
        id: '592',
        name: 'Naples Reference Lab',
        stateAbbr: 'GA',
        latitude: 33.367977,
        longitude: -83.608818
      },
      {
        id: '595',
        name: 'Lancaster Reference Lab',
        stateAbbr: 'NE',
        latitude: 40.933247,
        longitude: -98.580261
      },
      {
        id: '596',
        name: 'Hampton Microbiology Lab',
        stateAbbr: 'NE',
        latitude: 40.876999,
        longitude: -98.725433
      },
      {
        id: '597',
        name: 'Franklin Microbiology Lab',
        stateAbbr: 'NE',
        latitude: 41.074787,
        longitude: -97.826797
      },
      {
        id: '593',
        name: 'Beaverton Clinic',
        stateAbbr: 'OR',
        latitude: 44.622849,
        longitude: -122.317688
      },
      {
        id: '594',
        name: 'Portland Microbiology Lab',
        stateAbbr: 'OR',
        latitude: 44.176868,
        longitude: -121.904129
      },
      {
        id: '582',
        name: 'Gage Clinic',
        stateAbbr: 'NE',
        latitude: 41.107464,
        longitude: -98.154633
      },
      {
        id: '583',
        name: 'East Gage Microbiology Lab',
        stateAbbr: 'NE',
        latitude: 41.451633,
        longitude: -98.585007
      },
      {
        id: '584',
        name: 'Rearden Microbiology Lab',
        stateAbbr: 'NE',
        latitude: 41.325008,
        longitude: -98.008507
      },
      {
        id: '585',
        name: 'South Hampton Microbiology Lab',
        stateAbbr: 'NE',
        latitude: 40.738216,
        longitude: -98.437569
      },
      {
        id: '607',
        name: 'Sherman Clinic',
        stateAbbr: 'OR',
        latitude: 44.965977,
        longitude: -121.583817
      }
    ],
    inventoryConsumableSummaryList: [
      {
        consumableId: '5',
        consumableName: 'GeneXpert TB Cartridge',
        data: [
          {
            key: 0,
            count: 0,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'runningLowStatus'
          },
          {
            key: 1,
            count: 1,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'expiringStockStatus'
          }
        ],
        affectedSiteIds: [
          564
        ]
      },
      {
        consumableId: '6',
        consumableName: 'GeneXpert TB Ultra Cartridge',
        data: [
          {
            key: 0,
            count: 0,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'runningLowStatus'
          },
          {
            key: 1,
            count: 0,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'expiringStockStatus'
          }
        ],
        affectedSiteIds: []
      },
      {
        consumableId: '7',
        consumableName: 'GeneXpert Ebola Cartridge',
        data: [
          {
            key: 0,
            count: 0,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'runningLowStatus'
          },
          {
            key: 1,
            count: 0,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'expiringStockStatus'
          }
        ],
        affectedSiteIds: []
      },
      {
        consumableId: '8',
        consumableName: 'Xpert HIV-1 Viral Load Cartridge',
        data: [
          {
            key: 0,
            count: 1,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'runningLowStatus'
          },
          {
            key: 1,
            count: 0,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'expiringStockStatus'
          }
        ],
        affectedSiteIds: [
          543
        ]
      },
      {
        consumableId: '9',
        consumableName: 'Xpert HCV Viral Load Cartridge',
        data: [
          {
            key: 0,
            count: 0,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'runningLowStatus'
          },
          {
            key: 1,
            count: 1,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'expiringStockStatus'
          }
        ],
        affectedSiteIds: [
          550
        ]
      },
      {
        consumableId: '10',
        consumableName: 'Xpert HIV-1 Qual Cartridge',
        data: [
          {
            key: 0,
            count: 0,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'runningLowStatus'
          },
          {
            key: 1,
            count: 0,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'expiringStockStatus'
          }
        ],
        affectedSiteIds: []
      }
    ],
    deviceList: [
      {
        id: '91',
        siteId: '536',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AL',
        latitude: 33.227036,
        longitude: -87.023643
      },
      {
        id: '92',
        siteId: '534',
        fullyOperational: false,
        offline: false,
        errorRate: true,
        stateAbbr: 'AL',
        latitude: 32.946663,
        longitude: -86.801384
      },
      {
        id: '93',
        siteId: '535',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AL',
        latitude: 32.924397,
        longitude: -86.662308
      },
      {
        id: '94',
        siteId: '537',
        fullyOperational: false,
        offline: false,
        errorRate: true,
        stateAbbr: 'AL',
        latitude: 33.131271,
        longitude: -86.714676
      },
      {
        id: '95',
        siteId: '538',
        fullyOperational: false,
        offline: false,
        errorRate: true,
        stateAbbr: 'AL',
        latitude: 33.232929,
        longitude: -86.41256
      },
      {
        id: '96',
        siteId: '544',
        fullyOperational: false,
        offline: false,
        errorRate: true,
        stateAbbr: 'AZ',
        latitude: 33.925835,
        longitude: -111.613525
      },
      {
        id: '97',
        siteId: '542',
        fullyOperational: false,
        offline: false,
        errorRate: true,
        stateAbbr: 'AZ',
        latitude: 33.522408,
        longitude: -111.315041
      },
      {
        id: '98',
        siteId: '543',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AZ',
        latitude: 33.969009,
        longitude: -111.797668
      },
      {
        id: '99',
        siteId: '551',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AZ',
        latitude: 33.489246,
        longitude: -111.453506
      },
      {
        id: '100',
        siteId: '545',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AZ',
        latitude: 34.050819,
        longitude: -111.404533
      },
      {
        id: '101',
        siteId: '546',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AZ',
        latitude: 33.796593,
        longitude: -111.161018
      },
      {
        id: '102',
        siteId: '549',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AZ',
        latitude: 34.115421,
        longitude: -111.388824
      },
      {
        id: '103',
        siteId: '555',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'MA',
        latitude: 41.794682,
        longitude: -71.38501
      },
      {
        id: '104',
        siteId: '550',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AZ',
        latitude: 33.352154,
        longitude: -111.14653
      },
      {
        id: '105',
        siteId: '552',
        fullyOperational: false,
        offline: false,
        errorRate: true,
        stateAbbr: 'AZ',
        latitude: 33.270126,
        longitude: -111.824547
      },
      {
        id: '106',
        siteId: '553',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AZ',
        latitude: 33.996338,
        longitude: -111.73661
      },
      {
        id: '107',
        siteId: '554',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AZ',
        latitude: 33.426174,
        longitude: -111.247574
      },
      {
        id: '108',
        siteId: '557',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'MA',
        latitude: 42.218273,
        longitude: -71.555061
      },
      {
        id: '109',
        siteId: '558',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'MA',
        latitude: 42.125648,
        longitude: -71.094421
      },
      {
        id: '110',
        siteId: '556',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'MA',
        latitude: 42.299774,
        longitude: -71.131874
      },
      {
        id: '111',
        siteId: '564',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AL',
        latitude: 32.515026,
        longitude: -87.253647
      },
      {
        id: '112',
        siteId: '560',
        fullyOperational: false,
        offline: false,
        errorRate: true,
        stateAbbr: 'AL',
        latitude: 32.432152,
        longitude: -86.403793
      },
      {
        id: '113',
        siteId: '563',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AZ',
        latitude: 33.399883,
        longitude: -111.927711
      },
      {
        id: '114',
        siteId: '559',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AL',
        latitude: 33.0667,
        longitude: -86.675201
      },
      {
        id: '115',
        siteId: '562',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AL',
        latitude: 32.839874,
        longitude: -86.750977
      },
      {
        id: '116',
        siteId: '561',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AL',
        latitude: 32.600712,
        longitude: -86.805191
      },
      {
        id: '117',
        siteId: '569',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'NE',
        latitude: 40.853649,
        longitude: -98.133904
      },
      {
        id: '118',
        siteId: '565',
        fullyOperational: false,
        offline: false,
        errorRate: true,
        stateAbbr: 'AL',
        latitude: 33.242401,
        longitude: -86.753326
      },
      {
        id: '119',
        siteId: '567',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'NE',
        latitude: 40.726669,
        longitude: -97.835556
      },
      {
        id: '120',
        siteId: '566',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AL',
        latitude: 33.172203,
        longitude: -86.95224
      },
      {
        id: '121',
        siteId: '568',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'NE',
        latitude: 41.514824,
        longitude: -98.355698
      },
      {
        id: '122',
        siteId: '571',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'NE',
        latitude: 41.211559,
        longitude: -98.451248
      },
      {
        id: '123',
        siteId: '570',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'NE',
        latitude: 40.828667,
        longitude: -97.914711
      },
      {
        id: '124',
        siteId: '573',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'OH',
        latitude: 40.860477,
        longitude: -83.013702
      },
      {
        id: '125',
        siteId: '574',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'MA',
        latitude: 42.11227,
        longitude: -71.418205
      },
      {
        id: '126',
        siteId: '572',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'OH',
        latitude: 40.722164,
        longitude: -82.68914
      },
      {
        id: '127',
        siteId: '580',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'ID',
        latitude: 44.198902,
        longitude: -114.310661
      },
      {
        id: '128',
        siteId: '576',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'MA',
        latitude: 41.750381,
        longitude: -71.153786
      },
      {
        id: '129',
        siteId: '579',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'ID',
        latitude: 44.093597,
        longitude: -114.471397
      },
      {
        id: '130',
        siteId: '575',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'MA',
        latitude: 42.626949,
        longitude: -71.318573
      },
      {
        id: '131',
        siteId: '578',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'ID',
        latitude: 44.037827,
        longitude: -114.915718
      },
      {
        id: '132',
        siteId: '577',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'OH',
        latitude: 40.313553,
        longitude: -82.808884
      },
      {
        id: '133',
        siteId: '581',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'GA',
        latitude: 32.75428,
        longitude: -83.70285
      },
      {
        id: '134',
        siteId: '583',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'NE',
        latitude: 41.451633,
        longitude: -98.585007
      },
      {
        id: '135',
        siteId: '582',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'NE',
        latitude: 41.107464,
        longitude: -98.154633
      },
      {
        id: '136',
        siteId: '587',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'ID',
        latitude: 44.490128,
        longitude: -114.258896
      },
      {
        id: '137',
        siteId: '586',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'ID',
        latitude: 44.659706,
        longitude: -114.757866
      },
      {
        id: '138',
        siteId: '589',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'GA',
        latitude: 32.835678,
        longitude: -83.81012
      },
      {
        id: '139',
        siteId: '585',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'NE',
        latitude: 40.738216,
        longitude: -98.437569
      },
      {
        id: '140',
        siteId: '588',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'GA',
        latitude: 33.277798,
        longitude: -83.420517
      },
      {
        id: '468',
        siteId: '587',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'ID',
        latitude: 44.490128,
        longitude: -114.258896
      },
      {
        id: '469',
        siteId: '555',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'MA',
        latitude: 41.794682,
        longitude: -71.38501
      },
      {
        id: '470',
        siteId: '573',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'OH',
        latitude: 40.860477,
        longitude: -83.013702
      },
      {
        id: '471',
        siteId: '584',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'NE',
        latitude: 41.325008,
        longitude: -98.008507
      },
      {
        id: '475',
        siteId: '546',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'AZ',
        latitude: 33.796593,
        longitude: -111.161018
      },
      {
        id: '477',
        siteId: '597',
        fullyOperational: true,
        offline: false,
        errorRate: false,
        stateAbbr: 'NE',
        latitude: 41.074787,
        longitude: -97.826797
      }
    ],
    deviceSummaryMap: {
      operational: {
        deviceIds: [
          91,
          93,
          98,
          99,
          100,
          101,
          102,
          103,
          104,
          106,
          107,
          108,
          109,
          110,
          111,
          113,
          114,
          115,
          116,
          117,
          119,
          120,
          121,
          122,
          123,
          124,
          125,
          126,
          127,
          128,
          129,
          130,
          131,
          132,
          133,
          134,
          135,
          136,
          137,
          138,
          139,
          140,
          468,
          469,
          470,
          471,
          475,
          477
        ],
        siteIds: [
          536,
          535,
          543,
          551,
          545,
          546,
          549,
          555,
          550,
          553,
          554,
          557,
          558,
          556,
          564,
          563,
          559,
          562,
          561,
          569,
          567,
          566,
          568,
          571,
          570,
          573,
          574,
          572,
          580,
          576,
          579,
          575,
          578,
          577,
          581,
          583,
          582,
          587,
          586,
          589,
          585,
          588,
          584,
          597
        ],
        items: [
          {
            key: 0,
            count: 48,
            total: 56,
            titleI18nKey: 'ofTotalDevicesTitle',
            subI18nKey: 'fullyOperationalStatus'
          }
        ]
      },
      uploadingData: {
        deviceIds: [],
        siteIds: [],
        items: [
          {
            key: 0,
            count: 0,
            titleI18nKey: 'devicesTitle',
            subI18nKey: 'notReportingStatus'
          }
        ]
      },
      testFailures: {
        deviceIds: [
          92,
          94,
          95,
          96,
          97,
          105,
          112,
          118
        ],
        siteIds: [
          534,
          537,
          538,
          544,
          542,
          552,
          560,
          565
        ],
        items: [
          {
            key: 0,
            count: 8,
            titleI18nKey: 'devicesTitle',
            subI18nKey: 'highFailuresRatesStatus'
          }
        ]
      }
    },
    siteList: [
      {
        id: '534',
        name: 'Winston Clinic',
        stateAbbr: 'AL',
        latitude: 32.946663,
        longitude: -86.801384
      },
      {
        id: '535',
        name: 'Mobile Microbiology Lab',
        stateAbbr: 'AL',
        latitude: 32.924397,
        longitude: -86.662308
      },
      {
        id: '536',
        name: 'Selma Lab',
        stateAbbr: 'AL',
        latitude: 33.227036,
        longitude: -87.023643
      },
      {
        id: '537',
        name: 'Independence NMRL',
        stateAbbr: 'AL',
        latitude: 33.131271,
        longitude: -86.714676
      },
      {
        id: '538',
        name: 'Durham Clinic',
        stateAbbr: 'AL',
        latitude: 33.232929,
        longitude: -86.41256
      },
      {
        id: '542',
        name: 'Yuma NMRL',
        stateAbbr: 'AZ',
        latitude: 33.522408,
        longitude: -111.315041
      },
      {
        id: '543',
        name: 'Littleton Reference Lab',
        stateAbbr: 'AZ',
        latitude: 33.969009,
        longitude: -111.797668
      },
      {
        id: '544',
        name: 'Cooperstown Lab',
        stateAbbr: 'AZ',
        latitude: 33.925835,
        longitude: -111.613525
      },
      {
        id: '545',
        name: 'Marlboro NMRL',
        stateAbbr: 'AZ',
        latitude: 34.050819,
        longitude: -111.404533
      },
      {
        id: '546',
        name: 'Raleigh Hospital',
        stateAbbr: 'AZ',
        latitude: 33.796593,
        longitude: -111.161018
      },
      {
        id: '551',
        name: 'Maricopa Reference Lab',
        stateAbbr: 'AZ',
        latitude: 33.489246,
        longitude: -111.453506
      },
      {
        id: '552',
        name: 'Saunter Microbiology Lab',
        stateAbbr: 'AZ',
        latitude: 33.270126,
        longitude: -111.824547
      },
      {
        id: '553',
        name: 'Simi NMRL',
        stateAbbr: 'AZ',
        latitude: 33.996338,
        longitude: -111.73661
      },
      {
        id: '554',
        name: 'Lima Reference Lab',
        stateAbbr: 'AZ',
        latitude: 33.426174,
        longitude: -111.247574
      },
      {
        id: '549',
        name: 'Phoenix Clinic',
        stateAbbr: 'AZ',
        latitude: 34.115421,
        longitude: -111.388824
      },
      {
        id: '550',
        name: 'Palmdale Clinic',
        stateAbbr: 'AZ',
        latitude: 33.352154,
        longitude: -111.14653
      },
      {
        id: '564',
        name: 'Lawrence Reference Lab',
        stateAbbr: 'AL',
        latitude: 32.515026,
        longitude: -87.253647
      },
      {
        id: '565',
        name: 'Crenshaw NMRL',
        stateAbbr: 'AL',
        latitude: 33.242401,
        longitude: -86.753326
      },
      {
        id: '566',
        name: 'Morristown Hospital',
        stateAbbr: 'AL',
        latitude: 33.172203,
        longitude: -86.95224
      },
      {
        id: '559',
        name: 'Pike NMRL',
        stateAbbr: 'AL',
        latitude: 33.0667,
        longitude: -86.675201
      },
      {
        id: '560',
        name: 'Warren Hospital',
        stateAbbr: 'AL',
        latitude: 32.432152,
        longitude: -86.403793
      },
      {
        id: '561',
        name: 'Turner Reference Lab',
        stateAbbr: 'AL',
        latitude: 32.600712,
        longitude: -86.805191
      },
      {
        id: '562',
        name: 'Carter NMRL',
        stateAbbr: 'AL',
        latitude: 32.839874,
        longitude: -86.750977
      },
      {
        id: '563',
        name: 'Tucson Microbiology Lab',
        stateAbbr: 'AZ',
        latitude: 33.399883,
        longitude: -111.927711
      },
      {
        id: '555',
        name: 'Northampton Lab',
        stateAbbr: 'MA',
        latitude: 41.794682,
        longitude: -71.38501
      },
      {
        id: '556',
        name: 'Deerfield NMRL',
        stateAbbr: 'MA',
        latitude: 42.299774,
        longitude: -71.131874
      },
      {
        id: '557',
        name: 'Amherst Lab',
        stateAbbr: 'MA',
        latitude: 42.218273,
        longitude: -71.555061
      },
      {
        id: '558',
        name: 'Belchertown Lab',
        stateAbbr: 'MA',
        latitude: 42.125648,
        longitude: -71.094421
      },
      {
        id: '574',
        name: 'Boston Reference Lab',
        stateAbbr: 'MA',
        latitude: 42.11227,
        longitude: -71.418205
      },
      {
        id: '575',
        name: 'Peabody Microbiology Lab',
        stateAbbr: 'MA',
        latitude: 42.626949,
        longitude: -71.318573
      },
      {
        id: '576',
        name: 'Lowell Clinic',
        stateAbbr: 'MA',
        latitude: 41.750381,
        longitude: -71.153786
      },
      {
        id: '572',
        name: 'Wooster Microbiology Lab',
        stateAbbr: 'OH',
        latitude: 40.722164,
        longitude: -82.68914
      },
      {
        id: '573',
        name: 'Mansfield Clinic',
        stateAbbr: 'OH',
        latitude: 40.860477,
        longitude: -83.013702
      },
      {
        id: '577',
        name: 'Cleveland Microbiology Lab',
        stateAbbr: 'OH',
        latitude: 40.313553,
        longitude: -82.808884
      },
      {
        id: '567',
        name: 'Hall NMRL',
        stateAbbr: 'NE',
        latitude: 40.726669,
        longitude: -97.835556
      },
      {
        id: '568',
        name: 'Palmer Reference Lab',
        stateAbbr: 'NE',
        latitude: 41.514824,
        longitude: -98.355698
      },
      {
        id: '569',
        name: 'West Hall Lab',
        stateAbbr: 'NE',
        latitude: 40.853649,
        longitude: -98.133904
      },
      {
        id: '570',
        name: 'Lincoln NMRL',
        stateAbbr: 'NE',
        latitude: 40.828667,
        longitude: -97.914711
      },
      {
        id: '571',
        name: 'East Lincoln Reference Lab',
        stateAbbr: 'NE',
        latitude: 41.211559,
        longitude: -98.451248
      },
      {
        id: '581',
        name: 'Atlanta Reference Lab',
        stateAbbr: 'GA',
        latitude: 32.75428,
        longitude: -83.70285
      },
      {
        id: '578',
        name: 'Clearwater Reference Lab',
        stateAbbr: 'ID',
        latitude: 44.037827,
        longitude: -114.915718
      },
      {
        id: '579',
        name: 'Idaho Falls NMRL',
        stateAbbr: 'ID',
        latitude: 44.093597,
        longitude: -114.471397
      },
      {
        id: '580',
        name: 'Rome Microbiology Lab',
        stateAbbr: 'ID',
        latitude: 44.198902,
        longitude: -114.310661
      },
      {
        id: '586',
        name: 'Gooding Clinic',
        stateAbbr: 'ID',
        latitude: 44.659706,
        longitude: -114.757866
      },
      {
        id: '587',
        name: 'Cordon Reference Lab',
        stateAbbr: 'ID',
        latitude: 44.490128,
        longitude: -114.258896
      },
      {
        id: '588',
        name: 'Clayton Reference Lab',
        stateAbbr: 'GA',
        latitude: 33.277798,
        longitude: -83.420517
      },
      {
        id: '589',
        name: 'New Berlin Hospital',
        stateAbbr: 'GA',
        latitude: 32.835678,
        longitude: -83.81012
      },
      {
        id: '590',
        name: 'Athens Lab',
        stateAbbr: 'GA',
        latitude: 33.045292,
        longitude: -83.433372
      },
      {
        id: '591',
        name: 'Savannah Clinic',
        stateAbbr: 'GA',
        latitude: 32.807514,
        longitude: -83.342102
      },
      {
        id: '592',
        name: 'Naples Reference Lab',
        stateAbbr: 'GA',
        latitude: 33.367977,
        longitude: -83.608818
      },
      {
        id: '595',
        name: 'Lancaster Reference Lab',
        stateAbbr: 'NE',
        latitude: 40.933247,
        longitude: -98.580261
      },
      {
        id: '596',
        name: 'Hampton Microbiology Lab',
        stateAbbr: 'NE',
        latitude: 40.876999,
        longitude: -98.725433
      },
      {
        id: '597',
        name: 'Franklin Microbiology Lab',
        stateAbbr: 'NE',
        latitude: 41.074787,
        longitude: -97.826797
      },
      {
        id: '593',
        name: 'Beaverton Clinic',
        stateAbbr: 'OR',
        latitude: 44.622849,
        longitude: -122.317688
      },
      {
        id: '594',
        name: 'Portland Microbiology Lab',
        stateAbbr: 'OR',
        latitude: 44.176868,
        longitude: -121.904129
      },
      {
        id: '582',
        name: 'Gage Clinic',
        stateAbbr: 'NE',
        latitude: 41.107464,
        longitude: -98.154633
      },
      {
        id: '583',
        name: 'East Gage Microbiology Lab',
        stateAbbr: 'NE',
        latitude: 41.451633,
        longitude: -98.585007
      },
      {
        id: '584',
        name: 'Rearden Microbiology Lab',
        stateAbbr: 'NE',
        latitude: 41.325008,
        longitude: -98.008507
      },
      {
        id: '585',
        name: 'South Hampton Microbiology Lab',
        stateAbbr: 'NE',
        latitude: 40.738216,
        longitude: -98.437569
      },
      {
        id: '607',
        name: 'Sherman Clinic',
        stateAbbr: 'OR',
        latitude: 44.965977,
        longitude: -121.583817
      }
    ],
    assayResultCategoryList: [
      {
        id: '18-1',
        name: 'COVID-19 Test: Detected'
      },
      {
        id: '18-33',
        name: 'COVID-19 Test: Positive'
      },
      {
        id: '2-1',
        name: 'Ebola: Detected'
      },
      {
        id: '4-12',
        name: 'HBV VL: >= 40'
      },
      {
        id: '4-1',
        name: 'HBV VL: Detected'
      },
      {
        id: '8-1',
        name: 'HCV: Detected'
      },
      {
        id: '5-1',
        name: 'HIV Qual: Detected'
      },
      {
        id: '3-12',
        name: 'HIV VL: >= 40'
      },
      {
        id: '3-18',
        name: 'HIV VL: >= 1000'
      },
      {
        id: '3-1',
        name: 'HIV VL: Detected'
      },
      {
        id: '3-14',
        name: 'HIV VL: >= 150'
      },
      {
        id: '3-16',
        name: 'HIV VL: >= 550'
      },
      {
        id: '1-2',
        name: 'MTB/Rif: Trace Detected'
      },
      {
        id: '1-1',
        name: 'MTB/Rif: Detected'
      },
      {
        id: '12-1',
        name: 'TB AST: Detected'
      },
      {
        id: '13-33',
        name: 'TB G&D: Positive'
      },
      {
        id: '13-1',
        name: 'TB G&D: Detected'
      }
    ],
    siteSummaryMap: {
      onlineNow: {
        siteIds: [
          '534',
          '535',
          '536',
          '537',
          '538',
          '542',
          '543',
          '544',
          '545',
          '546',
          '549',
          '550',
          '551',
          '552',
          '553',
          '554',
          '555',
          '556',
          '557',
          '558',
          '559',
          '560',
          '561',
          '562',
          '563',
          '564',
          '565',
          '566',
          '567',
          '568',
          '569',
          '570',
          '571',
          '572',
          '573',
          '574',
          '575',
          '576',
          '577',
          '578',
          '579',
          '580',
          '581',
          '582',
          '583',
          '584',
          '585',
          '586',
          '587',
          '588',
          '589',
          '597'
        ],
        items: [
          {
            key: 0,
            count: 52,
            total: 60,
            titleI18nKey: 'ofTotalSitesTitle',
            subI18nKey: 'reportingStatus'
          }
        ]
      },
      stockManagement: {
        siteIds: [
          '535',
          '542',
          '543',
          '546',
          '554',
          '557',
          '560',
          '564',
          '567',
          '569',
          '572',
          '573',
          '575',
          '576',
          '577',
          '578',
          '579',
          '580',
          '581',
          '584',
          '586',
          '588',
          '589',
          '592',
          '594',
          '597'
        ],
        items: [
          {
            key: 0,
            count: 26,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'withStockIssues'
          }
        ]
      },
      deviceManagement: {
        siteIds: [
          '534',
          '537',
          '538',
          '542',
          '544',
          '552',
          '560',
          '565'
        ],
        items: [
          {
            key: 0,
            count: 8,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'withDeviceIssues'
          }
        ]
      },
      uploadingData: {
        siteIds: [],
        items: [
          {
            key: 0,
            count: 0,
            titleI18nKey: 'sitesTitle',
            subI18nKey: 'notReportingStatus'
          }
        ]
      }
    },
    operational: {},
    actionSummaryMap: {},
    treatmentStatus: {},
    clinicalIndicators: {},
    inventoryItems: [
      {
        notRecorded: 0,
        upTo90: 5,
        consumableName: 'GeneXpert TB Cartridge',
        outOfStock: 27,
        moreThan180: 12,
        upTo180: 5,
        upTo30: 1,
        upTo14: 1,
        noConsumption: 0,
        consumableId: '5'
      },
      {
        notRecorded: 51,
        upTo90: 0,
        consumableName: 'GeneXpert TB Ultra Cartridge',
        outOfStock: 0,
        moreThan180: 0,
        upTo180: 0,
        upTo30: 0,
        upTo14: 0,
        noConsumption: 0,
        consumableId: '6'
      },
      {
        notRecorded: 40,
        upTo90: 0,
        consumableName: 'GeneXpert Ebola Cartridge',
        outOfStock: 9,
        moreThan180: 1,
        upTo180: 0,
        upTo30: 0,
        upTo14: 1,
        noConsumption: 0,
        consumableId: '7'
      },
      {
        notRecorded: 43,
        upTo90: 1,
        consumableName: 'Xpert HIV-1 Viral Load Cartridge',
        outOfStock: 4,
        moreThan180: 2,
        upTo180: 1,
        upTo30: 0,
        upTo14: 0,
        noConsumption: 0,
        consumableId: '8'
      },
      {
        notRecorded: 51,
        upTo90: 0,
        consumableName: 'Xpert HCV Viral Load Cartridge',
        outOfStock: 0,
        moreThan180: 0,
        upTo180: 0,
        upTo30: 0,
        upTo14: 0,
        noConsumption: 0,
        consumableId: '9'
      },
      {
        notRecorded: 51,
        upTo90: 0,
        consumableName: 'Xpert HIV-1 Qual Cartridge',
        outOfStock: 0,
        moreThan180: 0,
        upTo180: 0,
        upTo30: 0,
        upTo14: 0,
        noConsumption: 0,
        consumableId: '10'
      }
    ]
  },
  demo: {
    deviceItems: {
      byId: {},
      currentIdList: []
    }
  },
  device: {
    items: {
      byId: {
        '96': {
          approval: 'Approved',
          maintenanceStatus: 'inactiveUnknown',
          deliveredLastMonth: 0,
          lastPingOn: '2020-09-24T13:44:39.000Z',
          shortName: 'GeneXpert #5',
          createdOn: '2020-06-06T15:24:39.000Z',
          error: {
            count: 0,
            total: 0,
            rate: 0
          },
          maintenanceStatusManuallySet: 1,
          maintenanceStatusActive: 0,
          name: 'Cooperstown Lab GeneXpert',
          maintenanceStatusName: 'Unknown',
          resultCountThisMonth: 0,
          state: 'Arizona',
          hasConnectivity: 0,
          lastSeen: '2020-09-24T13:44:39.000Z',
          siteName: 'Cooperstown Lab',
          issueCategories: [
            {
              key: 'issueCategoryDeviceHealth'
            }
          ],
          resultCountLastMonth: 0,
          type: 'GeneXpert',
          id: '96',
          availability: {
            count: 30,
            total: 30,
            rate: 1
          },
          maintenanceStatusI18nKey: 'inactiveUnknown',
          hasResults: 1,
          category: 'Lab',
          deliveredThisMonth: 0
        },
        '108': {
          approval: 'Approved',
          maintenanceStatus: 'inactiveUnknown',
          deliveredLastMonth: 0,
          lastPingOn: '2020-09-24T09:44:39.000Z',
          shortName: 'GeneXpert #17',
          createdOn: '2020-09-18T15:24:39.000Z',
          error: {
            count: 0,
            total: 0,
            rate: 0
          },
          maintenanceStatusManuallySet: 1,
          maintenanceStatusActive: 0,
          name: 'Amherst Lab GeneXpert',
          maintenanceStatusName: 'Unknown',
          resultCountThisMonth: 0,
          state: 'Massachusetts',
          hasConnectivity: 0,
          lastSeen: '2020-09-24T09:44:39.000Z',
          siteName: 'Amherst Lab',
          issueCategories: [],
          resultCountLastMonth: 0,
          type: 'GeneXpert',
          id: '108',
          availability: {
            count: 30,
            total: 30,
            rate: 1
          },
          maintenanceStatusI18nKey: 'inactiveUnknown',
          hasResults: 1,
          category: 'Lab',
          deliveredThisMonth: 0
        },
        '109': {
          approval: 'Approved',
          maintenanceStatus: 'inactiveNoResultsReported',
          deliveredLastMonth: 0,
          lastPingOn: '2020-09-24T09:24:39.000Z',
          shortName: 'GeneXpert #18',
          createdOn: '2020-06-25T15:24:39.000Z',
          error: {
            count: 0,
            total: 0,
            rate: 0
          },
          maintenanceStatusManuallySet: 0,
          maintenanceStatusActive: 0,
          name: 'Belchertown Lab GeneXpert',
          maintenanceStatusName: 'No Results Reported',
          resultCountThisMonth: 0,
          state: 'Massachusetts',
          hasConnectivity: 0,
          lastSeen: '2020-09-24T09:24:39.000Z',
          siteName: 'Belchertown Lab',
          issueCategories: [],
          resultCountLastMonth: 0,
          type: 'GeneXpert',
          id: '109',
          availability: {
            count: 27,
            total: 30,
            rate: 0.9
          },
          maintenanceStatusI18nKey: 'inactiveNoResultsReported',
          hasResults: 1,
          category: 'Lab',
          deliveredThisMonth: 0
        },
        '115': {
          approval: 'Approved',
          maintenanceStatus: 'inactiveNoResultsReported',
          deliveredLastMonth: 0,
          lastPingOn: '2020-09-24T07:24:39.000Z',
          shortName: 'GeneXpert #24',
          createdOn: '2020-08-20T15:24:39.000Z',
          error: {
            count: 0,
            total: 0,
            rate: 0
          },
          maintenanceStatusManuallySet: 0,
          maintenanceStatusActive: 0,
          name: 'Carter NMRL GeneXpert',
          maintenanceStatusName: 'No Results Reported',
          resultCountThisMonth: 0,
          state: 'Alabama',
          hasConnectivity: 0,
          lastSeen: '2020-09-24T07:24:39.000Z',
          siteName: 'Carter NMRL',
          issueCategories: [],
          resultCountLastMonth: 0,
          type: 'GeneXpert',
          id: '115',
          availability: {
            count: 25,
            total: 30,
            rate: 0.8333333333333334
          },
          maintenanceStatusI18nKey: 'inactiveNoResultsReported',
          hasResults: 1,
          category: 'Lab',
          deliveredThisMonth: 0
        },
        '125': {
          approval: 'Approved',
          maintenanceStatus: 'inactiveNoResultsReported',
          deliveredLastMonth: 0,
          lastPingOn: '2020-09-24T04:04:39.000Z',
          shortName: 'GeneXpert #34',
          createdOn: '2020-08-30T15:24:39.000Z',
          error: {
            count: 0,
            total: 0,
            rate: 0
          },
          maintenanceStatusManuallySet: 0,
          maintenanceStatusActive: 0,
          name: 'Boston Reference Lab GeneXpert',
          maintenanceStatusName: 'No Results Reported',
          resultCountThisMonth: 0,
          state: 'Massachusetts',
          hasConnectivity: 0,
          lastSeen: '2020-09-24T04:04:39.000Z',
          siteName: 'Boston Reference Lab',
          issueCategories: [],
          resultCountLastMonth: 0,
          type: 'GeneXpert',
          id: '125',
          availability: {
            count: 27,
            total: 30,
            rate: 0.9
          },
          maintenanceStatusI18nKey: 'inactiveNoResultsReported',
          hasResults: 1,
          category: 'Lab',
          deliveredThisMonth: 0
        },
        '131': {
          approval: 'Approved',
          maintenanceStatus: 'inactiveNoResultsReported',
          deliveredLastMonth: 0,
          lastPingOn: '2020-09-24T02:04:39.000Z',
          shortName: 'GeneXpert #40',
          createdOn: '2020-08-23T15:24:39.000Z',
          error: {
            count: 0,
            total: 0,
            rate: 0
          },
          maintenanceStatusManuallySet: 0,
          maintenanceStatusActive: 0,
          name: 'Clearwater Reference Lab GeneXpert',
          maintenanceStatusName: 'No Results Reported',
          resultCountThisMonth: 0,
          state: 'Idaho',
          hasConnectivity: 0,
          lastSeen: '2020-09-24T02:04:39.000Z',
          siteName: 'Clearwater Reference Lab',
          issueCategories: [],
          resultCountLastMonth: 0,
          type: 'GeneXpert',
          id: '131',
          availability: {
            count: 27,
            total: 30,
            rate: 0.9
          },
          maintenanceStatusI18nKey: 'inactiveNoResultsReported',
          hasResults: 1,
          category: 'Lab',
          deliveredThisMonth: 0
        },
        '132': {
          approval: 'Approved',
          maintenanceStatus: 'inactiveNoResultsReported',
          deliveredLastMonth: 0,
          lastPingOn: '2020-09-24T01:44:39.000Z',
          shortName: 'GeneXpert #41',
          createdOn: '2020-06-04T15:24:39.000Z',
          error: {
            count: 0,
            total: 0,
            rate: 0
          },
          maintenanceStatusManuallySet: 0,
          maintenanceStatusActive: 0,
          name: 'Cleveland Microbiology Lab GeneXpert',
          maintenanceStatusName: 'No Results Reported',
          resultCountThisMonth: 0,
          state: 'Ohio',
          hasConnectivity: 0,
          lastSeen: '2020-09-24T01:44:39.000Z',
          siteName: 'Cleveland Microbiology Lab',
          issueCategories: [],
          resultCountLastMonth: 0,
          type: 'GeneXpert',
          id: '132',
          availability: {
            count: 25,
            total: 30,
            rate: 0.8333333333333334
          },
          maintenanceStatusI18nKey: 'inactiveNoResultsReported',
          hasResults: 1,
          category: 'Lab',
          deliveredThisMonth: 0
        },
        '133': {
          approval: 'Approved',
          maintenanceStatus: 'inactiveNoResultsReported',
          deliveredLastMonth: 0,
          lastPingOn: '2020-09-24T01:24:39.000Z',
          shortName: 'GeneXpert #42',
          createdOn: '2020-07-28T15:24:39.000Z',
          error: {
            count: 0,
            total: 0,
            rate: 0
          },
          maintenanceStatusManuallySet: 0,
          maintenanceStatusActive: 0,
          name: 'Atlanta Reference Lab GeneXpert',
          maintenanceStatusName: 'No Results Reported',
          resultCountThisMonth: 0,
          state: 'Georgia',
          hasConnectivity: 0,
          lastSeen: '2020-09-24T01:24:39.000Z',
          siteName: 'Atlanta Reference Lab',
          issueCategories: [],
          resultCountLastMonth: 0,
          type: 'GeneXpert',
          id: '133',
          availability: {
            count: 30,
            total: 30,
            rate: 1
          },
          maintenanceStatusI18nKey: 'inactiveNoResultsReported',
          hasResults: 1,
          category: 'Lab',
          deliveredThisMonth: 0
        },
        '140': {
          approval: 'Approved',
          maintenanceStatus: 'inactiveNoResultsReported',
          deliveredLastMonth: 0,
          lastPingOn: '2020-09-23T23:04:39.000Z',
          shortName: 'GeneXpert #49',
          createdOn: '2020-07-11T15:24:39.000Z',
          error: {
            count: 0,
            total: 0,
            rate: 0
          },
          maintenanceStatusManuallySet: 0,
          maintenanceStatusActive: 0,
          name: 'Clayton Reference Lab GeneXpert',
          maintenanceStatusName: 'No Results Reported',
          resultCountThisMonth: 0,
          state: 'Georgia',
          hasConnectivity: 0,
          lastSeen: '2020-09-23T23:04:39.000Z',
          siteName: 'Clayton Reference Lab',
          issueCategories: [],
          resultCountLastMonth: 0,
          type: 'GeneXpert',
          id: '140',
          availability: {
            count: 30,
            total: 30,
            rate: 1
          },
          maintenanceStatusI18nKey: 'inactiveNoResultsReported',
          hasResults: 1,
          category: 'Lab',
          deliveredThisMonth: 0
        },
        '468': {
          approval: 'Approved',
          maintenanceStatus: 'inactiveUnknown',
          deliveredLastMonth: 0,
          lastPingOn: '2020-08-31T15:24:43.000Z',
          shortName: 'D-588851',
          createdOn: '2020-08-24T15:24:43.000Z',
          error: {
            count: 0,
            total: 0,
            rate: 0
          },
          maintenanceStatusManuallySet: 1,
          maintenanceStatusActive: 0,
          name: 'Cordon Reference Lab GeneXpert',
          maintenanceStatusName: 'Unknown',
          resultCountThisMonth: 0,
          state: 'Idaho',
          hasConnectivity: 0,
          lastSeen: '2020-08-25T15:24:43.000Z',
          siteName: 'Cordon Reference Lab',
          issueCategories: [],
          resultCountLastMonth: 0,
          type: 'GeneXpert',
          id: '468',
          availability: {
            count: 25,
            total: 30,
            rate: 0.8333333333333334
          },
          maintenanceStatusI18nKey: 'inactiveUnknown',
          hasResults: 1,
          category: 'Lab',
          deliveredThisMonth: 0
        }
      },
      currentIdList: [
        '108',
        '133',
        '109',
        '125',
        '115',
        '140',
        '131',
        '132',
        '96',
        '468'
      ]
    },
    table: {
      loading: false,
      sortCol: 'name',
      sortDir: 'asc',
      page: 0,
      pageSize: 10,
      total: 57,
      extraColumns: [],
      groupBy: []
    },
    selectList: {
      loading: false,
      items: []
    },
    activeDialog: {},
    performanceReport: {}
  },
  deviceApiKey: {
    items: {
      byId: {},
      currentIdList: []
    },
    table: {
      loading: false,
      sortCol: 'createdOn',
      sortDir: 'desc',
      page: 0,
      pageSize: 10,
      total: 0,
      extraColumns: [],
      groupBy: []
    }
  },
  deviceOperation: {
    items: {
      byId: {},
      currentIdList: []
    },
    table: {
      loading: false,
      sortCol: 'startedOn',
      sortDir: 'desc',
      page: 0,
      pageSize: 10,
      total: 0,
      extraColumns: [],
      groupBy: []
    }
  },
  deviceApproval: {
    loading: false,
    items: [
      {
        id: '1',
        name: 'Provisioned'
      },
      {
        id: '2',
        name: 'Assigned'
      },
      {
        id: '3',
        name: 'Approved'
      },
      {
        id: '4',
        name: 'Decommissioned'
      }
    ],
    lastRefreshed: '2020-09-28T19:00:15.703Z'
  },
  deviceType: {
    selectList: {
      loading: false,
      items: [
        {
          id: '11',
          name: 'Aspect'
        },
        {
          id: '9',
          name: 'Aspect Reporter'
        },
        {
          id: '2',
          name: 'GeneXpert'
        },
        {
          id: '1',
          name: 'm2000'
        },
        {
          id: '4',
          name: 'Metacom Router'
        }
      ],
      lastRefreshed: '2020-09-28T19:00:15.699Z'
    }
  },
  disease: {
    diseases: {
      loading: false,
      items: [
        {
          id: '1',
          name: 'Tuberculosis',
          i18nKey: 'diseaseNameTuberculosis',
          externalId: 'tb',
          hasResults: true
        },
        {
          id: '2',
          name: 'Ebola',
          i18nKey: 'diseaseNameEbola',
          externalId: 'ebola',
          hasResults: true
        },
        {
          id: '3',
          name: 'HIV/AIDS',
          i18nKey: 'diseaseNameHIVAIDS',
          externalId: 'hiv',
          hasResults: true
        },
        {
          id: '4',
          name: 'Hepatitis B',
          i18nKey: 'diseaseNameHepatitisB',
          externalId: 'hbv',
          hasResults: false
        },
        {
          id: '5',
          name: 'Hepatitis C',
          i18nKey: 'diseaseNameHepatitisC',
          externalId: 'hcv',
          hasResults: true
        },
        {
          id: '6',
          name: 'Zika Fever',
          i18nKey: 'diseaseNameZikaFever',
          externalId: 'zika',
          hasResults: false
        },
        {
          id: '7',
          name: 'Dengue Fever',
          i18nKey: 'diseaseNameDengueFever',
          externalId: 'dengue',
          hasResults: false
        },
        {
          id: '8',
          name: 'SARS-CoV-2 (COVID-19)',
          i18nKey: 'diseaseNameCovid19',
          externalId: 'covid19',
          hasResults: false
        }
      ],
      lastRefreshed: '2020-09-28T19:00:15.701Z'
    }
  },
  filter: {
    listConfig: {
      assayAndResultCategory: false,
      geography: false,
      state: true,
      lga: true,
      date: false,
      partnerId: false,
      patientOrResearchId: false,
      sampleId: false,
      sampleGroup: false,
      deviceName: false,
      siteName: false,
      sampleOriginSite: false,
      contactNameOrEmail: false,
      consumable: false,
      workflowStatus: false,
      deviceApproval: false,
      externalId: false,
      notificationName: false
    },
    listExport: {
      askingConfirmation: false,
      processingExportExcel: false,
      processingExportCsv: false
    }
  },
  form: {},
  geography: {
    countriesForLocationSelector: {
      loading: false,
      items: [
        {
          id: '6',
          name: 'United States',
          children: {
            loading: false,
            items: []
          }
        }
      ],
      lastRefreshed: '2020-09-28T19:00:15.693Z'
    }
  },
  globals: {
    title: 'Results',
    lastServerResponseTime: '2020-09-28T19:36:45.000Z',
    downloadStarted: false
  },
  idle: {
    idleStatus: 'AWAY',
    isRunning: true,
    isDetectionRunning: true,
    isIdle: true,
    lastActive: 1601321805850,
    lastEvent: {
      x: 755,
      y: 1040,
      type: 'mousemove'
    }
  },
  inventory: {
    inventoryAdjustment: {},
    items: {
      byId: {},
      currentIdList: []
    },
    table: {
      loading: false,
      sortCol: 'siteName',
      sortDir: 'asc',
      page: 0,
      pageSize: 10,
      total: 0,
      groupBy: [
        'siteId'
      ],
      extraColumns: []
    }
  },
  jobs: {
    partnersAndJobFunctionsForSelectList: {
      loading: false,
      partners: []
    }
  },
  notification: {
    items: {
      byId: {},
      currentIdList: []
    },
    table: {
      loading: false,
      sortCol: 'name',
      sortDir: 'asc',
      page: 0,
      pageSize: 10,
      total: 0,
      extraColumns: [],
      groupBy: []
    }
  },
  patient: {
    items: []
  },
  person: {
    items: {
      byId: {},
      currentIdList: []
    },
    table: {
      loading: false,
      sortCol: 'name',
      sortDir: 'asc',
      page: 0,
      pageSize: 10,
      total: 0,
      extraColumns: [],
      groupBy: []
    },
    availableContacts: {},
    siteContacts: {},
    personNew: {}
  },
  report: {
    items: [],
    loading: true
  },
  reporter: {
    items: {
      byId: {},
      currentIdList: []
    },
    table: {
      loading: false,
      sortCol: 'name',
      sortDir: 'asc',
      page: 0,
      pageSize: 10,
      total: 0,
      extraColumns: [],
      groupBy: []
    }
  },
  result: {
    workflowLog: {
      items: {
        byId: {},
        currentIdList: []
      },
      table: {
        loading: false,
        sortCol: 'changedOn',
        sortDir: 'desc',
        page: 0,
        pageSize: 10,
        total: 0,
        extraColumns: [],
        groupBy: []
      }
    },
    deviceLogs: [],
    screenSchema: {
      title: 'Result Details',
      icon: 'document',
      groups: {
        site: {
          order: 0,
          summary: {
            title: 'Lab',
            rows: {
              siteName: {
                type: 'string',
                row: 0,
                order: 0,
                title: 'Site'
              }
            }
          },
          detail: {
            title: 'Lab',
            rows: {
              siteName: {
                type: 'string',
                row: 0,
                order: 0,
                title: 'Site',
                link: '/browse/site/<%= siteId %>'
              },
              deviceId: {
                type: 'string',
                row: 0,
                order: 1,
                title: 'Device Serial',
                link: '/browse/device/<%= deviceId %>'
              },
              countryName: {
                type: 'string',
                row: 1,
                order: 0,
                title: 'Country'
              },
              stateName: {
                type: 'string',
                row: 1,
                order: 1,
                title: 'State'
              },
              lgaName: {
                type: 'string',
                row: 1,
                order: 2,
                title: 'City'
              }
            }
          }
        },
        assay: {
          order: 1,
          summary: {
            title: 'Assay Type',
            rows: {
              name: {
                type: 'string',
                row: 0,
                order: 0,
                title: 'Assay Type'
              }
            }
          },
          detail: {
            title: 'Assay',
            rows: {
              consumableExpirationDate: {
                type: 'date',
                row: 0,
                order: 3,
                title: 'Expiration Date',
                condition: {
                  criteria: 'assay.deviceTypeExternalId',
                  value: 'CepheidGeneXpert'
                }
              },
              moduleSerial: {
                type: 'string',
                row: 1,
                order: 5,
                title: 'Module Serial',
                condition: {
                  criteria: 'assay.deviceTypeExternalId',
                  value: 'CepheidGeneXpert'
                }
              },
              notes: {
                type: 'string',
                row: 2,
                order: 10,
                title: 'Notes'
              },
              name: {
                type: 'string',
                row: 0,
                order: 0,
                title: 'Assay Type'
              },
              consumableLot: {
                type: 'string',
                row: 0,
                order: 1,
                title: 'Reagent Lot ID',
                condition: {
                  criteria: 'assay.deviceTypeExternalId',
                  value: 'CepheidGeneXpert'
                }
              },
              consumableSerial: {
                type: 'string',
                row: 0,
                order: 2,
                title: 'Cartridge Serial',
                condition: {
                  criteria: 'assay.deviceTypeExternalId',
                  value: 'CepheidGeneXpert'
                }
              },
              moduleName: {
                type: 'string',
                row: 1,
                order: 6,
                title: 'Module Slot',
                condition: {
                  criteria: 'assay.deviceTypeExternalId',
                  value: 'CepheidGeneXpert'
                }
              },
              senderOperator: {
                type: 'string',
                row: 2,
                order: 7,
                title: 'Operator'
              },
              instrumentSerial: {
                type: 'string',
                row: 1,
                order: 4,
                title: 'Instrument Serial',
                condition: {
                  criteria: 'assay.deviceTypeExternalId',
                  value: 'CepheidGeneXpert'
                }
              }
            }
          }
        },
        date: {
          order: 2,
          summary: {
            title: 'Start Date',
            rows: {
              startedOn: {
                type: 'time',
                row: 0,
                order: 0,
                title: 'Start Date'
              }
            }
          },
          detail: {
            title: 'Date',
            rows: {
              startedOn: {
                type: 'time',
                row: 0,
                order: 0,
                title: 'Start Date'
              },
              endedOn: {
                type: 'time',
                row: 0,
                order: 1,
                title: 'End Date'
              },
              createdOn: {
                type: 'time',
                row: 1,
                order: 0,
                title: 'Added'
              },
              updatedOn: {
                type: 'time',
                row: 1,
                order: 1,
                title: 'Last Update'
              }
            }
          }
        },
        sample: {
          order: 3,
          summary: {
            title: 'Sample ID',
            rows: {
              sampleId: {
                type: 'string',
                row: 0,
                order: 0,
                title: 'Sample ID'
              }
            }
          },
          detail: {
            title: 'Sample',
            rows: {
              sampleId: {
                type: 'string',
                row: 0,
                order: 0,
                title: 'Sample ID'
              },
              sampleTypeName: {
                type: 'string',
                row: 0,
                order: 1,
                title: 'Sample Type'
              },
              sampleCollectedOn: {
                type: 'time',
                row: 0,
                order: 2,
                title: 'Sample Collection Date'
              },
              sampleOriginSiteName: {
                type: 'string',
                row: 1,
                order: 0,
                title: 'Sample Collection Site',
                link: '/browse/site/<%= sampleOriginSiteId %>'
              },
              sampleCollectedBy: {
                type: 'time',
                row: 1,
                order: 1,
                title: 'Collected By'
              }
            }
          }
        },
        patientData: {
          order: 4,
          summary: {
            title: 'Patient ID',
            rows: {
              id: {
                type: 'string',
                row: 0,
                order: 0,
                title: 'Patient ID',
                linkButton: {
                  to: '/browse/patient/<%= patientId %>',
                  text: 'Clinical History'
                }
              }
            }
          },
          detail: {
            title: 'Patient',
            rows: {
              patientId: {
                type: 'string',
                row: 0,
                order: 0,
                title: 'Patient ID'
              },
              caseExternalId: {
                type: 'string',
                row: 0,
                order: 1,
                title: 'Case ID'
              }
            },
            dataSchema: 'assay.patientDataSchema'
          }
        },
        resultData: {
          order: 5,
          summary: {
            title: 'Result',
            rows: {
              resultCategory1Name: {
                type: 'string',
                row: 0,
                order: 0,
                title: 'MTB',
                titleAssayDefinition: 'resultCategory1Label'
              },
              resultCategory2Name: {
                type: 'string',
                row: 0,
                order: 1,
                title: 'RIF',
                titleAssayDefinition: 'resultCategory2Label'
              }
            }
          },
          detail: {
            title: 'Result',
            rows: {
              resultCategory1Name: {
                type: 'string',
                row: 0,
                order: 0,
                title: 'MTB',
                titleAssayDefinition: 'resultCategory1Label'
              },
              resultCategory2Name: {
                type: 'string',
                row: 0,
                order: 1,
                title: 'RIF',
                titleAssayDefinition: 'resultCategory2Label'
              },
              errorCode: {
                type: 'string',
                row: 1,
                order: 3,
                title: 'Error Code'
              }
            },
            dataSchema: 'assay.resultDataSchema'
          }
        }
      }
    },
    loading: true,
    formDataSaving: false,
    formDataDirty: false
  },
  resultTreatmentStatus: {
    loading: false,
    items: [
      {
        id: '1',
        name: 'Awaiting Treatment'
      },
      {
        id: '3',
        name: 'Not Possible'
      },
      {
        id: '2',
        name: 'On Treatment'
      }
    ],
    lastRefreshed: '2020-09-28T19:00:19.421Z'
  },
  resultWorkflowStatus: {
    loading: false,
    items: [
      {
        id: '9',
        name: 'Acknowledged'
      },
      {
        id: '8',
        name: 'Delivered'
      },
      {
        id: '4',
        name: 'In Progress'
      },
      {
        id: '1',
        name: 'OK'
      },
      {
        id: '3',
        name: 'Ordered'
      },
      {
        id: '5',
        name: 'Processed'
      },
      {
        id: '11',
        name: 'Purged'
      },
      {
        id: '7',
        name: 'Ready for delivery'
      },
      {
        id: '6',
        name: 'Validated'
      },
      {
        id: '2',
        name: 'Error'
      },
      {
        id: '10',
        name: 'Flagged'
      }
    ],
    lastRefreshed: '2020-09-28T19:00:19.419Z'
  },
  router: {
    items: {
      byId: {},
      currentIdList: []
    },
    table: {
      loading: false,
      sortCol: 'name',
      sortDir: 'asc',
      page: 0,
      pageSize: 10,
      total: 0,
      extraColumns: [],
      groupBy: []
    }
  },
  site: {
    items: {
      byId: {},
      currentIdList: []
    },
    table: {
      loading: false,
      sortCol: 'name',
      sortDir: 'asc',
      page: 0,
      pageSize: 10,
      total: 0,
      extraColumns: [],
      groupBy: []
    },
    selectList: {
      loading: false,
      items: [
        {
          lgaId: '196',
          zip: '12345-196',
          partnerId: '1',
          externalId: 'Massachusetts_3',
          shortName: 'Amherst',
          city: 'Amherst',
          name: 'Amherst Lab',
          latitude: 42.218273,
          stateId: '91',
          street1: '196 Main Street',
          street2: null,
          longitude: -71.555061,
          lgaName: 'Franklin',
          countryId: '6',
          id: '557',
          stateName: 'Massachusetts'
        },
        {
          lgaId: '195',
          zip: '12345-195',
          partnerId: '1',
          externalId: 'Georgia_3',
          shortName: 'Athens',
          city: 'Athens',
          name: 'Athens Lab',
          latitude: 33.045292,
          stateId: '80',
          street1: '195 Main Street',
          street2: null,
          longitude: -83.433372,
          lgaName: 'Clayton',
          countryId: '6',
          id: '590',
          stateName: 'Georgia'
        },
        {
          lgaId: '194',
          zip: '12345-194',
          partnerId: '1',
          externalId: 'Georgia_1',
          shortName: 'Atlanta',
          city: 'Atlanta',
          name: 'Atlanta Reference Lab',
          latitude: 32.75428,
          stateId: '80',
          street1: '194 Main Street',
          street2: null,
          longitude: -83.70285,
          lgaName: 'Atlanta',
          countryId: '6',
          id: '581',
          stateName: 'Georgia'
        },
        {
          lgaId: '203',
          zip: '12345-203',
          partnerId: '1',
          externalId: 'Oregon_1',
          shortName: 'Beaverton',
          city: 'Beaverton',
          name: 'Beaverton Clinic',
          latitude: 44.622849,
          stateId: '107',
          street1: '203 Main Street',
          street2: null,
          longitude: -122.317688,
          lgaName: 'Clackamas',
          countryId: '6',
          id: '593',
          stateName: 'Oregon'
        },
        {
          lgaId: '196',
          zip: '12345-196',
          partnerId: '1',
          externalId: 'Massachusetts_4',
          shortName: 'Belchertown',
          city: 'Belchertown',
          name: 'Belchertown Lab',
          latitude: 42.125648,
          stateId: '91',
          street1: '196 Main Street',
          street2: null,
          longitude: -71.094421,
          lgaName: 'Franklin',
          countryId: '6',
          id: '558',
          stateName: 'Massachusetts'
        },
        {
          lgaId: '197',
          zip: '12345-197',
          partnerId: '1',
          externalId: 'Massachusetts_1',
          shortName: 'Boston',
          city: 'Boston',
          name: 'Boston Reference Lab',
          latitude: 42.11227,
          stateId: '91',
          street1: '197 Main Street',
          street2: null,
          longitude: -71.418205,
          lgaName: 'Suffolk',
          countryId: '6',
          id: '574',
          stateName: 'Massachusetts'
        },
        {
          lgaId: '186',
          zip: '12345-186',
          partnerId: '1',
          externalId: 'Alabama_4',
          shortName: 'Carter',
          city: 'Carter',
          name: 'Carter NMRL',
          latitude: 32.839874,
          stateId: '71',
          street1: '186 Main Street',
          street2: null,
          longitude: -86.750977,
          lgaName: 'Pike',
          countryId: '6',
          id: '562',
          stateName: 'Alabama'
        },
        {
          lgaId: '195',
          zip: '12345-195',
          partnerId: '1',
          externalId: 'Georgia_1',
          shortName: 'Clayton',
          city: 'Clayton',
          name: 'Clayton Reference Lab',
          latitude: 33.277798,
          stateId: '80',
          street1: '195 Main Street',
          street2: null,
          longitude: -83.420517,
          lgaName: 'Clayton',
          countryId: '6',
          id: '588',
          stateName: 'Georgia'
        },
        {
          lgaId: '192',
          zip: '12345-192',
          partnerId: '1',
          externalId: 'Idaho_1',
          shortName: 'Clearwater',
          city: 'Clearwater',
          name: 'Clearwater Reference Lab',
          latitude: 44.037827,
          stateId: '83',
          street1: '192 Main Street',
          street2: null,
          longitude: -114.915718,
          lgaName: 'Clearwater',
          countryId: '6',
          id: '578',
          stateName: 'Idaho'
        },
        {
          lgaId: '199',
          zip: '12345-199',
          partnerId: '1',
          externalId: 'Ohio_1',
          shortName: 'Cleveland',
          city: 'Cleveland',
          name: 'Cleveland Microbiology Lab',
          latitude: 40.313553,
          stateId: '106',
          street1: '199 Main Street',
          street2: null,
          longitude: -82.808884,
          lgaName: 'Cuyahoga',
          countryId: '6',
          id: '577',
          stateName: 'Ohio'
        },
        {
          lgaId: '190',
          zip: '12345-190',
          partnerId: '1',
          externalId: 'Arizona_3',
          shortName: 'Cooperstown',
          city: 'Cooperstown',
          name: 'Cooperstown Lab',
          latitude: 33.925835,
          stateId: '73',
          street1: '190 Main Street',
          street2: null,
          longitude: -111.613525,
          lgaName: 'Yuma',
          countryId: '6',
          id: '544',
          stateName: 'Arizona'
        },
        {
          lgaId: '193',
          zip: '12345-193',
          partnerId: '1',
          externalId: 'Idaho_2',
          shortName: 'Cordon',
          city: 'Cordon',
          name: 'Cordon Reference Lab',
          latitude: 44.490128,
          stateId: '83',
          street1: '193 Main Street',
          street2: null,
          longitude: -114.258896,
          lgaName: 'Gooding',
          countryId: '6',
          id: '587',
          stateName: 'Idaho'
        },
        {
          lgaId: '187',
          zip: '12345-187',
          partnerId: '1',
          externalId: 'Alabama_2',
          shortName: 'Crenshaw',
          city: 'Crenshaw',
          name: 'Crenshaw NMRL',
          latitude: 33.242401,
          stateId: '71',
          street1: '187 Main Street',
          street2: null,
          longitude: -86.753326,
          lgaName: 'Lawrence',
          countryId: '6',
          id: '565',
          stateName: 'Alabama'
        },
        {
          lgaId: '196',
          zip: '12345-196',
          partnerId: '1',
          externalId: 'Massachusetts_2',
          shortName: 'Deerfield',
          city: 'Deerfield',
          name: 'Deerfield NMRL',
          latitude: 42.299774,
          stateId: '91',
          street1: '196 Main Street',
          street2: null,
          longitude: -71.131874,
          lgaName: 'Franklin',
          countryId: '6',
          id: '556',
          stateName: 'Massachusetts'
        },
        {
          lgaId: '185',
          zip: '12345-185',
          partnerId: '1',
          externalId: 'Alabama_5',
          shortName: 'Durham',
          city: 'Durham',
          name: 'Durham Clinic',
          latitude: 33.232929,
          stateId: '71',
          street1: '185 Main Street',
          street2: null,
          longitude: -86.41256,
          lgaName: 'Winston',
          countryId: '6',
          id: '538',
          stateName: 'Alabama'
        },
        {
          lgaId: '201',
          zip: '12345-201',
          partnerId: '1',
          externalId: 'Nebraska_2',
          shortName: 'East Gage',
          city: 'East Gage',
          name: 'East Gage Microbiology Lab',
          latitude: 41.451633,
          stateId: '99',
          street1: '201 Main Street',
          street2: null,
          longitude: -98.585007,
          lgaName: 'Gage',
          countryId: '6',
          id: '583',
          stateName: 'Nebraska'
        },
        {
          lgaId: '200',
          zip: '12345-200',
          partnerId: '1',
          externalId: 'Nebraska_5',
          shortName: 'East Lincoln',
          city: 'East Lincoln',
          name: 'East Lincoln Reference Lab',
          latitude: 41.211559,
          stateId: '99',
          street1: '200 Main Street',
          street2: null,
          longitude: -98.451248,
          lgaName: 'Hall',
          countryId: '6',
          id: '571',
          stateName: 'Nebraska'
        },
        {
          lgaId: '202',
          zip: '12345-202',
          partnerId: '1',
          externalId: 'Nebraska_3',
          shortName: 'Franklin',
          city: 'Franklin',
          name: 'Franklin Microbiology Lab',
          latitude: 41.074787,
          stateId: '99',
          street1: '202 Main Street',
          street2: null,
          longitude: -97.826797,
          lgaName: 'Lancaster',
          countryId: '6',
          id: '597',
          stateName: 'Nebraska'
        },
        {
          lgaId: '201',
          zip: '12345-201',
          partnerId: '1',
          externalId: 'Nebraska_1',
          shortName: 'Gage',
          city: 'Gage',
          name: 'Gage Clinic',
          latitude: 41.107464,
          stateId: '99',
          street1: '201 Main Street',
          street2: null,
          longitude: -98.154633,
          lgaName: 'Gage',
          countryId: '6',
          id: '582',
          stateName: 'Nebraska'
        },
        {
          lgaId: '193',
          zip: '12345-193',
          partnerId: '1',
          externalId: 'Idaho_1',
          shortName: 'Gooding',
          city: 'Gooding',
          name: 'Gooding Clinic',
          latitude: 44.659706,
          stateId: '83',
          street1: '193 Main Street',
          street2: null,
          longitude: -114.757866,
          lgaName: 'Gooding',
          countryId: '6',
          id: '586',
          stateName: 'Idaho'
        },
        {
          lgaId: '200',
          zip: '12345-200',
          partnerId: '1',
          externalId: 'Nebraska_1',
          shortName: 'Hall',
          city: 'Hall',
          name: 'Hall NMRL',
          latitude: 40.726669,
          stateId: '99',
          street1: '200 Main Street',
          street2: null,
          longitude: -97.835556,
          lgaName: 'Hall',
          countryId: '6',
          id: '567',
          stateName: 'Nebraska'
        },
        {
          lgaId: '202',
          zip: '12345-202',
          partnerId: '1',
          externalId: 'Nebraska_2',
          shortName: 'Hampton',
          city: 'Hampton',
          name: 'Hampton Microbiology Lab',
          latitude: 40.876999,
          stateId: '99',
          street1: '202 Main Street',
          street2: null,
          longitude: -98.725433,
          lgaName: 'Lancaster',
          countryId: '6',
          id: '596',
          stateName: 'Nebraska'
        },
        {
          lgaId: '192',
          zip: '12345-192',
          partnerId: '1',
          externalId: 'Idaho_2',
          shortName: 'Idaho Falls',
          city: 'Idaho Falls',
          name: 'Idaho Falls NMRL',
          latitude: 44.093597,
          stateId: '83',
          street1: '192 Main Street',
          street2: null,
          longitude: -114.471397,
          lgaName: 'Clearwater',
          countryId: '6',
          id: '579',
          stateName: 'Idaho'
        },
        {
          lgaId: '185',
          zip: '12345-185',
          partnerId: '1',
          externalId: 'Alabama_4',
          shortName: 'Independence',
          city: 'Independence',
          name: 'Independence NMRL',
          latitude: 33.131271,
          stateId: '71',
          street1: '185 Main Street',
          street2: null,
          longitude: -86.714676,
          lgaName: 'Winston',
          countryId: '6',
          id: '537',
          stateName: 'Alabama'
        },
        {
          lgaId: '202',
          zip: '12345-202',
          partnerId: '1',
          externalId: 'Nebraska_1',
          shortName: 'Lancaster',
          city: 'Lancaster',
          name: 'Lancaster Reference Lab',
          latitude: 40.933247,
          stateId: '99',
          street1: '202 Main Street',
          street2: null,
          longitude: -98.580261,
          lgaName: 'Lancaster',
          countryId: '6',
          id: '595',
          stateName: 'Nebraska'
        },
        {
          lgaId: '187',
          zip: '12345-187',
          partnerId: '1',
          externalId: 'Alabama_1',
          shortName: 'Lawrence',
          city: 'Lawrence',
          name: 'Lawrence Reference Lab',
          latitude: 32.515026,
          stateId: '71',
          street1: '187 Main Street',
          street2: null,
          longitude: -87.253647,
          lgaName: 'Lawrence',
          countryId: '6',
          id: '564',
          stateName: 'Alabama'
        },
        {
          lgaId: '191',
          zip: '12345-191',
          partnerId: '1',
          externalId: 'Arizona_4',
          shortName: 'Lima',
          city: 'Lima',
          name: 'Lima Reference Lab',
          latitude: 33.426174,
          stateId: '73',
          street1: '191 Main Street',
          street2: null,
          longitude: -111.247574,
          lgaName: 'Maricopa',
          countryId: '6',
          id: '554',
          stateName: 'Arizona'
        },
        {
          lgaId: '200',
          zip: '12345-200',
          partnerId: '1',
          externalId: 'Nebraska_4',
          shortName: 'Lincoln',
          city: 'Lincoln',
          name: 'Lincoln NMRL',
          latitude: 40.828667,
          stateId: '99',
          street1: '200 Main Street',
          street2: null,
          longitude: -97.914711,
          lgaName: 'Hall',
          countryId: '6',
          id: '570',
          stateName: 'Nebraska'
        },
        {
          lgaId: '190',
          zip: '12345-190',
          partnerId: '1',
          externalId: 'Arizona_2',
          shortName: 'Littleton',
          city: 'Littleton',
          name: 'Littleton Reference Lab',
          latitude: 33.969009,
          stateId: '73',
          street1: '190 Main Street',
          street2: null,
          longitude: -111.797668,
          lgaName: 'Yuma',
          countryId: '6',
          id: '543',
          stateName: 'Arizona'
        },
        {
          lgaId: '197',
          zip: '12345-197',
          partnerId: '1',
          externalId: 'Massachusetts_3',
          shortName: 'Lowell',
          city: 'Lowell',
          name: 'Lowell Clinic',
          latitude: 41.750381,
          stateId: '91',
          street1: '197 Main Street',
          street2: null,
          longitude: -71.153786,
          lgaName: 'Suffolk',
          countryId: '6',
          id: '576',
          stateName: 'Massachusetts'
        },
        {
          lgaId: '198',
          zip: '12345-198',
          partnerId: '1',
          externalId: 'Ohio_2',
          shortName: 'Mansfield',
          city: 'Mansfield',
          name: 'Mansfield Clinic',
          latitude: 40.860477,
          stateId: '106',
          street1: '198 Main Street',
          street2: null,
          longitude: -83.013702,
          lgaName: 'Wayne',
          countryId: '6',
          id: '573',
          stateName: 'Ohio'
        },
        {
          lgaId: '191',
          zip: '12345-191',
          partnerId: '1',
          externalId: 'Arizona_1',
          shortName: 'Maricopa',
          city: 'Maricopa',
          name: 'Maricopa Reference Lab',
          latitude: 33.489246,
          stateId: '73',
          street1: '191 Main Street',
          street2: null,
          longitude: -111.453506,
          lgaName: 'Maricopa',
          countryId: '6',
          id: '551',
          stateName: 'Arizona'
        },
        {
          lgaId: '190',
          zip: '12345-190',
          partnerId: '1',
          externalId: 'Arizona_4',
          shortName: 'Marlboro',
          city: 'Marlboro',
          name: 'Marlboro NMRL',
          latitude: 34.050819,
          stateId: '73',
          street1: '190 Main Street',
          street2: null,
          longitude: -111.404533,
          lgaName: 'Yuma',
          countryId: '6',
          id: '545',
          stateName: 'Arizona'
        },
        {
          lgaId: '185',
          zip: '12345-185',
          partnerId: '1',
          externalId: 'Alabama_2',
          shortName: 'Mobile',
          city: 'Mobile',
          name: 'Mobile Microbiology Lab',
          latitude: 32.924397,
          stateId: '71',
          street1: '185 Main Street',
          street2: null,
          longitude: -86.662308,
          lgaName: 'Winston',
          countryId: '6',
          id: '535',
          stateName: 'Alabama'
        },
        {
          lgaId: '187',
          zip: '12345-187',
          partnerId: '1',
          externalId: 'Alabama_3',
          shortName: 'Morristown',
          city: 'Morristown',
          name: 'Morristown Hospital',
          latitude: 33.172203,
          stateId: '71',
          street1: '187 Main Street',
          street2: null,
          longitude: -86.95224,
          lgaName: 'Lawrence',
          countryId: '6',
          id: '566',
          stateName: 'Alabama'
        },
        {
          lgaId: '195',
          zip: '12345-195',
          partnerId: '1',
          externalId: 'Georgia_5',
          shortName: 'Naples',
          city: 'Naples',
          name: 'Naples Reference Lab',
          latitude: 33.367977,
          stateId: '80',
          street1: '195 Main Street',
          street2: null,
          longitude: -83.608818,
          lgaName: 'Clayton',
          countryId: '6',
          id: '592',
          stateName: 'Georgia'
        },
        {
          lgaId: '195',
          zip: '12345-195',
          partnerId: '1',
          externalId: 'Georgia_2',
          shortName: 'New Berlin',
          city: 'New Berlin',
          name: 'New Berlin Hospital',
          latitude: 32.835678,
          stateId: '80',
          street1: '195 Main Street',
          street2: null,
          longitude: -83.81012,
          lgaName: 'Clayton',
          countryId: '6',
          id: '589',
          stateName: 'Georgia'
        },
        {
          lgaId: '196',
          zip: '12345-196',
          partnerId: '1',
          externalId: 'Massachusetts_1',
          shortName: 'Northampton',
          city: 'Northampton',
          name: 'Northampton Lab',
          latitude: 41.794682,
          stateId: '91',
          street1: '196 Main Street',
          street2: null,
          longitude: -71.38501,
          lgaName: 'Franklin',
          countryId: '6',
          id: '555',
          stateName: 'Massachusetts'
        },
        {
          lgaId: '188',
          zip: '12345-188',
          partnerId: '1',
          externalId: 'Arizona_2',
          shortName: 'Palmdale',
          city: 'Palmdale',
          name: 'Palmdale Clinic',
          latitude: 33.352154,
          stateId: '73',
          street1: '188 Main Street',
          street2: null,
          longitude: -111.14653,
          lgaName: 'Phoenix',
          countryId: '6',
          id: '550',
          stateName: 'Arizona'
        },
        {
          lgaId: '200',
          zip: '12345-200',
          partnerId: '1',
          externalId: 'Nebraska_2',
          shortName: 'Palmer',
          city: 'Palmer',
          name: 'Palmer Reference Lab',
          latitude: 41.514824,
          stateId: '99',
          street1: '200 Main Street',
          street2: null,
          longitude: -98.355698,
          lgaName: 'Hall',
          countryId: '6',
          id: '568',
          stateName: 'Nebraska'
        },
        {
          lgaId: '197',
          zip: '12345-197',
          partnerId: '1',
          externalId: 'Massachusetts_2',
          shortName: 'Peabody',
          city: 'Peabody',
          name: 'Peabody Microbiology Lab',
          latitude: 42.626949,
          stateId: '91',
          street1: '197 Main Street',
          street2: null,
          longitude: -71.318573,
          lgaName: 'Suffolk',
          countryId: '6',
          id: '575',
          stateName: 'Massachusetts'
        },
        {
          lgaId: '188',
          zip: '12345-188',
          partnerId: '1',
          externalId: 'Arizona_1',
          shortName: 'Phoenix',
          city: 'Phoenix',
          name: 'Phoenix Clinic',
          latitude: 34.115421,
          stateId: '73',
          street1: '188 Main Street',
          street2: null,
          longitude: -111.388824,
          lgaName: 'Phoenix',
          countryId: '6',
          id: '549',
          stateName: 'Arizona'
        },
        {
          lgaId: '186',
          zip: '12345-186',
          partnerId: '1',
          externalId: 'Alabama_1',
          shortName: 'Pike',
          city: 'Pike',
          name: 'Pike NMRL',
          latitude: 33.0667,
          stateId: '71',
          street1: '186 Main Street',
          street2: null,
          longitude: -86.675201,
          lgaName: 'Pike',
          countryId: '6',
          id: '559',
          stateName: 'Alabama'
        },
        {
          lgaId: '203',
          zip: '12345-203',
          partnerId: '1',
          externalId: 'Oregon_2',
          shortName: 'Portland',
          city: 'Portland',
          name: 'Portland Microbiology Lab',
          latitude: 44.176868,
          stateId: '107',
          street1: '203 Main Street',
          street2: null,
          longitude: -121.904129,
          lgaName: 'Clackamas',
          countryId: '6',
          id: '594',
          stateName: 'Oregon'
        },
        {
          lgaId: '190',
          zip: '12345-190',
          partnerId: '1',
          externalId: 'Arizona_5',
          shortName: 'Raleigh',
          city: 'Raleigh',
          name: 'Raleigh Hospital',
          latitude: 33.796593,
          stateId: '73',
          street1: '190 Main Street',
          street2: null,
          longitude: -111.161018,
          lgaName: 'Yuma',
          countryId: '6',
          id: '546',
          stateName: 'Arizona'
        },
        {
          lgaId: '201',
          zip: '12345-201',
          partnerId: '1',
          externalId: 'Nebraska_3',
          shortName: 'Rearden',
          city: 'Rearden',
          name: 'Rearden Microbiology Lab',
          latitude: 41.325008,
          stateId: '99',
          street1: '201 Main Street',
          street2: null,
          longitude: -98.008507,
          lgaName: 'Gage',
          countryId: '6',
          id: '584',
          stateName: 'Nebraska'
        },
        {
          lgaId: '192',
          zip: '12345-192',
          partnerId: '1',
          externalId: 'Idaho_3',
          shortName: 'Rome',
          city: 'Rome',
          name: 'Rome Microbiology Lab',
          latitude: 44.198902,
          stateId: '83',
          street1: '192 Main Street',
          street2: null,
          longitude: -114.310661,
          lgaName: 'Clearwater',
          countryId: '6',
          id: '580',
          stateName: 'Idaho'
        },
        {
          lgaId: '191',
          zip: '12345-191',
          partnerId: '1',
          externalId: 'Arizona_2',
          shortName: 'Saunter',
          city: 'Saunter',
          name: 'Saunter Microbiology Lab',
          latitude: 33.270126,
          stateId: '73',
          street1: '191 Main Street',
          street2: null,
          longitude: -111.824547,
          lgaName: 'Maricopa',
          countryId: '6',
          id: '552',
          stateName: 'Arizona'
        },
        {
          lgaId: '195',
          zip: '12345-195',
          partnerId: '1',
          externalId: 'Georgia_4',
          shortName: 'Savannah',
          city: 'Savannah',
          name: 'Savannah Clinic',
          latitude: 32.807514,
          stateId: '80',
          street1: '195 Main Street',
          street2: null,
          longitude: -83.342102,
          lgaName: 'Clayton',
          countryId: '6',
          id: '591',
          stateName: 'Georgia'
        },
        {
          lgaId: '185',
          zip: '12345-185',
          partnerId: '1',
          externalId: 'Alabama_3',
          shortName: 'Selma',
          city: 'Selma',
          name: 'Selma Lab',
          latitude: 33.227036,
          stateId: '71',
          street1: '185 Main Street',
          street2: null,
          longitude: -87.023643,
          lgaName: 'Winston',
          countryId: '6',
          id: '536',
          stateName: 'Alabama'
        },
        {
          lgaId: '204',
          zip: '12345-204',
          partnerId: '1',
          externalId: 'Oregon_1',
          shortName: 'Sherman',
          city: 'Sherman',
          name: 'Sherman Clinic',
          latitude: 44.965977,
          stateId: '107',
          street1: '204 Main Street',
          street2: null,
          longitude: -121.583817,
          lgaName: 'Sherman',
          countryId: '6',
          id: '607',
          stateName: 'Oregon'
        },
        {
          lgaId: '191',
          zip: '12345-191',
          partnerId: '1',
          externalId: 'Arizona_3',
          shortName: 'Simi',
          city: 'Simi',
          name: 'Simi NMRL',
          latitude: 33.996338,
          stateId: '73',
          street1: '191 Main Street',
          street2: null,
          longitude: -111.73661,
          lgaName: 'Maricopa',
          countryId: '6',
          id: '553',
          stateName: 'Arizona'
        },
        {
          lgaId: '201',
          zip: '12345-201',
          partnerId: '1',
          externalId: 'Nebraska_4',
          shortName: 'South Hampton',
          city: 'South Hampton',
          name: 'South Hampton Microbiology Lab',
          latitude: 40.738216,
          stateId: '99',
          street1: '201 Main Street',
          street2: null,
          longitude: -98.437569,
          lgaName: 'Gage',
          countryId: '6',
          id: '585',
          stateName: 'Nebraska'
        },
        {
          lgaId: '189',
          zip: '12345-189',
          partnerId: '1',
          externalId: 'Arizona_1',
          shortName: 'Tucson',
          city: 'Tucson',
          name: 'Tucson Microbiology Lab',
          latitude: 33.399883,
          stateId: '73',
          street1: '189 Main Street',
          street2: null,
          longitude: -111.927711,
          lgaName: 'Tucson',
          countryId: '6',
          id: '563',
          stateName: 'Arizona'
        },
        {
          lgaId: '186',
          zip: '12345-186',
          partnerId: '1',
          externalId: 'Alabama_3',
          shortName: 'Turner',
          city: 'Turner',
          name: 'Turner Reference Lab',
          latitude: 32.600712,
          stateId: '71',
          street1: '186 Main Street',
          street2: null,
          longitude: -86.805191,
          lgaName: 'Pike',
          countryId: '6',
          id: '561',
          stateName: 'Alabama'
        },
        {
          lgaId: '186',
          zip: '12345-186',
          partnerId: '1',
          externalId: 'Alabama_2',
          shortName: 'Warren',
          city: 'Warren',
          name: 'Warren Hospital',
          latitude: 32.432152,
          stateId: '71',
          street1: '186 Main Street',
          street2: null,
          longitude: -86.403793,
          lgaName: 'Pike',
          countryId: '6',
          id: '560',
          stateName: 'Alabama'
        },
        {
          lgaId: '200',
          zip: '12345-200',
          partnerId: '1',
          externalId: 'Nebraska_3',
          shortName: 'West Hall',
          city: 'West Hall',
          name: 'West Hall Lab',
          latitude: 40.853649,
          stateId: '99',
          street1: '200 Main Street',
          street2: null,
          longitude: -98.133904,
          lgaName: 'Hall',
          countryId: '6',
          id: '569',
          stateName: 'Nebraska'
        },
        {
          lgaId: '185',
          zip: '12345-185',
          partnerId: '1',
          externalId: 'Alabama_1',
          shortName: 'Winston',
          city: 'Winston',
          name: 'Winston Clinic',
          latitude: 32.946663,
          stateId: '71',
          street1: '185 Main Street',
          street2: null,
          longitude: -86.801384,
          lgaName: 'Winston',
          countryId: '6',
          id: '534',
          stateName: 'Alabama'
        },
        {
          lgaId: '198',
          zip: '12345-198',
          partnerId: '1',
          externalId: 'Ohio_1',
          shortName: 'Wooster',
          city: 'Wooster',
          name: 'Wooster Microbiology Lab',
          latitude: 40.722164,
          stateId: '106',
          street1: '198 Main Street',
          street2: null,
          longitude: -82.68914,
          lgaName: 'Wayne',
          countryId: '6',
          id: '572',
          stateName: 'Ohio'
        },
        {
          lgaId: '190',
          zip: '12345-190',
          partnerId: '1',
          externalId: 'Arizona_1',
          shortName: 'Yuma',
          city: 'Yuma',
          name: 'Yuma NMRL',
          latitude: 33.522408,
          stateId: '73',
          street1: '190 Main Street',
          street2: null,
          longitude: -111.315041,
          lgaName: 'Yuma',
          countryId: '6',
          id: '542',
          stateName: 'Arizona'
        }
      ],
      countryName: 'United States',
      stateName: null,
      lastRefreshed: '2020-09-28T19:00:19.438Z'
    }
  },
  tag: {
    tags: {},
    possibleTags: {}
  },
  task: {
    items: {
      byId: {},
      currentIdList: []
    },
    table: {
      loading: false,
      sortCol: 'name',
      sortDir: 'asc',
      page: 0,
      pageSize: 10,
      total: 0,
      extraColumns: [],
      groupBy: []
    },
    countByAlert: {},
    sites: [],
    devices: [],
    title: '',
    taskDetails: {},
    jobPersons: []
  },
  user: {
    jwt: {
      name: 'admin',
      permissions: [
        'dashboard:summary',
        'demo:edit',
        'operationalData:view',
        'reporter:edit',
        'dashboard:result',
        'assay:view',
        'result:edit',
        'inventory:edit',
        'deviceApiKey:edit',
        'issue:edit',
        'report:view',
        'dashboard:site',
        'device:edit',
        'person:edit',
        'case:edit',
        'browse:view',
        'router:view',
        'dashboard:inventory',
        'dashboard:target',
        'account:edit',
        'notification:edit',
        'treatmentStatus:edit',
        'patient:view',
        'manage:view',
        'taskMenu:view',
        'dashboard:device',
        'site:edit',
        'patient:edit'
      ],
      hasToAcceptLicenseId: null,
      iat: 1601321095,
      exp: 1601324695,
      iss: 'https://www.aspect.id'
    },
    access: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJhY2NvdW50OmVkaXQiLCJhc3NheTp2aWV3IiwiYnJvd3NlOnZpZXciLCJjYXNlOmVkaXQiLCJkYXNoYm9hcmQ6ZGV2aWNlIiwiZGFzaGJvYXJkOmludmVudG9yeSIsImRhc2hib2FyZDpyZXN1bHQiLCJkYXNoYm9hcmQ6c2l0ZSIsImRhc2hib2FyZDpzdW1tYXJ5IiwiZGFzaGJvYXJkOnRhcmdldCIsImRlbW86ZWRpdCIsImRldmljZTplZGl0IiwiZGV2aWNlQXBpS2V5OmVkaXQiLCJpbnZlbnRvcnk6ZWRpdCIsImlzc3VlOmVkaXQiLCJtYW5hZ2U6dmlldyIsIm5vdGlmaWNhdGlvbjplZGl0Iiwib3BlcmF0aW9uYWxEYXRhOnZpZXciLCJwYXRpZW50OmVkaXQiLCJwYXRpZW50OnZpZXciLCJwZXJzb246ZWRpdCIsInJlcG9ydDp2aWV3IiwicmVwb3J0ZXI6ZWRpdCIsInJlc3VsdDplZGl0Iiwicm91dGVyOnZpZXciLCJzaXRlOmVkaXQiLCJ0YXNrTWVudTp2aWV3IiwidHJlYXRtZW50U3RhdHVzOmVkaXQiXSwiZ2VvZ3JhcGh5IjpbeyJjb3VudHJ5SWQiOjYsInN0YXRlSWQiOm51bGwsImxnYUlkIjpudWxsLCJzaXRlSWQiOm51bGx9XSwiaGFzVG9BY2NlcHRMaWNlbnNlSWQiOm51bGwsImlhdCI6MTYwMTMyMTA5NSwiZXhwIjoxNjAxMzI0Njk1LCJpc3MiOiJodHRwczovL3d3dy5hc3BlY3QuaWQifQ.R1SnDPgwkAiES3aTMdgkqxBVtizsgy52C2IooOyauig',
    refresh: 'jwK1AVNzNNP3w4Eb5C+yS2DE19yjrqGWPXmhcZOUcU1p/QCqRFyNjPek9UkEgRND',
    clientId: '06140c3e-605e-47aa-92f3-fe2b495c48eb',
    culture: 'en-US',
    timezoneId: 'Eastern Standard Time',
    displayPreferences: {
      dateFormat: 'yyyy-MM-dd',
      timeFormat: 'HH:mm:ss',
      dateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
      utilizationRateThreshold: 0.8,
      errorRateThreshold: 0.05
    },
    countryAbbreviation: 'US',
    drawerOpen: false,
    loggedOutReason: '',
    countryId: '6'
  },
  deviceMaintenanceStatus: {
    loading: false,
    items: []
  }
}

jest.mock('react-redux', () => ({
  globals: {
    title: "Results",
    lastServerResponseTime: "2020-09-28T19:25:56.000Z",
    downloadStarted: false,
  },
  connect: jest.fn(),
  useHistory: jest.fn(),
  useLocation: jest.fn(),
  useDispatch: jest.fn(),
  useIntl: jest.fn(),
  useSelector: jest.fn().mockImplementation(cb => cb(mockState)),
}))

describe('Result List component', () => {
  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('should shallow render correctly when filter for assay type', () => {
    const element = shallow(
      <ResultList location={{ search: '?filters=assayType%3DTB' }} />
    )

    expect(element).toMatchSnapshot()
    expect(element.find(ExportListButton)).toHaveLength(1)
  })

  it('should shallow render correctly when filter for assay id', () => {
    const element = shallow(
      <ResultList location={{ search: '?filters=assayId%3D9' }} />
    )

    expect(element).toMatchSnapshot()
  })
})
