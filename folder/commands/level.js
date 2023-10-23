import { client } from "#bot/client.js";
import { AttachmentBuilder } from "discord.js";
import { LEVELINCREASE_EXPERIENCE_PER_LEVEL } from "#constants/users/events.js";

class Command {
  async onChatInput(msg, interaction) {
    const canvas = await import("canvas");

    const FONT_FAMILY = "VAG World";
    await canvas.registerFont("./static/resources/fonts/VAG_World.ttf", {
      family: "VAG World",
    });

    const canv = canvas.createCanvas(900, 225);
    const ctx = canv.getContext("2d");
    const member =
      interaction.mention ??
      (interaction.params && client.users.cache.get(interaction.params)) ??
      interaction.user;
    const userData = member.data;
    const avatarURL = member.avatarURL({ extension: "png" });
    const displayName = interaction.guild
      ? interaction.guild.members.resolve(member).displayName
      : member.username;
    let expLine;
    let width;
    let gradient;

    await member.fetch();
    
    gradient = ctx.createLinearGradient(0, 225, 900, 0);
    gradient.addColorStop(0, "#777");
    gradient.addColorStop(1, "#aaa");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 225);

    ctx.save();
    ctx.fillStyle = "#080918";
    ctx.fillRect(30, 30, 840, 165);

    ctx.lineWidth = 20;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#080918";
    ctx.shadowOffsetY = 5;
    ctx.shadowOffsetX = -3;
    ctx.shadowColor = "rgba(200, 200, 215, 0.3)";
    ctx.shadowBlur = 7;

    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(880, 20);
    ctx.lineTo(880, 205);
    ctx.lineTo(20, 205);
    ctx.lineTo(20, 20);
    ctx.lineTo(880, 20);
    ctx.stroke();

    ctx.restore();
    ctx.save();

    ctx.strokeStyle = "rgba(119,119,119, 0.7)";
    ctx.beginPath();
    ctx.moveTo(195, 60);
    ctx.lineTo(195, 165);
    ctx.stroke();

    ctx.fillStyle = "#080918";
    ctx.beginPath();
    ctx.shadowColor = "#999";
    ctx.shadowBlur = 10;
    ctx.arc(110, 100, 45, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.clip();

    ctx.globalCompositeOperation = "source-in";

    const avatarBuffer = await canvas.loadImage(avatarURL);

    ctx.drawImage(avatarBuffer, 0, 0, 90, 90);
    ctx.restore();

    ctx.font = `bold 20px ${FONT_FAMILY}`;
    const { width: levelFontWidth } = ctx.measureText(
      userData.level + " уровень",
    );
    ctx.fillText(userData.level + " уровень", 110 - levelFontWidth / 2, 170);

    ctx.strokeStyle = "rgba(119,119,119, 1)";
    ctx.beginPath();
    ctx.moveTo(100, 178);
    ctx.lineTo(120, 178);
    ctx.stroke();

    ctx.restore();
    ctx.save();

    ctx.beginPath();
    ctx.font = `bold 5px "${FONT_FAMILY}", 'sans-serif'`;
    ctx.fillStyle = "#b0b4b0";
    width = {
      font: Math.min((545 / ctx.measureText(displayName).width) * 5, 180),
    };

    ctx.font = `bold ${width.font}px "${FONT_FAMILY}", "sans-serif"`;

    width.textHeight =
      ctx.measureText(displayName).actualBoundingBoxAscent +
      ctx.measureText(displayName).actualBoundingBoxDescent;

    let expCanvas = canvas.createCanvas(670, 165);
    let ctx2 = expCanvas.getContext("2d");

    ctx2.textBaseline = "middle";
    ctx2.fillStyle = "#b0b4b0";

    ctx2.font = ctx.font;
    expLine = (670 - ctx.measureText(displayName).width) / 2;

    ctx2.fillText(displayName, expLine, 60);
    ctx2.globalCompositeOperation = "source-atop";

    ctx2.fillStyle = this.getUserPreferColor(member);
    ctx2.fillRect(
      expLine,
      (120 - width.textHeight) / 2,
      (userData.exp / (userData.level * LEVELINCREASE_EXPERIENCE_PER_LEVEL)) *
        (670 - expLine * 1.8),
      width.textHeight * 1.8,
    );

    gradient = ctx.createLinearGradient(expLine, 165, 670 - expLine * 1.8, 0);
    gradient.addColorStop(0.2, "rgba(0, 0, 0, 0.5)");
    gradient.addColorStop(0.4, "rgba(0, 0, 0, 0.2)");
    gradient.addColorStop(0.8, "rgba(0, 0, 0, 0)");
    ctx2.fillStyle = gradient;
    ctx2.fillRect(
      expLine,
      (120 - width.textHeight) / 2,
      670,
      width.textHeight * 1.5,
    );

    ctx.drawImage(expCanvas, 200, 30);

    let image = canv.toBuffer("image/png");
    msg.msg({
      files: [new AttachmentBuilder(image, { name: "level.png" })],
      delete: 1_000_000,
    });
  }

  getUserPreferColor(member) {
    const value =
      member.data.profile_color ??
      member.accentColor?.toString(16).padStart(6, "0") ??
      "00cc00";

    const hex = `#${value}`;
    return hex;
  }

  options = {
    name: "level",
    id: 33,
    media: {
      description:
        "\n\nОтправляет красивое [изображние-карточку](https://media.discordapp.net/attachments/781902008973393940/784507304350580826/level.png) вашего уровня!\nСогласитесь, выглядит [неплохо](https://cdn.discordapp.com/attachments/781902008973393940/784513626413072404/level.png).\n\n[Апхчи.](https://cdn.discordapp.com/attachments/702057949031563264/786891802698711050/level.png)\n\n✏️\n```python\n!level <memb>\n```\n\n",
    },
    allias: "уровень rang rank ранг ранк lvl лвл рівень",
    allowDM: true,
    type: "user",
  };
}

export default Command;
