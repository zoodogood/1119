import { BaseCommand } from "#lib/BaseCommand.js";
import { client } from "#bot/client.js";
import { AttachmentBuilder } from "discord.js";
import { LEVELINCREASE_EXPERIENCE_PER_LEVEL } from "#constants/users/events.js";

class Command extends BaseCommand {
  #FONT_FAMILY = "VAG World";
  isInited = false;
  options = {
    name: "level",
    id: 33,
    media: {
      description:
        "Отправляет красивое [изображние-карточку](https://media.discordapp.net/attachments/781902008973393940/784507304350580826/level.png) вашего уровня!\nСогласитесь, выглядит [неплохо](https://cdn.discordapp.com/attachments/781902008973393940/784513626413072404/level.png).",
      example: `!level <memb>`,
    },
    accessibility: {
      publicized_on_level: 20,
    },
    alias: "уровень rang rank ранг ранк lvl лвл рівень левел",
    allowDM: true,
    type: "dev",
  };
  constructor() {
    super();
  }

  async #init() {
    if (this.isInited) {
      return;
    }
    this.isInited = true;
    this.canvasModule = await import("canvas").catch();
    if (!this.canvasModule) {
      return;
    }

    const FONT_FAMILY = this.#FONT_FAMILY;
    await this.canvasModule.registerFont(
      "./static/resources/fonts/VAG_World.ttf",
      {
        family: FONT_FAMILY,
      },
    );
  }
  addBackground(context) {
    const { ctx } = context;
    const gradient = ctx.createLinearGradient(0, 225, 900, 0);
    gradient.addColorStop(0, "#777");
    gradient.addColorStop(1, "#aaa");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 225);
  }
  async getContext(interaction) {
    const canvasModule = this.canvasModule;
    const canvas = canvasModule.createCanvas(900, 225);

    const member =
      interaction.mention ||
      (interaction.params && client.users.cache.get(interaction.params)) ||
      interaction.user;

    return {
      canvasModule,
      canvas,
      ctx: canvas.getContext("2d"),
      member,
    };
  }

  getUserPreferColor(member) {
    const value =
      member.data.profile_color ??
      member.accentColor?.toString(16).padStart(6, "0") ??
      "00cc00";

    const hex = `#${value}`;
    return hex;
  }

  async onChatInput(msg, interaction) {
    await this.#init();
    const context = await this.getContext(interaction);
    const { canvas, ctx, member, canvasModule } = context;

    await member.fetch();

    const userData = member.data;
    const avatarURL = member.avatarURL({ extension: "png" });
    const displayName = interaction.guild
      ? interaction.guild.members.resolve(member).displayName
      : member.username;
    let expLine;
    let width;
    let gradient;

    this.addBackground(context);

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

    const avatarBuffer = await canvasModule.loadImage(avatarURL);

    ctx.drawImage(avatarBuffer, 0, 0, 90, 90);
    ctx.restore();

    ctx.font = `bold 20px ${this.#FONT_FAMILY}`;
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
    ctx.font = `bold 5px "${this.#FONT_FAMILY}", 'sans-serif'`;
    ctx.fillStyle = "#b0b4b0";
    width = {
      font: Math.min((545 / ctx.measureText(displayName).width) * 5, 180),
    };

    ctx.font = `bold ${width.font}px "${this.#FONT_FAMILY}", "sans-serif"`;

    width.textHeight =
      ctx.measureText(displayName).actualBoundingBoxAscent +
      ctx.measureText(displayName).actualBoundingBoxDescent;

    const expCanvas = canvasModule.createCanvas(670, 165);
    const ctx2 = expCanvas.getContext("2d");

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

    const image = canvas.toBuffer("image/png");
    msg.msg({
      files: [new AttachmentBuilder(image, { name: "level.png" })],
      delete: 1_000_000,
    });
  }

  process_module_exists(interaction) {
    if (this.canvasModule) {
      return true;
    }

    interaction.channel.msg({
      description:
        "Модуль холста был отключен. Команды на его основе недоступны",
    });
    return false;
  }
}

export default Command;
