import { client } from "#bot/client.js";
import { CALCULATE_CLOVER_MULTIPLAYER } from "#constants/users/commands.js";

class Event {
  /**
   * @param {boolean} isLost
   * @param {string} guildId
   * @param {string} channelId
   */
  async run(eventData, guildId, channelId) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return;
    }
    const channel = guild.channels.cache.get(channelId);
    const { cloverEffect } = guild.data;
    delete guild.data.cloverEffect;

    const multiplier = CALCULATE_CLOVER_MULTIPLAYER(cloverEffect.uses);

    channel?.msg({
      title: "☘️ Ивент Клевера завершился",
      color: "#21c96c",
      description: `Получено наград во время действия эффекта: ${cloverEffect.coins}\nМаксимальный множитель: X${multiplier.toFixed(2)}\nКуплено клеверов: ${cloverEffect.uses}\nКлевер длился ${((Date.now() - cloverEffect.timestamp) / 3600000).toFixed(1)}ч.`,
    });
  }

  options = {
    name: "TimeEvent/clover-end",
  };
}

export default Event;
