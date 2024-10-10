import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { CliParser } from "@zoodogood/utils/CliParser";
class CommandRunContext extends BaseCommandRunContext {
  parseCli(input) {
    const parsed = new CliParser()
      .setText(input)
      .captureFlags(this.command.options.cliParser.flags)
      .collect();
    const values = parsed.resolveValues((capture) => capture?.toString());
    this.setCliParsed(parsed, values);
    return parsed;
  }
}

class CommandDefaultBehaviour extends BaseFlagSubcommand {
  async onProcess() {
    const { interaction } = this.context;
    const {
      user,
      guild,
      message: { mentions },
    } = interaction;
    const type = "logChannel";
    const channel = mentions.channels.first() ?? interaction.channel;
    guild.data[type] = channel.id;
    interaction.msg({
      title: `Готово, в #${channel.name} будут отправляться логи сервера!`,
      delete: 9000,
    });

    guild.logSend({
      description: `Каналу #${channel.name} установили метку "логи"`,
      author: { name: user.username, avatarURL: user.avatarURL() },
    });
  }
}

class Remove_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--remove",
    capture: ["--remove"],
  };
  async onProcess() {
    const { guild, interaction } = this.context;
    const type = "logChannel";
    await guild.logSend({
      description: `Логи отключены`,
      author: {
        name: interaction.user.username,
        avatarURL: interaction.user.avatarURL(),
      },
    });
    delete guild.data[type];
    interaction.msg({
      title: "Логи отключены!",
      delete: 9000,
    });
  }
}
class Command extends BaseCommand {
  options = {
    name: "setlogs",
    id: 12,
    media: {
      description:
        "Устанавливает для бота указанный канал, как логи, иначе говоря — журнал, туда будет записываться информация о применении пользователями небезопасных команд, статистике, важных изменениях и многом другом.\nНастоятельно рекомендуется создать такой канал, если его нет.",
      example: `!setLogs <channel>`,
    },
    cliParser: {
      flags: [Remove_FlagSubcommand.FLAG_DATA],
    },
    alias: "установитьлоги встановитилоги",
    allowDM: true,
    type: "guild",
    userPermissions: 32n,
  };

  async onChatInput(msg, interaction) {
    const context = new CommandRunContext(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  processRemoveFlag(context) {
    const value = context.cliParsed.at(1).get("--remove");
    if (!value) {
      return false;
    }
    new Remove_FlagSubcommand(context).onProcess();
    return true;
  }

  async run(context) {
    context.parseCli(context.interaction.params);
    if (await this.processRemoveFlag(context)) {
      return;
    }
    await new CommandDefaultBehaviour(context).onProcess();
  }
}

export default Command;
