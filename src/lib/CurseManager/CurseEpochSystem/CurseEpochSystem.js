/**
 * Declare state file://./readme.md (Default `CTRL + K V` for preview)
 */

/** @import { DataManager } from "#lib/modules/mod.js"; */

import client from "#bot/client.js";
import config from "#config";
import { SECOND } from "#constants/globals/time.js";

/**
 * @typedef {{
 *    gone_state: {[key: string]: [number, number]}
 *    epoch: number
 *    epochAt: number
 * }} CurseEpochField
 */

const MESSAGE_THEME = {
  color: "#1f2022",
  thumbnail:
    "https://media.discordapp.net/attachments/629546680840093696/1174372547941384272/skull.png?ex=65e88daa&is=65d618aa&hm=c4c1b827a6db040cc9053682057f6c9ca6647012da687bd44fc90e4bf270eda5&=&format=webp&quality=lossless",
};
const sendMessage = (user, text) => {
  user.msg({ description: text, ...MESSAGE_THEME });
};
export class CurseEpochSystem {
  static FIELD = "curseEpoch";
  _checkList = [];
  _ignore = ["happyNewYear"];

  /** @type {CurseEpochField} */
  field;

  /**
   *
   * @param {typeof DataManager} dataManager
   */
  constructor(dataManager) {
    this.field = dataManager.data.bot[CurseEpochSystem.FIELD] ||= {
      epoch: 0,
      gone_state: {},
      epochAt: Date.now(),
    };
  }

  allCursesCollected() {
    return this._checkList.length <= Object.keys(this.field.gone_state).length;
  }

  epochIncrementInform() {
    const channel = client.channels.cache.get(config.guild.chatChannel);
    channel.msg({
      title: `${this.field.epoch + 1}-я эпоха проклятий завершена`,
      description: `По проклятиям за прошедший период такая статистика:\n${Object.entries(
        this.field.gone_state,
      )
        .map(([id, [success, failed]]) => `\`- ${id}\` ${success} | ${failed}`)
        .join("\n")}`,
    });
  }

  onUserCurseEnd(user, curse, { isLost }) {
    const { id } = curse;
    if (this._ignore.includes(id)) {
      return;
    }
    this.field[id] ||= [0, 0];
    this.field[id][+isLost]++;

    this.processCheckNewEpoch();

    this.userIsFirstWhoSuccessed(id, isLost) &&
      this.sendCongratulations(user, curse);
  }

  processCheckNewEpoch() {
    if (!this.allCursesCollected()) {
      return;
    }

    this.epochIncrementInform();
    this.updateEpoch();
  }

  sendCongratulations(user, curse) {
    const text = `Вы первый кто прошёл проклятие \`${curse.id}\` в ${this.field.epoch} эпохе\n\nСоответвующая информация доступна по команде !curses --epoch`;
    setTimeout(() => sendMessage(user, text), SECOND);
  }

  setCursesList(list) {
    this._checkList = list.filter((curse) => !this._ignore.includes(curse.id));
    return this;
  }

  updateEpoch() {
    this.field.gone_state = {};
    this.field.epoch++;
    this.field.epochAt = Date.now();
  }

  userIsFirstWhoSuccessed(curseId, isLost) {
    return !isLost && this.field[curseId][0] === 1;
  }
}
