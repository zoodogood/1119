import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import config from "#config";
import get from "#lib/child-process-utils.js";
import { Pager } from "#lib/DiscordPager.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
const { run } = get({ root: process.cwd() });
import { CliParser } from "@zoodogood/utils/primitives";
import { MINUTE } from "#constants/globals/time.js";
import client from "#bot/client.js";
import { ActivityType } from "discord.js";
import { dayjs, sleep } from "#lib/safe-utils.js";

const toANSIBlock = (content) => `\`\`\`ansi\n${content}\`\`\``;
class Timeout_Flagsubcommand extends BaseFlagSubcommand {
  DEFAULT_VALUE = 10;
  constructor(context, value) {
    super(context, value);
    this.value = Number(value) || this.DEFAULT_VALUE;
  }
  async onProcess() {
    this.setupBotUserStatus();
    await this.sleep();
  }

  async sleep() {
    await sleep(this.value * MINUTE);
  }

  setupBotUserStatus() {
    const time = dayjs().add(this.value, "minute").format("HH:mm");
    client.user?.setActivity(`${time} — перезапуск`, {
      type: ActivityType.Streaming,
      url: "https://www.twitch.tv/monstercat",
    });
  }
}

class CommandRunContext extends BaseCommandRunContext {
  needPull;
  needBuild;
  parseCli(input) {
    const parsed = new CliParser()
      .setText(input)
      .captureFlags(this.command.options.cliParser.flags)
      .collect();

    const values = parsed.resolveValues((capture) => capture?.toString());
    this.setCliParsed(parsed, values);
    this.resolveFlags();
  }

  resolveFlags() {
    const values = this.cliParsed.at(1);
    this.needPull = values.get("--pull");
    this.needBuild = values.get("--build");
    this.timeout = values.get("--timeout");
  }
}

class Command extends BaseCommand {
  COMMANDS = [
    {
      run: "git pull",
      filter: (context) => context.needPull,
    },
    {
      run: "pnpm run build && pnpm prune --prod",
      filter: (context) => context.needBuild,
    },
    {
      run: config.pm2.id
        ? `pnpm run pm2-please-restart ${config.pm2.id}`
        : "echo pm2 not setted",
      filter: () => true,
    },
  ];

  async run(context) {
    context.parseCli(context.interaction.params);

    if (context.timeout) {
      await new Timeout_Flagsubcommand(context, context.timeout).onProcess();
    }
    const { COMMANDS } = this;
    const { channel } = context;
    const embed = {
      title: "<:emoji_50:753916145177722941>",
      color: "#2c2f33",
      description: "**RESTARTING...**",
    };

    const pager = new Pager(channel);
    pager.setDefaultMessageState(embed);

    for (const commandData of COMMANDS) {
      if (!commandData.filter(context)) {
        continue;
      }
      const [command, ...params] = commandData.run.split(" ");
      pager.addPages({
        title: `> ${commandData.run}`,
      });
      pager.updateMessage();

      const result = await run(command, params).catch(
        (error) => `Error: ${error.message}`,
      );

      pager.pages.at(-1).description = toANSIBlock(result);
      pager.updateMessage();
    }
  }

  async onChatInput(_msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  options = {
    name: "restart",
    id: 61,
    media: {
      description: "Перезапускает процесс",
    },
    cliParser: {
      flags: [
        {
          name: "--pull",
          capture: ["--pull"],
          description: "Найти и получить обновления из репозитория",
        },
        {
          name: "--build",
          capture: ["--build"],
          description: "Применить команду сборки сайта",
        },
        {
          name: "--timeout",
          capture: ["--timeout"],
          expectValue: true,
          description: "Запланировать перезапуск на N минут вперёд",
        },
      ],
    },
    alias: "перезапустить перезапуск рестарт",
    allowDM: true,
    cooldown: MINUTE,
    cooldownTry: 5,
    type: "dev",
  };
}

export default Command;
