const { downloadResultsList } = require('./download')
const { downloadResultsListV2 } = require('./downloadV2')
const { downloadResultById } = require('./downloadById')
const { downloadResultByIdV2 } = require('./downloadByIdV2')
const {
  downloadResultValidation,
  downloadResultResponseValidation,
  downloadResultValidationV2,
  downloadResultResponseValidationV2,
  addClinicalResponseParamValidation,
  addClinicalResponsePayloadValidation,
  workflowStatusParamsValidation,
  workFlowStatusPayloadValidation,
  workFlowStatusResponseValidation,
} = require('./common/validations')
const { clinicalResponse } = require('./clinicalResponse')
const { updateWorkflowStatusToFlagged } = require('./updateWorkflowStatus')
// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'GET',
    path: '/v1/results',
    handler: downloadResultsList,
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidation,
      },
    },
  },
  {
    method: 'GET',
    path: '/v2/results',
    handler: downloadResultsListV2,
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidationV2(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidationV2,
      },
    },
  },
  {
    method: 'GET',
    path: '/v3/samples',
    handler: downloadResultsListV2,
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidationV2(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidationV2,
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/results/{resultId}',
    handler: downloadResultById,
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidation,
      },
    },
  },
  {
    method: 'GET',
    path: '/v2/results/{resultId}',
    handler: downloadResultByIdV2,
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidationV2(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidationV2,
      },
    },
  },
  {
    method: 'GET',
    path: '/v3/samples/{resultId}',
    handler: downloadResultByIdV2,
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidationV2(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidationV2,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/results/clinical-responses/{resultId}',
    handler: clinicalResponse,
    config: {
      description: 'Add a result follow up',
      notes: 'Adds a treatment/outcome follow up for a result',
      auth: { scope: ['treatmentStatus:edit'] },
      validate: {
        params: addClinicalResponseParamValidation(),
        payload: addClinicalResponsePayloadValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidationV2,
      },
    },
  },
  {
    method: 'POST',
    path: '/v3/samples/clinical-responses/{resultId}',
    handler: clinicalResponse,
    config: {
      description: 'Add a result follow up',
      notes: 'Adds a treatment/outcome follow up for a result',
      auth: { scope: ['treatmentStatus:edit'] },
      validate: {
        params: addClinicalResponseParamValidation(),
        payload: addClinicalResponsePayloadValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidationV2,
      },
    },
  },
  {
    method: 'PUT',
    path: '/v1/results/flag-workflow-status/{resultId}',
    handler: updateWorkflowStatusToFlagged,
    config: {
      description: 'Update workflow status to flagged',
      notes: 'Update the status of a result',
      auth: { scope: ['result:edit'] },
      validate: {
        params: workflowStatusParamsValidation(),
        payload: workFlowStatusPayloadValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: workFlowStatusResponseValidation,
      },
    },
  },
  {
    method: 'PUT',
    path: '/v3/samples/flag-workflow-status/{resultId}',
    handler: updateWorkflowStatusToFlagged,
    config: {
      description: 'Update workflow status to flagged',
      notes: 'Update the status of a result',
      auth: { scope: ['result:edit'] },
      validate: {
        params: workflowStatusParamsValidation(),
        payload: workFlowStatusPayloadValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: workFlowStatusResponseValidation,
      },
    },
  },
]

module.exports = { routes }
