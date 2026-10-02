const { Module } = require('../main');
const fs = require('fs');
const path = require('path');

// ഒറിജിനൽ Raganork സ്റ്റിക്കർ മൊഡ്യൂളുകൾ
let afx;
try {
    afx = require('./_afx');
} catch (e) {
    try {
        afx = require('./_battle');
    } catch (err) {
        afx = require('../core/_afx');
    }
}
const { sticker, addExif } = afx;

// ഇവിടെ നിങ്ങളുടെ ഇഷ്ടാനുസൃത പേരുകൾ നൽകിയിരിക്കുന്നു
const PACK_NAME = 'WETFLAX';
const AUTHOR_NAME = 'ABHIIXZ🥵🤍';

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

// ഓൺ / ഓഫ് കമാൻഡ്
Module({
    pattern: 'autostick ?(.*)',
    fromMe: true,
    desc: 'Toggle Auto Sticker'
}, async (message, match) => {
    let opt = match[1] ? match[1].toLowerCase().trim() : '';

    if (opt === 'on') {
        setStatus(true);
        return await message.client.sendMessage(
            message.jid, 
            { text: '_Auto Sticker has been ENABLED! (Images, Videos & GIFs will convert automatically)_' }, 
            { quoted: message.data }
        );
    } else if (opt === 'off') {
        setStatus(false);
        return await message.client.sendMessage(
            message.jid, 
            { text: '_Auto Sticker has been DISABLED!_' }, 
            { quoted: message.data }
        );
    } else {
        let current = getStatus() ? 'ENABLED ✅' : 'DISABLED ❌';
        return await message.client.sendMessage(
            message.jid, 
            { 
                text: `*Auto Sticker Menu*\n\nCurrent Status: *${current}*\n\n• *.autostick on* - To enable\n• *.autostick off* - To disable` 
            }, 
            { quoted: message.data }
        );
    }
});

// ഓട്ടോ കൺവേർഷൻ
async function handleAutoStick(message) {
    if (!getStatus()) return;

    try {
        let exif = {
            categories: ['👑'],
            android: 'https://github.com/souravkl11/raganork-md',
            ios: 'https://github.com/souravkl11/raganork-md',
            packname: PACK_NAME,
            author: AUTHOR_NAME
        };

        let savedFile = await message.download();
        if (!savedFile) return;

        let isVideo = message.video === true;
        let convertedSticker = await sticker(savedFile, isVideo ? 'video' : 'image');
        let exifAdded = await addExif(convertedSticker, exif);

        await message.sendMessage(fs.readFileSync(exifAdded), {}, 'sticker');

        try {
            if (fs.existsSync(savedFile)) fs.unlinkSync(savedFile);
            if (fs.existsSync(convertedSticker)) fs.unlinkSync(convertedSticker);
            if (fs.existsSync(exifAdded)) fs.unlinkSync(exifAdded);
        } catch (e) {}

    } catch (err) {
        console.log("Auto-Sticker error:", err);
    }
}

// മീഡിയ ലിസണറുകൾ
Module({ on: 'image', fromMe: false }, handleAutoStick);
Module({ on: 'image', fromMe: true }, handleAutoStick);
Module({ on: 'video', fromMe: false }, handleAutoStick);
Module({ on: 'video', fromMe: true }, handleAutoStick);
