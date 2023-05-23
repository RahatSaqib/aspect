const Joi = require('@hapi/joi')

const optionalCommentsResponseValidation = Joi.object()
  .optional()
  .description('Comments schema used in Aspect Mobile')
  .keys({
    comments: Joi.array()
      .allow(null)
      .description('Entry comments')
      .items(
        Joi.object().keys({
          id: Joi.number().required().description('Entry comment ID'),
          text: Joi.string().allow(null, '').description('Comment text'),
          createdOn: Joi.date().required().description('When comment was first created'),
          createdBy: Joi.string().allow(null, '').description('Who added comment'),
          changedOn: Joi.date().required().description('When the comment was last updated'),
          changedBy: Joi.string().allow(null, '').description('Who changed comment'),
          noteType: Joi.string().allow(null, '').description('Type of comment'),
        })
      ),
  })

module.exports = { optionalCommentsResponseValidation }
