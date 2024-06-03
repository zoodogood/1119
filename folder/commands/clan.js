import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import { ButtonStyle, ComponentType } from "discord.js";

class Command extends BaseCommand {
  options = {
    name: "clan",
    id: 62,
    media: {
      description: "пока тут пусто",
    },
    accessibility: {
      publicized_on_level: 9,
    },
    alias: "клан",
    hidden: true,
    type: "other",
  };

  createEmbed({}) {
    const contents = {};

    const description = "тут пока что пусто";
    const fields = [{}, {}];

    const embed = {
      description,
      fields,
      footer: { text: member.tag, iconURL: member.avatarURL() },
    };

    return embed;
  }

  async onChatInput(msg, interaction) {
    const member = interaction.mention ?? msg.author;

    const guild = msg.guild;

    msg.msg({ description: "создайте его, в своём воображении" });
    return;
  }
}

export default Command;
