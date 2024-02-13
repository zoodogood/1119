import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { SECOND } from "#constants/globals/time.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { Emoji } from "#constants/emojis.js";

export const REASON_FOR_CHANGE_NICKNAME = "Special: in chilli game";
const FOOTER_EMOJI =
  "https://media.discordapp.net/attachments/629546680840093696/1158272956812759050/hot-pepper-2179.png?ex=651ba540&is=651a53c0&hm=9cf4a793a57fb7d37d1f3a935fc6b39ad00b015df7ec500d548d4d4920801e64&=";

class CommandRunContext extends BaseCommandRunContext {
  chilli = null;
  user;
  channel;
  guild;
  memb;
  userData;
  boohIn;
  constructor(interaction, command) {
    super(interaction, command);
    const { user, channel, guild, mention: memb } = interaction;
    const userData = user.data;
    Object.assign(this, { user, channel, guild, memb, userData });
  }
  setChilli(chilli) {
    this.chilli = chilli || null;
  }
}

class RewardSystem {
  static GAME_REWARD = 100;
  static calculateRewardPerPlayer(context) {
    const { chilli } = context;
    const players = Object.keys(chilli.players);
    return Math.floor(this.GAME_REWARD / players.length);
  }
  static putReward(user, context, reward = null) {
    const value = reward || this.calculateRewardPerPlayer();
    Util.addResource({
      value,
      user,
      resource: PropertiesEnum.coins,
      executor: context.chilli.startedBy,
      context,
      source: "command.chilli.reward",
    });
  }
}

class Chilli {
  players = {};
  currentIn = null;
  rebounds = 0;
  createdAt;
  startedBy;
  boohAt;
  boohIn;
  ended = false;
  calculateDefaultBoohDelay() {
    return 5_500;
  }

  constructor(context) {
    const { user } = context;
    this.createdAt = Date.now();
    this.startedBy = user;
    this.currentIn = user;
  }
  addPlayer(user) {
    this.players[user.id] = 0;
  }
  incrementPlayer(user) {
    if (user.id in this.players === false) {
      this.addPlayer(user);
    }
    this.players[user.id]++;
  }
  reputTo(user) {
    this.incrementPlayer(this.currentIn);
    this.currentIn = user;
    this.rebounds++;
    this.updateBoohAt();
  }

  updateBoohAt(ms = null) {
    ms ||= this.calculateDefaultBoohDelay();
    this.boohAt = Date.now() + ms;
    this._updateTimeout();
  }

  myBoohCallback() {
    this.boohIn = this.currentIn;
    this.ended = true;
    this._processCleanPreviousTimeout();
  }

  #timeout;
  _processCleanPreviousTimeout() {
    if (!this.#timeout) {
      return;
    }
    clearTimeout(this.#timeout);
  }
  _updateTimeout() {
    this._processCleanPreviousTimeout();
    this.#timeout = setTimeout(() => {
      this.myBoohCallback();
      this.#boohCallback();
    }, this.boohAt - Date.now());
  }

  #boohCallback;
  setBoohCallback(callback) {
    this.#boohCallback = callback;
  }
}

