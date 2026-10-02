const { Module } = require('../main');
const Config = require('../config');
const fs = require('fs');
const path = require('path');

// converters.js-ൽ ഉപയോഗിക്കുന്ന അതേ ഒറിജിനൽ ഹെൽപ്പറുകൾ
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

// കമാൻഡ്: .autostick on / off
Module({
    pattern: 'autostick ?(.*)',
    fromMe: true,
    desc: 'Toggle Auto Sticker for images, videos, and GIFs'
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

// ഓട്ടോ കൺവേർഷൻ ഫംഗ്ഷൻ (converters.js-ന്റെ അതേ ഒറിജിനൽ ലോജിക്)
async function handleAutoStick(message) {
    if (!getStatus()) return;

    try {
        let DEFAULT_PACK = 'WETFLAX';
        let DEFAULT_AUTHOR = 'ABHIIXZ';
        let set = (Config.STICKER_DATA && Config.STICKER_DATA.includes(';')) 
            ? Config.STICKER_DATA.split(';') 
            : [DEFAULT_PACK, DEFAULT_AUTHOR];

        let exif = {
            categories: ['👑'],
            android: 'https://github.com/souravkl11/raganork-md',
            ios: 'https://github.com/souravkl11/raganork-md',
            packname: set[0] || DEFAULT_PACK,
            author: set[1] || DEFAULT_AUTHOR
        };

        // മീഡിയ ഡൗൺലോഡ് ചെയ്യുന്നു
        let savedFile = await message.download();
        if (!savedFile) return;

        // Raganork-ന്റെ സ്റ്റിക്കർ എൻജിൻ
        let isVideo = message.video === true;
        let convertedSticker = await sticker(savedFile, isVideo ? 'video' : 'image');
        let exifAdded = await addExif(convertedSticker, exif);

        // തിരികെ സ്റ്റിക്കർ അയക്കുന്നു
        await message.sendMessage(fs.readFileSync(exifAdded), {}, 'sticker');

        // താൽക്കാലിക ഫയലുകൾ നീക്കം ചെയ്യുന്നു
        try {
            if (fs.existsSync(savedFile)) fs.unlinkSync(savedFile);
            if (fs.existsSync(convertedSticker)) fs.unlinkSync(convertedSticker);
            if (fs.existsSync(exifAdded)) fs.unlinkSync(exifAdded);
        } catch (e) {}

    } catch (err) {
        console.log("Auto-Sticker conversion error:", err);
    }
}

// ഇമേജ്, വീഡിയോ, ജിഫ് ലിസണറുകൾ
Module({ on: 'image', fromMe: false }, handleAutoStick);
Module({ on: 'image', fromMe: true }, handleAutoStick);
Module({ on: 'video', fromMe: false }, handleAutoStick);
Module({ on: 'video', fromMe: true }, handleAutoStick);
