import { client } from "#bot/client.js";
import { HOUR } from "#constants/globals/time.js";
import { CALCULATE_CLOVER_MULTIPLAYER } from "#constants/users/commands.js";

class Event {
  options = {
    name: "TimeEvent/clover-end",
  };

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

    const multiplayer = CALCULATE_CLOVER_MULTIPLAYER(cloverEffect?.uses) + 1;

    channel?.msg({
      title: "☘️ Ивент Клевера завершился",
      color: "#21c96c",
      description: `Получено наград во время действия эффекта: ${cloverEffect?.coins}\nМаксимальный множитель: X${multiplayer.toFixed(2)}\nКуплено клеверов: ${cloverEffect?.uses}\nКлевер длился ${((Date.now() - cloverEffect?.createdAt) / HOUR).toFixed(1)}ч.`,
    });
  }
}

export default Event;
