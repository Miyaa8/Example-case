const con = require('./connect')
const {
    Mimetype,
    MessageType
} = require('@adiwajshing/baileys')
const fs = require('fs')
const axios = require('axios')

const wa = con.Whatsapp

exports.getBuffer = async (url, options) => {
	try {
		options ? options : {}
		const res = await axios({
			method: "get",
			url,
			headers: {
				'DNT': 1,
				'Upgrade-Insecure-Request': 1
			},
			...options,
			responseType: 'arraybuffer'
		})
		return res.data
	} catch (e) {
		console.log(`Error : ${e}`)
	}
}

exports.getGroupAdmins = async(participants) => {
    admins = []
    for (let i of participants) {
        i.isAdmin ? admins.push(i.jid) : ''
    }
    return admins
}

exports.serialize = function(chat) {
    m = JSON.parse(JSON.stringify(chat)).messages[0]
    content = m.message
    m.isGroup = m.key.remoteJid.endsWith('@g.us')
    m.from = m.key.remoteJid
    try{
        const tipe = Object.keys(content)[0]
        m.type = tipe
    } catch {
        m.type = null
    }

    try {
        const quote = m.message.extendedTextMessage.contextInfo
        if (quote.quotedMessage === null || quote.quotedMessage === undefined) {
            m.quoted = null;
        } else {
            let tempM = {
                id: '',
                sender: '',
                message: ''
            }
            let newM = {
                id: quote.stanzaId,
                sender: quote.participant,
                message: quote.quotedMessage
            }
            Object.assign(tempM, newM)
            m.quoted = tempM
        }
    } catch {
        m.quoted = null
    }

    try {
        const mention = m.message[m.type].contextInfo.mentionedJid
        m.mentionedJid = mention
    } catch {
        m.mentionedJid = null
    }

    if(m.isGroup) {
        if (m.participant === wa.user.jid) {
            let tempS = {
                jid: wa.user.jid,
                name: wa.user.name
            }
            m.sender = tempS
        }
        let contact = wa.contacts[m.participant]
        m.sender = contact
    } else {
        if (m.key.remoteJid === wa.user.jid) {
            let tempS = {
                jid: wa.user.jid,
                name: wa.user.name
            }
            m.sender = tempS
        }
        let contact = wa.contacts[m.key.remoteJid]
        m.sender = contact
    }

    if (m.key.fromMe) {
        let tempS = {
            jid: wa.user.jid,
            name: wa.user.name || wa.user.vname || wa.user.verify
        }
        m.sender = tempS
    }

    if (m.type == 'ephemeralMessage') {
        m.isEphemeral = true
    } else {
        m.isEphemeral = false
    }

    const txt = (m.type === 'conversation' && m.message.conversation) ? m.message.conversation 
    : (m.type == 'imageMessage') && m.message.imageMessage.caption ? m.message.imageMessage.caption 
    : (m.type == 'videoMessage') && m.message.videoMessage.caption ? m.message.videoMessage.caption 
    : (m.type == 'extendedTextMessage') && m.message.extendedTextMessage.text ? m.message.extendedTextMessage.text : ''
    m.body = txt

    if (m.isEphemeral) {
        m.message = m.message.ephemeralMessage.message
        content2 = m.message
        const tip2 = Object.keys(content2)[0]
        const text = (tip2 === 'extendedTextMessage' && content2.extendedTextMessage.text) ? content2.extendedTextMessage.text 
        : (tip2 == 'imageMessage') && content2.imageMessage.caption ? content2.imageMessage.caption 
        : (tip2 == 'videoMessage') && content2.videoMessage.caption ? content2.videoMessage.caption : ''
        m.body = text

        try {
            const mens = m.message[tip2].contextInfo.mentionedJid
            m.mentionedJid = mens
        } catch {
            m.mentionedJid = null
        }

        try {
            const quote = m.message.extendedTextMessage.contextInfo
            if (quote.quotedMessage === null || quote.quotedMessage === undefined) {
                m.quoted = null;
            } else {
                let tempM = {
                    id: '',
                    sender: '',
                    ephemeralMessage: ''
                }
                let newM = {
                    id: quote.stanzaId,
                    sender: quote.participant,
                    ephemeralMessage: {
                        message: quote.quotedMessage
                    }
                }
                Object.assign(tempM, newM)
                m.quoted = tempM
            }
        } catch {
            m.quoted = null
        }
    }
    return m
}

exports.reply = function(jid, text, quoted) {
    wa.sendMessage(jid, text, MessageType.text, { quoted: quoted })
}

exports.sendText = function(jid, text) {
    wa.sendMessage(jid, text, MessageType.text)
}

exports.custom = function(jid, text, Messagetype, options={}) {
    wa.sendMessage(jid, text, Messagetype, options)
}

exports.image = function(jid, data, options={}) {
    if (typeof data === 'string') {
        wa.sendMessage(jid, fs.readFileSync(data), MessageType.image, options)
    } else {
        wa.sendMessage(jid, data, MessageType.image, options)
    }
}

exports.sticker = function(jid, data, options={}) {
    if (typeof data === 'string') {
        wa.sendMessage(jid, fs.readFileSync(data), MessageType.sticker, options)
    } else {
        wa.sendMessage(jid, data, MessageType.sticker, options)
    }
}