import config from "#config";
import get from "#lib/child-process-utils.js";
const { run, _npm } = get({ root: process.cwd() });

const toANSIBlock = (content) => `\`\`\`ansi\n${content}\`\`\``;

class Command {
  async onChatInput(msg, interaction) {
    const COMMANDS = [
      "git pull",
      `${_npm} run build`,
      config.pm2.id
        ? `${_npm} run pm2-please-restart ${config.pm2.id}`
        : "echo pm2 not setted",
    ];

    const embed = {
      title: "<:emoji_50:753916145177722941>",
      color: "#2c2f33",
      description: "**RESTARTING...**",
    };

    const message = await msg.msg(embed);
    embed.edit = true;

    const updateDescription = (content) => {
      embed.description += `\n${content}`;
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
    allias: "перезапустить перезапуск рестарт",
    allowDM: true,
    cooldown: 100_000,
    cooldownTry: 5,
    type: "dev",
  };
}

export default Command;
