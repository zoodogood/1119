import { ErrorData, ErrorsHandler } from "#lib/modules/ErrorsHandler.js";
import {
  ButtonStyle,
  ComponentType,
  TextInputStyle,
} from "discord-api-types/v10";
import { CreateModal } from "@zoodogood/utils/discordjs";
import { resolveGithubPath, uid } from "#lib/util.js";
import Path from "path";
import config from "#config";

class UserInterfaceUtil {
  static async sendErrorInfo({
    channel,
    error,
    interaction = {},
    description = "",
  }) {
    const { fileOfError, strokeOfError, stack } =
      ErrorData.parseErrorStack.call({ error }, { node_modules: false }) ?? {};

    if (stack.length >= 1900) {
      stack.length = 1900;
    }

    const components = [
      {
        type: ComponentType.Button,
        style: ButtonStyle.Secondary,
        label: "Получить отчёт",
        customId: "getErrorInfo",
        emoji: "〽️",
      },
      {
        type: ComponentType.Button,
        style: ButtonStyle.Link,
        label: "В Github",
        url: resolveGithubPath(
          Path.relative(process.cwd(), fileOfError ?? "."),
          strokeOfError,
        ),
        disabled: !fileOfError,
      },
      {
        type: ComponentType.Button,
        style: ButtonStyle.Success,
        label: "Сообщение",
        customId: "setAddableInformationForError",
      },
    ];
    const embed = {
      title: "— Данные об панике 🙄",
      description: `> ${error.message}\n\n${description}`,
      color: "#d8bb40",
      components,
      reference: interaction.message?.id ?? null,
    };
    const message = await channel.msg(embed);

    const context = {
      error,
      stack,
      interaction,
      channel,
      description,
    };

    const collector = message.createMessageComponentCollector({
      time: 3_600_000,
    });
    collector.on("collect", async (interaction) =>
      this.onComponent({ interaction, context }),
    );
    collector.on("end", () => message.edit({ components: [] }));
  }

  static onComponent({ interaction, context }) {
    this.components[interaction.customId].call(this, {
      interaction,
      context,
    });
  }

  static components = {
    getErrorInfo({ interaction, context }) {
      const { stack } = context;
      interaction.msg({
        ephemeral: true,
        content: `\`\`\`js\n${stack}\`\`\``,
      });
    },
    async setAddableInformationForError({ interaction, context }) {
      const modalId = `review-${uid()}`;
      const components = [
        {
          type: ComponentType.TextInput,
          customId: `${modalId}-content`,
          style: TextInputStyle.Paragraph,
          label: "Предположительно",
          required: true,
          maxLength: 1_000,
          value: "Это бета-функция и она может быть удалена в будущем",
          placeholder: "Необязательно, отправляет сообщение разработчику",
        },
      ];

      const modal = CreateModal({
        components,
        customId: modalId,
        title: "Отправить",
      });

      interaction.showModal(modal);

      const response = await interaction
        .awaitModalSubmit({
          filter: (interaction) => interaction.customId === modalId,
          time: 300_000,
        })
        .catch(() => {});

      if (!response) {
        return;
      }

      const responseText = response.fields.getField(`${modalId}-content`).value;
      console.log(responseText);

      const StatusEnum = {
        Dang: "dang",
        Urge: "urge",
        Desi: "desi",
        Quie: "quie",
      };

      (async () => {
        const message = await response.msg({
          ephemeral: true,
          content: `Текст будет прикреплён как публичный комментарий к ошибке, не сообщайте личную информацию, а также направлен разработчику.\nПодробности можно узнать на основном сервере <${config.guild.url}>\nВыберите важность ошибки из списка, чтобы начать отправку`,
          fetchReply: true,
          placeholder: "Необходимо",
          components: [
            {
              type: ComponentType.StringSelect,
              customId: `${modalId}-select`,
              options: [
                {
                  label: "Опасно",
                  value: StatusEnum.Dang,
                  description: "Имеет последствия",
                },
                {
                  label: "Необходимо",
                  value: StatusEnum.Urge,
                },
                {
                  label: "Мешает",
                  value: StatusEnum.Desi,
                  description: "Является преградой",
                },
                {
                  label: "Живёт себе спокойно",
                  value: StatusEnum.Quie,
                  description: "Эту ошибку можно обойти",
                },
              ],
            },
          ],
        });

        const selectionInteract = await message
          .awaitMessageComponent({ time: 120_000 })
          .catch();

        if (!selectionInteract) {
          message.delete();
          return;
        }

        const { error } = context;
        const group = ErrorsHandler.getErrorsGroupBy(error.message);
        group.addComment({ responseText, id: interaction.user.id });

        selectionInteract.msg({
          edit: true,
          content: "Отправлено",
          components: [],
        });

        // .msg({
        //   title: `Дан комментарий ошибки с срочностью: ${selectionInteract.values[0]} и текстом ${responseText} for \`\`\`${error.message}\`\`\``,
        // });
      })();
      return;
    },
  };
}

function sendErrorInfo(...params) {
  return UserInterfaceUtil.sendErrorInfo(...params);
}

export { UserInterfaceUtil as ErrorUserInterfaceUtil, sendErrorInfo };