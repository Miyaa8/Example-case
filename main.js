/**
 * Originaly script by faiz
 * Recode by mega
 * Belum selesai
 */

const con = require('./core/connect')
const wa = require('./core/helper')
const {
    MessageType
} = require('@adiwajshing/baileys')
const {
    getRandom,
    color
} = require('./utils')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const axios = require('axios')
const moment = require('moment-timezone')
const getBuffer = wa.getBuffer
const ev = con.Whatsapp

const prefix = '!'
const apikey = 'LindowApi' // Get in lindow-api.herokuapp.com

con.connect()

function printLog(isCmd, sender, groupName, isGroup) {
    const time = moment.tz('Asia/Jakarta').format('DD/MM/YY HH:mm:ss')
    if (isCmd && isGroup) { return console.log(color(`[${time}]`, 'yellow'), color('[EXEC]', 'aqua'), color(`${sender.split('@')[0]}`, 'lime'), 'in', color(`${groupName}`, 'lime')) }
    if (isCmd && !isGroup) { return console.log(color(`[${time}]`, 'yellow'), color('[EXEC]', 'aqua'), color(`${sender.split('@')[0]}`, 'lime')) }
}

ev.on('chat-update', async (msg) => {
    try {
        if (!msg.hasNewMessage) return;
        msg = wa.serialize(msg)
        if (!msg.message) return;
        if (msg.key && msg.key.remoteJid === 'status@broadcast') return;
        if (msg.key.fromMe) return;
        const { from, sender, isGroup, isEphemeral, quoted, mentionedJid, type } = msg
        let { body } = msg
        let { name, vname, notify, verify , jid } = sender
        pushname = name || vname || notify || verify
        body = (type === 'conversation' && body.startsWith(prefix)) ? body : (((type === 'imageMessage' || type === 'videoMessage') && body) && body.startsWith(prefix)) ? body : ((type === 'ephemeralMessage') && body.startsWith(prefix)) ? body : ((type === 'extendedTextMessage') && body.startsWith(prefix)) ? body : ''
        const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
        const arg = body.substring(body.indexOf(' ') + 1)
        const args = body.trim().split(/ +/).slice(1)
        const isCmd = body.startsWith(prefix)

        const groupMetadata = isGroup ? await ev.groupMetadata(from) : ''
        const groupSubject = isGroup ? groupMetadata.subject : ''
        const groupMembers = isGroup ? groupMetadata.participants : ''
        const groupAdmins = isGroup ? await wa.getGroupAdmins(groupMembers) : []
        const isAdmin = groupAdmins.includes(sender) || false
        const content = JSON.stringify(msg.quoted)
        const isMedia = (type === 'imageMessage' || type === 'videoMessage')
        const isQStick = type === 'extendedTextMessage' && content.includes('stickerMessage')
        const isQImg = type === 'extendedTextMessage' && content.includes('imageMessage')
        const isQVid = type === 'extendedTextMessage' && content.includes('videoMessage')

        printLog(isCmd, jid, groupSubject, isGroup)

        switch (command) {
            case 'help':
                wa.reply(from, `Halo ${pushname}
                
Available Feature
                
1. *${prefix}sticker*
2. *${prefix}revoke*
3. *${prefix}pinterest*
4. *${prefix}ayatkursi*
5. *${prefix}kisahnabi*
6. *${prefix}quoteislam*
7. *${prefix}scdl*
8. *${prefix}ppcouple*`, msg)
                break
            case 'ppcouple':
                getres = await axios.get(`https://lindow-api.herokuapp.com/api/ppcouple?apikey=${apikey}`)
                var { male, female } = getres.data.result
                picmale = await getBuffer(`${male}`)
                ev.sendMessage(from, picmale, MessageType.image)
                picfemale = await getBuffer(`${female}`)
                ev.sendMessage(from, picfemale, MessageType.image)
                break
            case 'scdl':
                var url = body.slice(6)
                var res = await axios.get(`https://lindow-api.herokuapp.com/api/dlsoundcloud?url=${url}&apikey=${apikey}`)
                var { title, result } = res.data
                thumbb = await getBuffer(`${res.data.image}`)
                ev.sendMessage(from, thumbb, MessageType.image, {caption: `${title}`})
                audiony = await getBuffer(result)
                ev.sendMessage(from, audiony, MessageType.audio, {mimetype: 'audio/mp4', filename: `${title}.mp3`, quoted: msg})
                break
            case 'quoteislam':
                quote = await axios.get(`https://lindow-api.herokuapp.com/api/randomquote/muslim?apikey=${apikey}`)
                wa.reply(from, `${quote.data.result.text_id}`, msg)
                break
            case 'kisahnabi':
              try {
                nama = body.slice(11)
                getres = await axios.get(`https://lindow-api.herokuapp.com/api/kisahnabi?nabi=${nama}&apikey=${apikey}`)
                var { nabi, lahir, umur, tempat, kisah } = getres.data.result.nabi
                caption = `Kisah Nabi\n\nNama nabi : ${nabi}\n\nLahir pada : ${lahir}\n\nUmur : ${umur}\n\nTempat : ${tempat}\n\nKisah :\n\n${kisah}`
                foto = await getBuffer(getres.data.result.nabi.image)
                ev.sendMessage(from, foto, MessageType.image, {caption: caption})
              } catch (e) {
                wa.reply(from, 'Data tidak ditemukan! silakan pakai query lain', msg)
              }
              break
            case 'ayatkursi':
                res = await axios.get(`https://lindow-api.herokuapp.com/api/muslim/ayatkursi?apikey=${apikey}`)
                var { tafsir, arabic, latin } = res.data.result.data
                wa.reply(from, `Tafsir : ${tafsir}\n\nArabic : ${arabic}\n\nLatin : ${latin}`, msg)
                break
            case 'pinterest':
              try {
                getBuffer(`https://lindow-api.herokuapp.com/api/pinterest?search=${body.slice(11)}&apikey=${apikey}`).then((result) => {
                ev.sendMessage(from, result, MessageType.image)
                })
              } catch (e) {
                wa.reply(from, 'Error! silakan gunakan query lain', msg)
              }
              break
            case 'revoke':
              if (!isGroup) return wa.reply(from, 'This command only for group')
              if (!isAdmin) return wa.reply(from, 'This feature only for admin', msg)
                ev.revokeInvite(from)
              wa.reply(from, 'succes', msg)
                break
            case 'stiker':
		     	  case 's':
			     	case 'sticker':
			    	case 'stickergif':
			    	case 'stikergif':
		   			if ((isMedia && !msg.message.videoMessage || isQImg) && args.length == 0) {
						const encmedia = isQImg ? JSON.parse(JSON.stringify(msg).replace('quotedM','m')).message.extendedTextMessage.contextInfo : msg
						const media = await ev.downloadAndSaveMediaMessage(encmedia)
						ran = getRandom('.webp')
						await ffmpeg(`./${media}`)
							.input(media)
							.on('start', function (cmd) {
								console.log(`Started : ${cmd}`)
							})
							.on('error', function (err) {
								console.log(`Error : ${err}`)
								fs.unlinkSync(media)
								wa.reply(from, 'error', msg)
							})
							.on('end', function () {
								console.log('Finish')
								ev.sendMessage(from, fs.readFileSync(ran), MessageType.sticker, {quoted: msg})
								fs.unlinkSync(media)
								fs.unlinkSync(ran)
							})
							.addOutputOptions([`-vcodec`,`libwebp`,`-vf`,`scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`])
							.toFormat('webp')
							.save(ran)
						} else if ((isMedia && msg.message.videoMessage || isQVid && msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage) && args.length == 0) {
						const encmedia = isQVid ? JSON.parse(JSON.stringify(msg).replace('quotedM','m')).message.extendedTextMessage.contextInfo : msg
						const media = await ev.downloadAndSaveMediaMessage(encmedia)
						if (Buffer.byteLength(media) >= 6186598.4) return wa.reply(from, `sizenya terlalu gede sayang, dd gakuat :(`, msg)
						ran = getRandom('.webp')
						await ffmpeg(`./${media}`)
							.inputFormat(media.split('.')[1])
							.on('start', function (cmd) {
								console.log(`Started : ${cmd}`)
							})
							.on('error', function (err) {
								console.log(`Error : ${err}`)
								fs.unlinkSync(media)
								tipe = media.endsWith('.mp4') ? 'video' : 'gif'
								ev.sendMessage(from, `Gagal, video nya kebesaran, dd gakuat`, MessageType.text)
							})
							.on('end', function () {
								console.log('Finish')
								buff = fs.readFileSync(ran)
								ev.sendMessage(from, buff, MessageType.sticker, {quoted: msg})
								fs.unlinkSync(media)
								fs.unlinkSync(ran)
							})
							.addOutputOptions([`-vcodec`,`libwebp`,`-vf`,`scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`])
							.toFormat('webp')
							.save(ran)
						}
						break
        }
    } catch(e) {
        console.log(`Error: ${e}`)
    }
})
