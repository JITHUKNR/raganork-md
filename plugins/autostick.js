const { Module } = require('../main');
const Config = require('../config');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const STATUS_FILE = path.join(__dirname, '../autostick_status.json');

function getStatus() {
    try {
        if (!fs.existsSync(STATUS_FILE)) return false;
        let data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
        return data.enabled === true;
    } catch (e) {
        return false;
    }
}

function setStatus(bool) {
    try {
        fs.writeFileSync(STATUS_FILE, JSON.stringify({ enabled: bool }), 'utf8');
    } catch (e) {}
}

// 1. ഓൺ/ഓഫ് ചെയ്യാനുള്ള കമാൻഡ്
Module({
    pattern: 'autostick ?(.*)',
    fromMe: true,
    desc: 'Toggle Auto Sticker for images, videos, and GIFs'
}, async (message, match) => {
    let opt = match[1] ? match[1].toLowerCase().trim() : '';

    if (opt === 'on') {
        setStatus(true);
        return await message.client.sendMessage(message.jid, { text: '_Auto Sticker has been ENABLED! (Images, Videos & GIFs will convert automatically)_' }, { quoted: message.data });
    } else if (opt === 'off') {
        setStatus(false);
        return await message.client.sendMessage(message.jid, { text: '_Auto Sticker has been DISABLED!_' }, { quoted: message.data });
    } else {
        let current = getStatus() ? 'ENABLED ✅' : 'DISABLED ❌';
        return await message.client.sendMessage(message.jid, { 
            text: `*Auto Sticker Menu*\n\nCurrent Status: *${current}*\n\n• *.autostick on* - To enable\n• *.autostick off* - To disable` 
        }, { quoted: message.data });
    }
});

// 2. ഇമേജ്, വീഡിയോ, ജിഫ് കൺവേർഷൻ ലോജിക്
async function convertAndSend(message) {
    if (!getStatus()) return;

    try {
        let DEFAULT_PACK = 'WETFLAX';
        let DEFAULT_AUTHOR = 'ABHIIXZ';
        let set = (Config.STICKER_DATA && Config.STICKER_DATA.includes(';')) 
            ? Config.STICKER_DATA.split(';') 
            : [DEFAULT_PACK, DEFAULT_AUTHOR];

        let msg = message.data.message;
        let type = Object.keys(msg)[0];
        if (type === 'ephemeralMessage') {
            msg = msg.ephemeralMessage.message;
            type = Object.keys(msg)[0];
        }

        let mediaMsg = msg.imageMessage || msg.videoMessage;
        if (!mediaMsg) return;

        let isVideo = !!msg.videoMessage;
        let mediaType = isVideo ? 'video' : 'image';
        let stream = await downloadContentFromMessage(mediaMsg, mediaType);
        
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        let tempInput = path.join('/tmp', `input_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`);
        let tempOutput = path.join('/tmp', `sticker_${Date.now()}.webp`);
        fs.writeFileSync(tempInput, buffer);

        let command = ffmpeg(tempInput)
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000'
            ]);

        if (isVideo) {
            command.outputOptions([
                '-loop', '0',
                '-ss', '00:00:00',
                '-t', '00:00:05',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
                '-s', '512:512'
            ]);
        }

        command.save(tempOutput).on('end', async () => {
            try {
                let stickerBuffer = fs.readFileSync(tempOutput);
                await message.client.sendMessage(
                    message.jid,
                    { sticker: stickerBuffer },
                    { 
                        quoted: message.data,
                        packname: set[0] || DEFAULT_PACK,
                        author: set[1] || DEFAULT_AUTHOR
                    }
                );
            } catch (sendErr) {
                console.log("Send sticker error:", sendErr);
            } finally {
                if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
            }
        }).on('error', (ffmpegErr) => {
            console.log("FFmpeg conversion error:", ffmpegErr);
            if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        });

    } catch (err) {
        console.log("Auto-Sticker execution error:", err);
    }
}

Module({ on: 'image', fromMe: false }, convertAndSend);
Module({ on: 'image', fromMe: true }, convertAndSend);
Module({ on: 'video', fromMe: false }, convertAndSend);
Module({ on: 'video', fromMe: true }, convertAndSend);
