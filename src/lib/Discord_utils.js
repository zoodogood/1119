import { MINUTE } from "#constants/globals/time.js";
import { pushMessage } from "#lib/DiscordPushMessage.js";
import { CreateModal } from "@zoodogood/utils/discordjs";
import { AttachmentBuilder, ComponentType, TextInputStyle } from "discord.js";

export class ReactionInteraction {
  constructor(reaction, user) {
    const { message, emoji } = reaction;
    const { channel, guild } = message;
    const customId = emoji.code;
    Object.assign(this, {
      user,
      message,
      channel,
      guild,
      reaction,
      emoji,
      customId,
    });
  }
  msg(...options) {
    return pushMessage.call(this.channel, ...options);
  }
}

export function jsonFile(data, name) {
  const buffer = Buffer.from(JSON.stringify(data, null, "\t"));
  return new AttachmentBuilder(buffer, {
    name,
  });
}

export function takeInteractionProperties(raw) {
  const { user, message, channel, guild } = raw;
  return { user, message, channel, guild };
}

export async function justModalQuestion({
  title,
  customId = "modal",
  components,
  interaction,
  thanks = false,
}) {
  const toComponentData = (addable, i = 0) => ({
    type: ComponentType.TextInput,
    customId: `${customId}_content_${i}`,
    label: addable.label,
    style: addable.style || TextInputStyle.Paragraph,
    placeholder: addable.placeholder,
    maxLength: addable.maxLength,
  });
  components = components.map(toComponentData);

  const modal = CreateModal({
    components,
    customId,
    title,
  });

  await interaction.showModal(modal);
  const result = await interaction.awaitModalSubmit({
    filter: (interaction) => customId === interaction.customId,
    time: MINUTE * 5,
  });

  thanks &&
    result?.msg({
      content: "Спасибо!",
      ephemeral: true,
    });

  return { result, fields: result?.fields.fields };
}

export function actionRowsToComponents(actionRows) {
  return actionRows.map((actionRow) =>
    actionRow.components.map((component) => ({
      ...component.data,
      customId: component.customId,
    })),
  );
}
