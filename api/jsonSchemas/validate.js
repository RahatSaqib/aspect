const Ajv = require('ajv');

module.exports = (schema, object, keywords = ["uniqueItemProperties"]) => {
  const ajv = new Ajv({ strictTypes: false });
  require("ajv-keywords")(ajv, keywords)
  const validate = ajv.compile(schema)
  return validate(object)
}
