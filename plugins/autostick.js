const { Module } = require('../main');
const Config = require('../config');
const fs = require('fs');
const path = require('path');

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

async function convertAndSend(message) {
    if (!getStatus()) return;

    try {
        let DEFAULT_PACK = 'WETFLAX';
        let DEFAULT_AUTHOR = 'ABHIIXZ';
        let set = (Config.STICKER_DATA && Config.STICKER_DATA.includes(';')) 
            ? Config.STICKER_DATA.split(';') 
            : [DEFAULT_PACK, DEFAULT_AUTHOR];

        let mediaPath = await message.client.downloadAndSaveMediaMessage(message.data);
        if (!mediaPath) return;

        await message.client.sendMessage(
            message.jid,
            { sticker: fs.readFileSync(mediaPath) },
            { 
                quoted: message.data,
                packname: set[0] || DEFAULT_PACK,
                author: set[1] || DEFAULT_AUTHOR
            }
        );

        if (fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }
    } catch (err) {
        console.log("Auto-Sticker error:", err);
    }
}

Module({ on: 'image', fromMe: false }, convertAndSend);
Module({ on: 'image', fromMe: true }, convertAndSend);
Module({ on: 'video', fromMe: false }, convertAndSend);
Module({ on: 'video', fromMe: true }, convertAndSend);
