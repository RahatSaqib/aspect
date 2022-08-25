const graphItemsApiParamsSchemaId = '#/properties/graphType/items/properties/api/items/properties/params/items'
const graphItemsApiParamsSchema = {
  $id: graphItemsApiParamsSchemaId,
  type: 'object',
  required: ['groupBy', 'minDate', 'maxDate'],
  properties: {
    groupBy: {
      $id: `${graphItemsApiParamsSchemaId}/properties/groupBy`,
      type: 'array',
    },
    minDate: {
      $id: `${graphItemsApiParamsSchemaId}/properties/minDate`,
      type: 'string',
    },
    maxDate: {
      $id: `${graphItemsApiParamsSchemaId}/properties/maxDate`,
      type: 'string',
    },
  },
}

const graphItemsApiSchemaId = '#/properties/graphType/items/properties/api/items'
const graphItemsApiSchema = {
  $id: graphItemsApiSchemaId,
  type: 'object',
  required: ['endpoint', 'params'],
  properties: {
    endpoint: {
      $id: `${graphItemsApiSchemaId}/properties/endpoint`,
      type: 'string',
    },
    params: {
      $id: `${graphItemsApiSchemaId}/properties/params`,
      type: ['array', 'object'],
      anyOf: [{ type: 'array' }, { type: 'object' }],
      items: graphItemsApiParamsSchema,
    },
  },
}

const graphItemsSchemaId = '#/properties/graphType/items'
const graphItemsSchema = {
  $id: graphItemsSchemaId,
  type: 'object',
  required: [
    'id',
    'type',
    'size',
    'component',
    'componentClasses',
    'api',
    'indexBy',
    'keyToConsume',
    'displayMethod',
    'formatDate',
  ],
  properties: {
    id: {
      $id: `${graphItemsSchemaId}/properties/id`,
      type: 'string',
    },
    title: {
      $id: `${graphItemsSchemaId}/properties/title`,
      type: 'string',
    },
    type: {
      $id: `${graphItemsSchemaId}/properties/type`,
      type: 'string',
      enum: [
        'bar',
        'stacked',
        'divergent',
        'pie',
        'pieRow',
        'pieLegacyTreatment',
        'calendar',
        'barLegacyTreatment',
        'stackedDeviceActivity',
        'barInventory',
        'line-trends',
        'bar-line',
      ],
    },
    size: {
      $id: `${graphItemsSchemaId}/properties/size`,
      type: 'integer',
    },
    component: {
      $id: `${graphItemsSchemaId}/properties/component`,
      instanceof: 'Function',
    },
    componentClasses: {
      $id: `${graphItemsSchemaId}/properties/componentClasses`,
      type: 'array',
    },
    api: {
      $id: `${graphItemsSchemaId}/properties/api`,
      type: ['array', 'object'],
      anyOf: [{ type: 'array' }, { type: 'object' }],
      items: graphItemsApiSchema,
    },
    indexBy: {
      $id: `${graphItemsSchemaId}/properties/indexBy`,
      type: 'string',
    },
    keyToConsume: {
      $id: `${graphItemsSchemaId}/properties/keyToConsume`,
      type: 'string',
    },
    tickValuesYShape: {
      $id: `${graphItemsSchemaId}/properties/tickValuesYShape`,
      type: 'string',
      enum: ['bookends', 'clubsandwich', 'all', 'none', 'twos'],
    },
    tickValuesXShape: {
      $id: `${graphItemsSchemaId}/properties/tickValuesXShape`,
      type: 'string',
      enum: ['bookends', 'all', 'none'],
    },
    displayMethod: {
      $id: `${graphItemsSchemaId}/properties/displayMethod`,
      type: 'string',
      enum: ['percentage', 'actual'],
    },
    displayLegend: {
      $id: `${graphItemsSchemaId}/properties/displayLegend`,
      type: 'boolean',
    },
    formatDate: {
      $id: `${graphItemsSchemaId}/properties/formatDate`,
      anyOf: [{ type: 'string' }, { instanceof: 'Function' }],
    },
  },
}

const graphSchema = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'http://aspect.id/graphSchema.json',
  type: 'object',
  readOnly: true,
  title: 'Schema for validating graph configs',
  properties: {
    id: { $id: '#/properties/id', type: 'string' },
    componentSize: {
      $id: '#/properties/componentSize',
      type: 'string',
      enum: ['full', 'half'],
    },
    group: { $id: '#/properties/group', type: 'string' },
    assays: { $id: '#/properties/assays', type: 'array' },
    graphRenderPermissions: {
      $id: '#/properties/graphRenderPermissions',
      type: 'array',
    },
    graphType: {
      $id: '#/properties/graphType',
      type: ['array', 'object'],
      anyOf: [{ type: 'array' }, { type: 'object' }],
      items: graphItemsSchema,
    },
  },
  required: ['id', 'componentSize', 'group', 'assays', 'graphType'],
}

export default graphSchema
