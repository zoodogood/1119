import { BaseCommand } from "#lib/BaseCommand.js";

import { client } from "#bot/client.js";
import config from "#config";
import Template from "#lib/modules/Template.js";

import { whenClientIsReady } from "#bot/util.js";
import { MINUTE } from "#constants/globals/time.js";
import { mol_tree2_string_from_json } from "#lib/$mol.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { Pager } from "#lib/DiscordPager.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import {
  escapeCodeBlock,
  escapeMarkdown,
  Events,
  WebhookClient,
} from "discord.js";

const DEFAULT_CODE_CONTENT = 'module("userData")';

function format_object(object) {
  typeof object === "object" &&
    Object.defineProperty(object, "toString", {
      enumerable: false,
      value: Object.prototype.toString,
    });
  return `\`\`\`tree\n${escapeCodeBlock(mol_tree2_string_from_json(object))}\`\`\``;
}
function resolve_page(raw) {
  if (typeof raw === "string") {
    raw = { description: raw };
  }
  const DISCORD_MESSAGE_LIMIT = 4096;
  if (raw.description.length <= DISCORD_MESSAGE_LIMIT) {
    return raw;
  }
  const CODE_BLOCK_PATTERN = "```";
  const is_code_block = raw.description.startsWith(CODE_BLOCK_PATTERN);

  const overlow_content = "\n...\n";
  // summary: .slice(0, threshold)
  raw.description = raw.description.slice(
    0,
    DISCORD_MESSAGE_LIMIT -
      (is_code_block ? CODE_BLOCK_PATTERN.length + overlow_content.length : 0),
  );

  raw.description += overlow_content;

  is_code_block && (raw.description += CODE_BLOCK_PATTERN);
  return raw;
}
class MessageUpdateHandler {
  constructor(command) {
    this.command = command;
  }

  async listen_edit_message() {
    await whenClientIsReady();
    client.on(Events.MessageUpdate, async (_, message) => {
      if (!message.content.startsWith("!eval")) {
        return;
      }

      await message.reactions.removeAll();
      const commandContext =
        CommandsManager.parseInputCommandFromMessage(message);

      commandContext.extend = {
        remove_view_on: MINUTE,
        immediate_view: true,
      };

      const command = commandContext?.command;
      if (
        commandContext &&
        CommandsManager.checkAvailable(command, commandContext)
      ) {
        CommandsManager.execute(command, commandContext);
      }
    });
  }
}

class CommandRunContext extends BaseCommandRunContext {}
class Command extends BaseCommand {
  options = {
    name: "eval",
    id: 51,
    media: {
      description:
        "Хотя это и команда разработчика, вы можете просмотреть ваши данные из базы данных в JSON формате, для этого просто не вводите никаких аргументов. Список доступных модулей: !eval availableList",
      example: `!eval #без аргументов`,
    },
    accessibility: {
      publicized_on_level: 20,
    },
    alias: "dev евал эвал vm worker",
    allowDM: true,
    type: "other",
  };

  constructor() {
    super();
    // optional
    new MessageUpdateHandler(this).listen_edit_message();
  }

  display_output(context) {
    const { interaction, options } = context;
    const pager = new Pager(interaction.channel);
    pager.setHideDisabledComponents(true);
    pager.setDefaultMessageState({
      title:
        "([**{**  <:emoji_48:753916414036803605> <:emoji_50:753916145177722941> <:emoji_47:753916394135093289> <:emoji_46:753916360802959444> <:emoji_44:753916315755872266> <:emoji_44:753916339051036736>  **}**])",
      author: { name: "Вывод консоли" },
      color: "#1f2022",
      footer: {
        text: `Время выполнения кода: ${interaction.leadTime}мс`,
      },
    });
    pager.addPages(...interaction.pages.map(resolve_page));
    pager.updateMessage();

    options.remove_view_on &&
      setTimeout(() => {
        pager.close();
        pager.message.delete();
      }, options.remove_view_on);
  }

  async loggerProtocol({ interaction }) {
    if (!process.env.EVAL_WEBHOOK_ID_AND_TOKEN) {
      return;
    }

    const [id, token] = process.env.EVAL_WEBHOOK_ID_AND_TOKEN.split(" ");
    const hook = new WebhookClient({ id, token });
    interaction.messageForLogging = await hook.msg({
      author: {
        name: `${interaction.user.username}, в #${interaction.channel.id}`,
        iconURL: client.user.avatarURL(),
      },
      description: `\`\`\`js\n${interaction.codeContent}\`\`\``,
      color: "#1f2022",
      footer: {
        iconURL: client.emojis.cache.get(interaction.emojiByType).imageURL(),
        text: "Вызвана команда !eval",
      },
    });
    return;
  }

  async onChatInput(msg, interaction) {
    const context = new CommandRunContext(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  /**
   *
   * @param {CommandRunContext} context
   */
  async run(context) {
    const { channel, interaction } = context;
    const { message, user } = interaction;

    const fetchReferense = async (reference) => {
      if (!reference) {
        return null;
      }
      const message = await channel.messages.fetch(reference.messageId);

      if (!message) {
        return null;
      }

      return message.content;
    };

    const codeContent =
      (await fetchReferense(message.reference)) ||
      interaction.params ||
      DEFAULT_CODE_CONTENT;

    Object.assign(interaction, {
      launchTimestamp: Date.now(),
      leadTime: null,
      emojiByType: null,
      pages: null,
      codeContent: codeContent.startsWith("```js")
        ? codeContent.match(/```js\n((?:.|\n)+?)```$/)[1]
        : codeContent,
    });

    const getOutput = async (interaction) => {
      try {
        const source = {
          executor: interaction.user,
          type: Template.sourceTypes.call,
        };
        return await new Template(source, interaction)
          .createVM()
          .run(interaction.codeContent);
      } catch (error) {
        config.development && console.error(error);
        return error;
      }
    };
    const output = await getOutput(interaction);
    interaction.leadTime = Date.now() - interaction.launchTimestamp;

    switch (true) {
      case output === undefined:
        interaction.pages = ["```{Пусто}```"];
        interaction.emojiByType = "753916360802959444";
        break;
      case output instanceof Error:
        interaction.pages = [`Ошибка (${output.name}):\n${output.message}`];
        interaction.emojiByType = "753916394135093289";
        break;
      case typeof output === "object":
        interaction.pages = [
          format_object(output),
          {
            title: "Карта полей. По-порядку начиная с третьей страницы",
            description: [
              "Основной объект",
              "*Вы здесь*",
              ...Object.keys(output),
            ]
              .map((title, i) => `${i + 1}. ${escapeMarkdown(title)}`)
              .join("\n"),
          },
          ...Object.entries(output).map(([title, value]) => ({
            title: `Поле \`${title}\``,
            description: format_object(value || {}),
          })),
        ];
        interaction.emojiByType = "753916315755872266";
        break;
      default:
        interaction.pages = [String(output)];
        interaction.emojiByType = "753916145177722941";
    }

    this.loggerProtocol({ interaction });

    const need_display = await (async () => {
      if (context.options.immediate_view) {
        return true;
      }
      const react = await message.awaitReact(
        { user, removeType: "one", time: MINUTE },
        interaction.emojiByType,
      );
      if (react) {
        return true;
      }

      return false;
    })();

    if (!need_display) {
      return;
    }

    this.display_output(context);
  }
}

export default Command;
