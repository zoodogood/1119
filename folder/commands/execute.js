import client from "#bot/client.js";
import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import CommandsManager, {
  parseInputCommandFromMessage,
} from "#lib/modules/CommandsManager.js";
import { sleep } from "#lib/safe-utils.js";
import { CliParser } from "@zoodogood/utils/CliParser";
import { Message } from "discord.js";

class CommandRunContext extends BaseCommandRunContext {
  gap_delay = 0;
  separator = ";";
  parseCli(input) {
    const parsed = new CliParser()
      .setText(input)
      .processBrackets()
      .captureFlags(this.command.options.cliParser.flags)
      .captureResidue({ name: "residue" })
      .collect();
    this.captures = parsed.captures;

    this.separator =
      this.captures.get("--separator")?.valueOfFlag() || this.separator;

    this.gap = this.captures.get("--gap")?.valueOfFlag() || this.gap;
    return parsed;
  }
}

class CommandDefaultBehaviour extends BaseFlagSubcommand {
  async onProcess() {
    const { captures, separator, gap } = this.context;
    const residue = captures.get("residue").toString();
    const executable = residue.split(separator);
    const { message: original } = this.context.interaction;

    for (const content of executable) {
      const clone = Object.create(Message.prototype);
      Object.assign(clone, {
        ...original,
        content,
        client,
      });
      const commandContext = parseInputCommandFromMessage(clone);
      const command = commandContext?.command;
      if (
        commandContext &&
        CommandsManager.checkAvailable(command, commandContext)
      ) {
        CommandsManager.execute(command, commandContext);
      }

      gap && (await sleep(gap));
    }
  }
}
class Command extends BaseCommand {
  daemon;
  options = {
    name: "execute",
    id: 68,
    media: {
      description:
        "Позволяет выполнить несколько команд, вызвав одно сообщение",
      example: `!execute "!boss -a ; !boss -s"`,
    },
    alias: "выполнить",
    allowDM: true,
    cooldown: 10_000,
    cooldownTry: 3,
    type: "guild",
    expectParams: true,
    slash: {
      name: "execute",
      description: "Allow execute chat commands",
    },
    cliParser: {
      flags: [
        {
          name: "--separator",
          capture: ["--separator", "-s"],
          expectValue: true,
          description: "Символ разделитель между командами",
        },
        {
          name: "--gap",
          capture: ["--gap"],
          expectValue: true,
          description:
            "Вводит задержку между применениями. Принимает время в миллисекундах",
        },
      ],
    },
    accessibility: {
      publicized_on_level: 20,
    },
  };
  async onChatInput(message, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }
  onSlash() {}

  /**
   *
   * @param {CommandRunContext} context
   * @returns {CommandRunContext}
   */
  async run(context) {
    context.parseCli(context.interaction.params);
    await new CommandDefaultBehaviour(context).onProcess();
    return;
  }
}

export default Command;