class Command extends BaseCommand {
  findChilliInChannel(context) {
    const { channel, user } = context;
    return channel.chilli?.find((chilli) => chilli.currentIn.id === user.id);
  }
  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    this.run(context);
    return context;
  }

  addChilliToUsername(member) {
    const newName = member.displayName + "(🌶)";
    member.setNickname(newName, REASON_FOR_CHANGE_NICKNAME).catch(() => {});
  }

  removeChilliFromUsername(member) {
    const newName = member.displayName.replace(/\(🌶\)/g, "").trim();
    member.setNickname(newName, REASON_FOR_CHANGE_NICKNAME).catch(() => {});
  }

  processUserCanPutChilli(context) {
    const { userData, chilli, channel } = context;
    if (chilli || userData.chilli) {
      return true;
    }

    channel.msg({
      title: "Для броска у вас должен быть чилли 🌶️\nКупить его можно в !лавке",
      color: "#ff0000",
      delete: 5000,
      footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
    });
    return false;
  }

  processTargetIsBotUser(context) {
    const { memb, channel } = context;
    if (!memb.bot) {
      return true;
    }
    channel.msg({
      title: "🤬🤬🤬",
      description: "it's hot fruitctttt",
      color: "#ff0000",
      footer: {
        iconURL: FOOTER_EMOJI,
        text: "Кое-кто бросил перец в бота..",
      },
    });
    return false;
  }

  processTargetAlreadyHasChilli(context) {
    const { memb, channel } = context;
    const hasChilli = channel.chilli?.find(
      (chilli) => chilli.currentIn.id === memb.id,
    );
    if (!hasChilli) {
      return true;
    }
    channel.msg({
      title: "Вы не можете бросить перец в участника с перцем в руке",
      color: "#ff0000",
      footer: { iconURL: FOOTER_EMOJI, text: "Перчик™" },
    });
    return false;
  }

  reputChilli(context) {
    const { chilli, memb, channel, guild, user } = context;
    const guildMembers = guild.members;
    const previous = chilli.currentIn;
    chilli.reputTo(memb);
    this.removeChilliFromUsername(guildMembers.resolve(previous));
    this.addChilliToUsername(guildMembers.resolve(memb));

    channel.msg({
      title: ["Бросок!", "А говорят перцы не летают..."].random(),
      description: `Вы бросили перчиком в ${memb}`,
      author: { name: user.username, iconURL: user.avatarURL() },
      footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
      delete: 7_000,
    });
  }

  async processBeforeUserStartAGame(context) {
    const { channel, user } = context;
    const confirm = await channel.msg({
      title: "Подготовка",
      description: `${user.username}, вы бросили перец, нажмите "❌" чтобы отменить`,
      reactions: ["❌"],
    });
    await Util.sleep(2_000);
    const confirmed = !confirm.reactions.cache
      .get("❌")
      .users.cache.has(user.id);

    confirm.delete();
    if (confirmed) {
      return true;
    }
    channel.msg({ title: "Отменено 🌶️", delete: 7_000 });
    return false;
  }

  createChilli(context) {
    const { channel, memb, user } = context;

    const chilli = new Chilli(context);
    channel.chilli.push(chilli);
    chilli.addPlayer(memb);
    chilli.addPlayer(user);

    chilli.setBoohCallback(() => this.chilliEnd(context));
    chilli.updateBoohAt(40 * SECOND);
    return chilli;
  }

  async putChilli(context) {
    const { channel, user, memb, guild } = context;
    Util.addResource({
      user,
      value: -1,
      executor: user,
      context,
      resource: PropertiesEnum.chilli,
      source: "command.chilli.put",
    });
    channel.chilli ||= [];

    channel.msg({
      title: "Перец падает! Перец падает!!",
      description: `\\*перец упал в руки ${memb.toString()}\\*\nЧтобы кинуть обратно используйте \`!chilli @memb\``,
      author: { name: user.username, iconURL: user.avatarURL() },
      footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
    });
    this.addChilliToUsername(guild.members.resolve(memb));
    context.setChilli(this.createChilli(context));
  }

  processCommandCall(context) {
    const {
      interaction: { message },
    } = context;
    setTimeout(() => message.delete(), 30 * SECOND);
  }

  async run(context) {
    context.setChilli(this.findChilliInChannel(context));
    const { chilli } = context;
    this.processCommandCall(context);

    if (!this.processUserCanPutChilli(context)) {
      return;
    }
    if (!this.processTargetAlreadyHasChilli(context)) {
      return;
    }
    if (!this.processTargetIsBotUser(context)) {
      return;
    }

    if (chilli) {
      await this.reputChilli(context);
      return;
    }

    if (!(await this.processBeforeUserStartAGame(context))) {
      return;
    }

    await this.putChilli(context);
  }

  chilliEnd(context) {
    const { chilli, guild, channel } = context;
    const members = guild.members;
    const boohIn = members.cache.get(chilli.currentIn.id);
    context.boohIn = boohIn;

    const reward = RewardSystem.calculateRewardPerPlayer(context);
    Object.keys(chilli.players).forEach((id) => {
      const user = client.users.cache.get(id);
      user.action(Actions.chilliBooh, context);
      RewardSystem.putReward(user, context, reward)
    });

    channel.msg({
      title: "Бах! Перчик взорвался!",
      description: `Перец бахнул прямо у ${boohIn.toString()}\nИгра окончена.\nБыло совершено отскоков: ${chilli.rebounds}\nЧтобы победить, должен быть хотя бы один отскок. Тогда всё игроки получат по ${reward} ${Emoji.coins.toString()}`,
      fields: Object.entries(chilli.players)
        .sortBy("1", true)
        .map(([id, score]) => ({
          name: members.cache.get(id).user.username,
          value: `Счёт: ${score}`,
        }))
        .slice(0, 20),
      footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
    });

    this.processCleanChilliAfterEnd(context);
  }

  processCleanChilliAfterEnd(context) {
    const { guild, chilli, channel } = context;
    const members = guild.members;
    for (const id of Object.keys(chilli.players)) {
      this.removeChilliFromUsername(members.resolve(id));
    }

    const index = channel.chilli.indexOf(chilli);
    if (index === -1) {
      return;
    }
    channel.chilli.splice(index, 1);
    if (!channel.chilli.length) {
      delete channel.chilli;
    }
  }

  options = {
    name: "chilli",
    id: 38,
    media: {
      description:
        '\n\nМини-игра "Жгучий перчик" подразумевает перебрасывание вымышленного перца, который через некоторое время бабахнет в руках у одного из участников — в этом случае игрок проигрывает.\nСтратегия здесь приветсвуется, а сама игра отлично подходит для проведения турниров.\n\n✏️\n```python\n!chilli {memb}\n```\n\n',
    },
    alias: "перчик перец перець",
    expectMention: true,
    allowDM: true,
    hidden: true,
    cooldown: 3_500,
    cooldownTry: 2,
    type: "other",
  };
}

export default Command;
