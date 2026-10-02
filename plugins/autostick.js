const { Module } = require('../main');
const fs = require('fs');
const path = require('path');
const { sticker, addExif } = require('./_afx');

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

Module({
    pattern: 'autostick ?(.*)',
    fromMe: true,
    desc: 'Toggle Auto Sticker'
}, async (message, match) => {
    let opt = match[1] ? match[1].toLowerCase().trim() : '';

    if (opt === 'on') {
        setStatus(true);
        return await message.sendReply('_Auto Sticker has been ENABLED!_');
    } else if (opt === 'off') {
        setStatus(false);
        return await message.sendReply('_Auto Sticker has been DISABLED!_');
    } else {
        let current = getStatus() ? 'ENABLED ✅' : 'DISABLED ❌';
        return await message.sendReply(`*Auto Sticker Status:* ${current}\n\n• *.autostick on*\n• *.autostick off*`);
    }
});

Module({
    on: 'text',
    fromMe: false
}, async (message) => {
    if (!getStatus()) return;
    
    // ഫോട്ടോയോ വീഡിയോയോ ആണോ എന്ന് നോക്കുന്നു
    let isMedia = message.image || message.video;
    if (!isMedia) return;

    try {
        let exif = {
            categories: ['👑'],
            android: 'https://github.com/souravkl11/raganork-md',
            ios: 'https://github.com/souravkl11/raganork-md',
            packname: 'WETFLAX',
            author: 'ABHIIXZ🥵🤍'
        };

        let mediaFile = await message.download();
        if (!mediaFile) return;

        let stick = await sticker(mediaFile, message.video ? 'video' : 'image');
        let finalSticker = await addExif(stick, exif);

        await message.sendMessage(fs.readFileSync(finalSticker), {}, 'sticker');

        if (fs.existsSync(mediaFile)) fs.unlinkSync(mediaFile);
        if (fs.existsSync(stick)) fs.unlinkSync(stick);
        if (fs.existsSync(finalSticker)) fs.unlinkSync(finalSticker);
    } catch (err) {
        console.log("Auto-sticker error:", err);
    }
});
