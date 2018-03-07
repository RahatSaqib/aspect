const _ = require('lodash')
const Boom = require('boom')
const { knex } = require('../db')
const {
  canView,
  canEdit,
  getConstraints,
  addConstraints,
} = require('../auth/constraints')

const SELECT_LIST_FIELDS = ['t.id', 't.title', 't.partnerId']

async function listTags(request) {
  const { auth, params: { tagType } } = request
  if (!canView(auth, `${tagType}:`)) {
    return { ok: true, data: [] }
  }
  const data = await getTags(auth, tagType)
  return { ok: true, data }
}

async function getTags(auth, tagType) {
  const dataConstraints = await getConstraints(auth.credentials)
  const tableName = tagTableName(tagType)

  const refQuery = knex(tableName).distinct('tagId')
  const data = await knex('Tag as t')
    .join('Partner as p', 't.partnerId', 'p.id')
    .whereIn('t.id', refQuery)
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .select(SELECT_LIST_FIELDS)

  return data
}

async function listTagsByType(request) {
  const { auth, params: { id, tagType } } = request
  if (!canView(auth, `${tagType}:`)) {
    return { ok: true, data: [] }
  }
  const data = await getTagsById(auth, id, tagType)
  return { ok: true, data }
}

async function getTagsById(auth, id, tagType) {
  const tableName = tagTableName(tagType)
  const idName = `${tagType}Id`
  const dataConstraints = await getConstraints(auth.credentials)

  const data = await knex('Tag as t')
    .join('Partner as p', 't.partnerId', 'p.id')
    .join(`${tableName} as rt`, 't.id', 'rt.tagId')
    .andWhere(`rt.${idName}`, id)
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .select(SELECT_LIST_FIELDS)

  return data
}

async function getAllTags(auth) {
  const dataConstraints = await getConstraints(auth.credentials)

  const data = await knex('Tag as t')
    .join('Partner as p', 't.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .select(SELECT_LIST_FIELDS)

  return data
}

// case-insensitive search
function includesIgnoreCase(collection, value) {
  return _.some(collection, item => item.toLowerCase() === value.toLowerCase())
}

async function updateTag(request) {
  const { auth, params: { id, tagType }, payload: { tags } } = request

  if (!canEdit(auth, `${tagType}:`)) {
    return Boom.forbidden(
      `You are not permitted to update tags to this ${tagType}`
    )
  }

  const tableName = tagTableName(tagType)
  const idName = `${tagType}Id`
  const dataConstraints = await getConstraints(auth.credentials)

  const oldTags = _.map(await getTagsById(auth, id, tagType), 'title')
  const allTagsByTitle = _.keyBy(await getAllTags(auth), tag =>
    tag.title.toLowerCase()
  )

  const newTags = _.split(tags, ',')

  const tagsToBeDeleted = _.filter(
    oldTags,
    tag => !includesIgnoreCase(newTags, tag)
  )
  const tagsToBeAdded = _.filter(
    newTags,
    tag => !includesIgnoreCase(oldTags, tag)
  )

  await Promise.all(
    _.map(tagsToBeAdded, async tag => {
      if (!_.isEmpty(tag)) {
        const existingTags = allTagsByTitle[tag.toLowerCase()]
        const [tagId] = existingTags
          ? [existingTags.id]
          : await knex('Tag').insert({
              title: tag,
              partnerId: dataConstraints.partner.id,
            })
        await knex(tableName).insert({
          [idName]: id,
          tagId,
        })
      }
    })
  )

  await Promise.all(
    _.map(tagsToBeDeleted, async tag => {
      const { id: tagId } = allTagsByTitle[tag.toLowerCase()]
      await knex(tableName)
        .where({ [idName]: id, tagId })
        .delete()
    })
  )

  return {
    ok: true,
    data: await getTagsById(auth, id, tagType),
  }
}

function tagTableName(tagType) {
  return `${tagType.charAt(0).toUpperCase()}${tagType.slice(1)}Tag`
}

module.exports = {
  listTags,
  listTagsByType,
  updateTag,
}
