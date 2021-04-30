const Ajv = require('ajv');

module.exports = (schema, object) => {
  const ajv = new Ajv({ strictTypes: false });
  require("ajv-keywords")(ajv, ["uniqueItemProperties"])
  const validate = ajv.compile(schema)
  return validate(object)
}
