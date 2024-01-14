import config from "#config";
import get from "#lib/child-process-utils.js";
import { ending } from "@zoodogood/utils/primitives";
const { run } = get({ root: process.cwd() });

const toANSIBlock = (content) => `\`\`\`ansi\n${content}\`\`\``;

class Command {
  async onChatInput(_msg, interaction) {
    const COMMANDS = [
      "git pull",
      "yarn run build",
      config.pm2.id
        ? `yarn run pm2-please-restart ${config.pm2.id}`
        : "echo pm2 not setted",
    ];

    const embed = {
      title: "<:emoji_50:753916145177722941>",
      color: "#2c2f33",
      description: "**RESTARTING...**",
    };

    const message = await interaction.channel.msg(embed);
    embed.edit = true;

    const updateDescription = (content) => {
      embed.description += `\n${content}`;
      embed.description >= 2000 &&
        (embed.description = `Очищено ${ending(
          embed.description.length,
          "символ",
          "ов",
          "а",
        )}\n${content}`);
      message.msg(embed);
    };

    for (const string of COMMANDS) {
      const [command, ...params] = string.split(" ");
      updateDescription(`\n> ${string}`);

      const result = await run(command, params).catch(
        (error) => `Error: ${error.message}`,
      );

      updateDescription(toANSIBlock(result));
    }
  }

  options = {
    name: "restart",
    id: 61,
    media: {
      description: "Перезапускает процесс",
    },
    alias: "перезапустить перезапуск рестарт",
    allowDM: true,
    cooldown: 100_000,
    cooldownTry: 5,
    type: "dev",
  };
}

export default Command;
