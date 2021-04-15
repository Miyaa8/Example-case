const clc = require('chalk')

exports.color = (text, color) => {
    return !color ? clc.green(text) : clc.keyword(color)(text)
}

exports.getRandom = (ext) => {
    return `${Date.now()}${ext}`
}