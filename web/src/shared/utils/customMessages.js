import Immutable from 'immutable'

export function getCustomMessage(intl, messages, key, user, params) {
    const { countryAbbreviation } = user

    let message = messages[`${key}_${countryAbbreviation}`] //default Key can be 'state' or 'lga', in this case

    if (!message) {
        message = messages[`${key}`] //if there's not a specific country for the provided key, we will try to get the default message
    }

    if (!message) {
        console.error(`No message was found for the specificed key: ${key}`)
        return ''
    }

    if (params) {
        const [...keys] = Immutable.fromJS(params).keys()
        keys.map(key => {
            params[key] = getCustomMessage(intl, messages, params[key], user)
        })
    }

    return intl.formatMessage(message, params)
}