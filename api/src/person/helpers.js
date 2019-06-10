const Joi = require('joi')

const ok = Joi.boolean()
  .required()
  .description(
    `
    True means workflow ran well, False - some non-breakable error happened.
    If both cases - see more details in other props (i.e. "data").
    FYI - breakable error is when returning Boom.
    `
  )
// -------------------------------------------------------------------------------
const contactDetailsPayload = {
  name: Joi.string()
    .max(500)
    .required(),
  title: Joi.string()
    .max(255)
    .allow('', null),
  email: Joi.string()
    .max(500)
    .allow('', null),
  email2: Joi.string()
    .max(500)
    .allow('', null),
  phone: Joi.string()
    .max(45)
    .allow('', null),
  cell: Joi.string()
    .max(45)
    .allow('', null),
  countryId: Joi.number()
    .integer()
    .positive()
    .allow('', null),
  stateId: Joi.number()
    .integer()
    .positive()
    .allow('', null),
  lgaId: Joi.number()
    .integer()
    .positive()
    .allow('', null),
  zip: Joi.string()
    .max(45)
    .allow('', null),
  notes: Joi.string()
    .optional()
    .max(1200)
    .allow('', null),
  lastPartnerId: Joi.number()
    .integer()
    .positive()
    .allow('', null),
  canLogIn: [Joi.boolean(), Joi.number().only(0, 1)],
}
// -------------------------------------------------------------------------------
const personDetailsResponse = {
  options: {
    allowUnknown: false,
  },
  schema: Joi.object().keys({
    ok,
    data: Joi.object()
      .required()
      .description('Person details')
      .keys({
        id: Joi.number()
          .required()
          .description('Person id'),
        userId: Joi.number()
          .allow(null)
          .description('User id'),
        username: Joi.string()
          .allow(null, '')
          .description('User name'),
        name: Joi.string()
          .required()
          .description('Person name'),
        title: Joi.string()
          .allow(null, '')
          .description('Person title'),
        email: Joi.string()
          .allow(null, '')
          .description('Person email'),
        email2: Joi.string()
          .allow(null, '')
          .description('Person second email'),
        phone: Joi.string()
          .allow(null, '')
          .description('Person phone'),
        cell: Joi.string()
          .allow(null, '')
          .description('Person cell'),
        countryId: Joi.number()
          .required()
          .description('Country id'),
        geogId: Joi.number()
          .allow(null)
          .description('Person geographyId'),
        stateId: Joi.number()
          .allow(null)
          .description('State id'),
        lgaId: Joi.number()
          .allow(null)
          .description('Lga id'),
        zip: Joi.string()
          .allow(null, '')
          .description('Person zip'),
        timezone: Joi.string()
          .required()
          .description('Person timezone'),
        culture: Joi.string()
          .required()
          .description('Person culture'),
        notes: Joi.string()
          .allow(null, '')
          .description('Person notes'),
        lastPartnerId: Joi.number()
          .allow(null)
          .description('Person lastPartnerId'),
        hidePatientId: Joi.number()
          .allow(null)
          .description('Person hidePatientId'),
        hideSampleId: Joi.number()
          .allow(null)
          .description('Person hideSampleId'),
        hideNotes: Joi.string()
          .allow(null, '')
          .description('Person hideNotes'),
        country: Joi.string()
          .allow(null, '')
          .description('Country name'),
        stateName: Joi.string()
          .allow(null, '')
          .description('State name'),
        lgaName: Joi.string()
          .allow(null, '')
          .description('Lga name'),
        userLockedOut: [
          // User lockedOut
          Joi.boolean().allow(null),
          Joi.number()
            .only(0, 1)
            .allow(null),
        ],
        canLogIn: Joi.number()
          .allow(null)
          .description('Person canLogIn'),
        jobId: Joi.number()
          .allow(null)
          .description('Id of first Job'),
        jobFunctions: Joi.array()
          .items(Joi.number())
          .allow(null)
          .description('Array of jobFunctionId'),
        partnerId: Joi.number()
          .allow(null)
          .description('partnerId of first jobFunction'),
      }),
  }),
}

module.exports = {
  contactDetailsPayload,
  personDetailsResponse,
}
