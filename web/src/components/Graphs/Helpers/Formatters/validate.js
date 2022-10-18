import Ajv from 'ajv'
import graphSchema from '../Schemas/graphSchema'

const validateGraphConfig = config => {
  return new Promise((res, rej) => {
    const ajv = new Ajv({ allowUnionTypes: true })
    const { id } = config
    const CLASSES = { Function }

    ajv.addKeyword({
      keyword: 'instanceof',
      compile: schema => data => data instanceof CLASSES[schema],
    })

    return ajv.validate(graphSchema, config)
      ? res(true)
      : rej(console.error(`Graph config error for ${id}: ${ajv.errorsText()}`))
  })
}

export default validateGraphConfig
