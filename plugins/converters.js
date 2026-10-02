Module(
  {
    pattern: "sticker ?(.*)",
    use: "edit",
    desc: Lang.STICKER_DESC,
  },
  async (message, match) => {
    // 1. ഡിഫോൾട്ട് വിവരങ്ങൾ സെറ്റ് ചെയ്യുന്നു
    let pack = message.senderName;
    let author = STICKER_DATA.split(";")[1] || "";

    // 2. കമാൻഡിനൊപ്പം പേര് നൽകിയിട്ടുണ്ടെങ്കിൽ അത് എടുക്കുന്നു
    if (match[1] && match[1].trim() !== "") {
      let customText = match[1].trim();
      if (customText.includes(";")) {
        let parts = customText.split(";");
        pack = parts[0].trim();
        author = parts[1].trim();
      } else {
        pack = customText;
      }
    }

    // 3. ഫോട്ടോയോ വീഡിയോയോ അല്ലാതെ വെറും ടെക്സ്റ്റ് മാത്രമാണെങ്കിൽ attp റൺ ചെയ്യുന്നു
    if (!message.reply_message && match[1] && match[1].trim() !== "") {
      var result = await attp(match[1].trim());
      var exif = {
        author: author,
        packname: pack,
        categories: STICKER_DATA.split(";")[2] || "😂",
        android: "https://github.com/souravkl11/Raganork-md/",
        ios: "https://github.com/souravkl11/Raganork-md/",
      };
      return await message.sendMessage(
        fs.readFileSync(await addExif(result, exif)),
        "sticker"
      );
    }

    if (message.reply_message === false)
      return await message.send(Lang.STICKER_NEED_REPLY);

    var exif = {
      author: author,
      packname: pack,
      categories: STICKER_DATA.split(";")[2] || "😂",
      android: "https://github.com/souravkl11/Raganork-md/",
      ios: "https://github.com/souravkl11/Raganork-md/",
    };

    // ആൽബം ഹാൻഡ്‌ലിങ്
    if (message.reply_message.album) {
      const albumData = await message.reply_message.download();
      const allFiles = [...(albumData.images || []), ...(albumData.videos || [])];
      if (allFiles.length === 0) return await message.send("_No media in album_");

      await message.send(`_Converting ${allFiles.length} stickers..._`);
      for (const file of allFiles) {
        try {
          const isVideo = albumData.videos?.includes(file);
          const stickerFile = fs.readFileSync(
            await addExif(
              await sticker(file, isVideo ? "video" : "image"),
              exif
            )
          );
          await message.sendMessage(stickerFile, "sticker", {
            quoted: message.quoted,
          });
        } catch (err) {
          console.error("Failed to convert album sticker:", err);
        }
      }
      return;
    }

    // സാധാരണ ഇമേജ് / വീഡിയോ ഡൗൺലോഡ് ചെയ്ത് നൽകിയ പേരിൽ സ്റ്റിക്കർ ആക്കുന്നു
    var savedFile = await message.reply_message.download();
    if (message.reply_message.image === true) {
      return await message.sendMessage(
        fs.readFileSync(await addExif(await sticker(savedFile), exif)),
        "sticker",
        { quoted: message.quoted }
      );
    } else {
      return await message.sendMessage(
        fs.readFileSync(await addExif(await sticker(savedFile, "video"), exif)),
        "sticker",
        { quoted: message.quoted }
      );
    }
  }
);
