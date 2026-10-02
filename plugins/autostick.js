const { Module } = require('../main');
const Config = require('../config');

const DEFAULT_PACK = 'WETFLAX';
const DEFAULT_AUTHOR = 'ABHIIXZ';

Module({
    on: 'image',
    fromMe: false
}, async (m, match) => {
    try {
        let set = (Config.STICKER_DATA && Config.STICKER_DATA.includes(';')) 
            ? Config.STICKER_DATA.split(';') 
            : [DEFAULT_PACK, DEFAULT_AUTHOR];

        let media = await m.download();
        await m.client.sendMessage(
            m.jid, 
            { sticker: media }, 
            { 
                quoted: m.data,
                packname: set[0] || DEFAULT_PACK,
                author: set[1] || DEFAULT_AUTHOR
            }
        );
    } catch (e) {
        console.log("Auto-sticker error:", e);
    }
});

Module({
    on: 'image',
    fromMe: true
}, async (m, match) => {
    try {
        let set = (Config.STICKER_DATA && Config.STICKER_DATA.includes(';')) 
            ? Config.STICKER_DATA.split(';') 
            : [DEFAULT_PACK, DEFAULT_AUTHOR];

        let media = await m.download();
        await m.client.sendMessage(
            m.jid, 
            { sticker: media }, 
            { 
                quoted: m.data,
                packname: set[0] || DEFAULT_PACK,
                author: set[1] || DEFAULT_AUTHOR
            }
        );
    } catch (e) {
        console.log("Auto-sticker fromMe error:", e);
    }
});
