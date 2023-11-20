import { Collection } from "@discordjs/collection";

import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import * as Util from "#lib/util.js";
import Discord, { AttachmentBuilder } from "discord.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import EventsManager from "#lib/modules/EventsManager.js";
import QuestManager from "#lib/modules/QuestManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { ActionsMap } from "#constants/enums/actionsMap.js";

class CurseManager {
  static generate({ hard = null, user, guild = null }) {
    const MAXIMAL_HARD = 2;
    if (hard > MAXIMAL_HARD) {
      hard = MAXIMAL_HARD;
    }

    const curseBase = this.getGeneratePull(user, guild)
      .filter((curseBase) => hard === null || curseBase.hard === hard)
      .random({ weights: true });

    const curse = this.generateOfBase({ user, curseBase });
    return curse;
  }

  static getGeneratePull(user, guild = null) {
    return [...CurseManager.cursesBase.values()].filter(
      (curseBase) => !curseBase.filter || curseBase.filter(user, guild),
    );
  }

  static generateOfBase({ curseBase, user }) {
    const curse = {
      id: curseBase.id,
      values: {},
      timestamp: Date.now(),
    };

    Object.entries(curseBase.values).forEach(
      ([key, callback]) => (curse.values[key] = callback(user, curse)),
    );

    return curse;
  }
  static init({ curse, user }) {
    if (!user.data.curses) {
      user.data.curses = [];
    }

    user.data.curses.push(curse);
    const curseBase = this.cursesBase.get(curse.id);
    const callbackMap = (user.data.cursesCallbackMap ||= {});
    Object.keys(curseBase.callback).map((key) => (callbackMap[key] = true));

    if (curse.values.timer) {
      const args = [user.id, curse.timestamp];
      TimeEventsManager.create("curse-timeout-end", curse.values.timer, args);
    }

    user.action(ActionsMap.curseInit, { curse });
  }

  static cursesBase = new Collection(
    [
      {
        _weight: 10,
        id: "callUserCommand",
        description: "Используйте команду !юзер <:piggeorg:758711403027759106>",
        hard: 0,
        values: {
          goal: () => Util.random(1, 5),
          timer: () => Util.random(1, 3) * 86_400_000,
        },
        callback: {
          callCommand: (user, curse, { command }) => {
            const compare =
              CommandsManager.callMap.get("user").options.name ===
              command.options.name;
            compare &&
              CurseManager.interface({ user, curse }).incrementProgress(1);

            return;
          },
        },
        interactionIsShort: true,
        reward: 4,
      },
      {
        _weight: 10,
        id: "onlyBuyBerry",
        description: "Купите клубнику, не продав ни одной",
        hard: 0,
        values: {
          goal: () => Util.random(5, 20),
          timer: () => Util.random(1, 2) * 86_400_000,
        },
        callback: {
          berryBarter: (user, curse, { quantity, isBuying }) => {
            isBuying
              ? CurseManager.interface({ user, curse }).incrementProgress(
                  quantity,
                )
              : CurseManager.interface({ user, curse }).fail();
          },
        },
        interactionIsShort: true,
        reward: 12,
      },
      {
        _weight: 7,
        id: "weekdaysQuest",
        description: "Не пропускайте выполнение ежедневного квеста",
        hard: 2,
        values: {
          goal: () => Util.random(3, 5),
          timer: (user, curse) => {
            const now = new Date();
            const adding = curse.values.goal;
            const timestamp = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + adding,
            ).getTime();
            return Math.floor(timestamp - now);
          },
        },
        callback: {
          curseInit: (user, curse, data) =>
            data.curse === curse && user.data.quest.isCompleted
              ? CurseManager.interface({ user, curse }).incrementProgress(1)
              : null,

          dailyQuestComplete: (user, curse) =>
            CurseManager.interface({ user, curse }).incrementProgress(1),
          dailyQuestSkiped: (user, curse) =>
            CurseManager.interface({ user, curse }).fail(),
        },
        interactionIsLong: true,
        reward: 16,
      },
      {
        _weight: 10,
        id: "notStupid",
        description: "Выполните ваш ежедневный квест, не называя бота глупым",
        hard: 1,
        values: {
          goal: () => 1,
          timer: () => {
            const now = new Date();
            const tomorrow = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 1,
            ).getTime();
            return Math.floor(tomorrow - now);
          },
        },
        callback: {
          dailyQuestComplete: (user, curse) =>
            CurseManager.interface({ user, curse }).incrementProgress(1),
          callBot: (user, curse, { type }) =>
            type === "stupid" && CurseManager.interface({ user, curse }).fail(),
        },
        filter: (user) => user.data.quest?.id === "namebot",
        interactionIsShort: true,
        reward: 4,
      },
      {
        _weight: 10,
        id: "chilliChampion",
        description: "Победите в мини-игре с перцем",
        hard: 0,
        values: {
          goal: () => 2,
          timer: () => 86_400_000 * 2,
        },
        callback: {
          chilliBooh: (user, curse, { boohTarget, chilli }) =>
            boohTarget !== user && chilli.rebounds > 0
              ? CurseManager.interface({ user, curse }).incrementProgress(1)
              : null,
        },
        interactionIsShort: true,
        reward: 4,
      },
      {
        _weight: 10,
        id: "chilliImperator",
        description: "Победите в мини-игре с перцем. Нельзя проигрывать",
        hard: 0,
        values: {
          goal: () => 1,
          timer: () => {
            const now = new Date();
            const tomorrow = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 1,
            ).getTime();
            return Math.floor(tomorrow - now);
          },
        },
        callback: {
          chilliBooh: (user, curse, { boohTarget, chilli }) =>
            boohTarget !== user && chilli.rebounds > 0
              ? CurseManager.interface({ user, curse }).incrementProgress(1)
              : CurseManager.interface({ user, curse }).fail(),
        },
        interactionIsShort: true,
        reward: 7,
      },
      {
        _weight: 10,
        id: "usefulChest",
        description:
          "В сундуке, который Вы откроете должна оказаться нестабильность",
        hard: 1,
        values: {
          goal: () => 1,
          timer: () => 86_400_000 * 10,
        },
        callback: {
          openChest: (user, curse, { treasures }) =>
            "void" in treasures
              ? CurseManager.interface({ user, curse }).incrementProgress(1)
              : null,
        },
        interactionIsLong: true,
        reward: 15,
      },
      {
        _weight: 10,
        id: "sonic",
        description: "Отправьте 70 сообщний за минуту",
        hard: 1,
        values: {
          goal: () => 70,
          timer: () => 3_600_000 * 2,
          messages: () => [],
        },
        callback: {
          messageCreate: (user, curse) => {
            const now = Date.now();
            const messages = curse.values.messages;

            messages.push(now);

            const extraTimeForMobileUsers =
              5_500 * ("mobile" in (user.presence?.clientStatus || {}));
            const TIMEOUT = 90_000 + extraTimeForMobileUsers;

            while (messages[0] + TIMEOUT < now) {
              messages.shift();
            }

            CurseManager.interface({ user, curse }).setProgress(
              messages.length,
            );
          },
        },
        interactionIsShort: true,
        reward: 4,
      },
      {
        _weight: 1,
        id: "mentionForDistribute",
        description:
          "Упомяните двух человек, у которых нет, и не было сего, проклятия. Проклятие распространяется на каждого, кого вы упомянули",
        hard: 0,
        values: {
          goal: () => 2,
          timer: () => 86_400_000 / 2,
          listOfUsers: (user) => [user.id],
        },
        callback: {
          messageCreate: (user, curse, message) => {
            const content = message.content;
            const mentionId = content.match(
              Discord.MessageMentions.UsersPattern,
            )?.[1];

            if (!mentionId) {
              return;
            }

            const target = message.client.users.cache.get(mentionId);
            if (target.id === user.id || target.bot) {
              return;
            }

            if (!user.curses) {
              user.curses = [];
            }
            const haveCurse = user.data.curses.length;
            if (haveCurse && user.data.voidFreedomCurse) {
              message.react("❌");
              return;
            }

            const list = curse.values.listOfUsers || [];

            if (list.includes(target.id)) {
              message.react("❌");
              return;
            }

            message.react("💀");

            const curseBase = this.cursesBase.get(curse.id);
            const createdCurse = this.generateOfBase({
              curseBase,
              user: target,
            });

            this.init({ curse: createdCurse, user: target });
            list.push(target.id);
            createdCurse.values.listOfUsers = list;

            CurseManager.interface({ user, curse }).incrementProgress(1);
          },
        },
        interactionIsShort: true,
        reward: 1,
      },
      {
        _weight: 5,
        id: "coinFever",
        description:
          "Отправьте коин-сообщения или дождитесь окончания. Даёт дополнительный шанс в 16% получить коин из сообщения. Однако количество денег будет уменьшаться",
        hard: 0,
        values: {
          goal: (user) => 48 - (user.data.chectLevel ?? 0) * 16,
          timer: () => 3_600_000 / 2,
        },
        callback: {
          messageCreate: (user, curse, message) => {
            if (Util.random(6)) {
              return;
            }

            const data = user.data;
            const previousCoins = data.coins;

            EventsManager.emitter.emit("users/getCoinsFromMessage", {
              userData: data,
              message,
            });
            const difference = data.coins - previousCoins;

            data.coins -= difference * 2;
            CurseManager.interface({ user, curse }).incrementProgress(1);
          },
          curseTimeEnd: (user, curse, data) => {
            if (data.curse !== curse) {
              return;
            }

            data.event.preventDefault();
            CurseManager.interface({ user, curse }).success();
          },
        },
        reward: 7,
      },
      {
        _weight: 5,
        id: "bossWannaDamage",
        description: "Нанесите боссу вот столько-вот урона",
        hard: 2,
        values: {
          goal: () => 80_000,
          timer: (user) => {
            const guilds = user.guilds.filter(
              (guild) => guild.data.boss?.isArrived,
            );
            const guild = guilds.reduce((maximalize, guild) =>
              maximalize.data.boss.endingAtDay < guild.data.boss.endingAtDay
                ? guild
                : maximalize,
            );
            const timestamp = guild.data.boss.endingAtDay * 86_400_000;
            const difference = timestamp - Date.now();
            return Math.max(difference, 3_600_000);
          },
        },
        callback: {
          bossMakeDamage: (user, curse, { damage }) => {
            CurseManager.interface({ user, curse }).incrementProgress(damage);
          },
        },
        filter: (_user, guild) => guild && guild.data.boss?.isArrived,
        interactionIsLong: true,
        reward: 15,
      },
      {
        _weight: 5,
        id: "anonSticksByExperinence",
        description:
          "Соберите столько палочек в команде !анон, сколько у Вас сейчас опыта",
        hard: 0,
        values: {
          goal: (user) => user.data.exp,
          timer: () => 3_600_000 * 24,
        },
        callback: {
          anonTaskResolve: (user, curse, { context, task }) => {
            const sticks = CommandsManager.collection
              .get("anon")
              .justCalculateStickCount(task, context);
            curse.values.goal = user.data.exp;
            CurseManager.interface({ user, curse }).incrementProgress(sticks);
          },
          beforeProfileDisplay: (user, curse) => {
            curse.values.goal = user.data.exp;
            CurseManager.checkAvailable({ curse, user });
          },
        },
        interactionIsShort: true,
        interactionIsLong: true,
        reward: 20,
      },
      {
        _weight: 5,
        id: "noBagAvailable",
        description:
          "Вы не можете класть ресурсы в сумку, как и извлекать их из неё. Проклятие будет засчитано по окончании таймера",
        hard: 0,
        values: {
          goal: () => 1,
          timer: () => 3_600_000 * 24,
        },
        callback: {
          curseTimeEnd: (user, curse, data) => {
            if (data.curse !== curse) {
              return;
            }

            data.event.preventDefault();
            CurseManager.interface({ user, curse }).success();
          },
          beforeBagInteracted: (context) => {
            context.preventDefault();
          },
        },
        interactionIsLong: false,
        reward: 15,
      },
      {
        _weight: 5,
        id: "anyAction",
        description: "Сделайте что-нибудь",
        hard: 0,
        values: {
          goal: () => 195 + Util.random(9) * 5,
          timer: () => 60_000 * 8,
        },
        callback: {
          [ActionsMap.any]: (user, curse) => {
            const { progress } = curse.values;
            CurseManager.interface({ user, curse })._setProgress(
              (progress || 0) + 1,
            );
          },
          curseTimeEnd: (user, curse, data) => {
            if (data.curse !== curse) {
              return;
            }

            CurseManager.interface({ curse, user }).fail();
          },
        },
        reward: 15,
        interactionIsShort: true,
      },
      {
        _weight: 2,
        id: "spiritOfTheDailyQuest",
        description:
          "Выполняйте сегодняшний квест до 10-ти раз. Вы провалите проклятие, если не выполните хотя бы 3-х",
        hard: 1,
        values: {
          goal: () => 0,
          timer: () => {
            const now = new Date();
            const tomorrow = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 1,
            ).getTime();
            return Math.floor(tomorrow - now);
          },
          minimalProgress: () => 3,
          goalAddingMultiplayerPerQuest: () => 0.3,
        },
        callback: {
          curseTimeEnd: (user, curse, data) => {
            if (data.curse !== curse) {
              return;
            }
            if (curse.values.progress >= curse.values.minimalProgress) {
              data.event.preventDefault();
              CurseManager.interface({ user, curse }).success();
            }
          },
          curseInit: (user, curse, data) => {
            if (data.curse !== curse) {
              return;
            }

            const { quest } = user.data;
            if (quest.isCompleted) {
              CurseManager.interface({ curse, user }).incrementProgress(1);
              const base = QuestManager.questsBase.get(quest.id);
              const context = {
                goalMultiplayer: curse.values.hardMultiplayerPerQuest,
              };
              const newQuest = QuestManager.generateOfBase({
                questBase: base,
                user,
                context,
              });
              QuestManager.init({ user, quest: newQuest });
            }
          },
          dailyQuestComplete: (user, curse) => {
            const { quest } = user.data;
            CurseManager.interface({ curse, user }).incrementProgress(1);

            const base = QuestManager.questsBase.get(quest.id);
            const context = {
              goalMultiplayer:
                curse.values.goalAddingMultiplayerPerQuest *
                curse.values.progress,
            };
            const newQuest = QuestManager.generateOfBase({
              questBase: base,
              user,
              context,
            });
            QuestManager.init({ user, quest: newQuest });
          },
        },
        reward: 15,
      },
      {
        _weight: 0.5,
        id: "iDidntAgreeToIt",
        hard: 0,
        description:
          "Мы собираем о вас данные и позднее отправим их вам. Проклятие будет выполнено автоматически",
        toString(_user, curse) {
          const endTimestamp = curse.timestamp + curse.values.timer;
          const stamp = Math.floor(endTimestamp / 1000);
          return `${this.description}: <t:${stamp}:R>`;
        },
        values: {
          timer: () => 3_600_000 * 24,
          goal: () => 1,
          audit: () => [],
          counter: () => 1,
        },
        callback: {
          curseTimeEnd: (user, curse, data) => {
            if (data.curse !== curse) {
              return;
            }

            data.event.preventDefault();

            const audit = {};
            const auditInterface = new Util.DotNotatedInterface(audit);

            auditInterface.setItem("actions", curse.values.counter);

            for (const entry of curse.values.audit) {
              const { value, source, executor, resource } = entry;
              const box = auditInterface.setItem(
                `resources.${source}`,
                (prev) => prev || [],
              );
              const executorContent =
                executor === user.id
                  ? "You"
                  : executor === null
                  ? "null"
                  : "NotYou";

              const splited = box.find(
                (splited) =>
                  splited.executorContent === executorContent &&
                  Math.sign(splited.value) === Math.sign(value) &&
                  splited.resource === resource,
              );
              if (splited) {
                splited.value += value;
              } else {
                box.push({
                  resource,
                  executorContent,
                  value,
                });
              }
              box.sortBy("resource");
            }
            const document = new Util.yaml.Document(audit);

            const buffer = Buffer.from(document.toString({ indent: 3 }));
            user.msg({
              files: [new AttachmentBuilder(buffer, { name: "audit.yaml" })],
            });
            CurseManager.interface({ user, curse }).success();
          },
          resourceChange: (_user, curse, data) => {
            const { value, source, resource } = data;
            const executor = data.executor?.id ?? null;

            curse.values.audit.push({ value, source, executor, resource });
          },
          [ActionsMap.any]: (_user, curse) => {
            curse.values.counter++;
          },
        },
        reward: 15,
        interactionIsLong: true,
      },
      {
        _weight: 1,
        id: "notKind",
        hard: 1,
        description: (user, curse) => {
          const valueContent = new Intl.NumberFormat("ru-RU").format(
            curse.values.maximum,
          );
          return `Не получайте больше, чем ${valueContent} коинов, ни из какого источника`;
        },
        toString(_user, curse) {
          const endTimestamp = curse.timestamp + curse.values.timer;
          const stamp = Math.floor(endTimestamp / 1000);
          return `${this.description}: <t:${stamp}:>`;
        },
        values: {
          timer: () => 3_600_000 * 0.2,
          goal: () => 1,
          maximum: () => 7_000,
        },
        callback: {},
        reward: 15,
      },
      // {
      //   _weight: 5,
      //   id: "__example",
      //   description:
      //     "Вы не можете класть ресурсы в сумку, как и извлекать их из неё. Проклятие будет засчитано по окончании таймера",
      //   hard: 0,
      //   values: {
      //     goal: (user) => 1,
      //     timer: () => 3_600_000 * 24,
      //   },
      //   callback: {
      //
      //   },
      //   reward: 15,
      // },
    ].map((curse) => [curse.id, curse]),
  );
  static interface({ curse, user }) {
    const incrementProgress = (value) => {
      setProgress((curse.values.progress || 0) + value);
      CurseManager.checkAvailable({ curse, user });
      return curse.values.progress;
    };

    const _setProgress = (value) => {
      curse.values.progress = value;
      CurseManager.checkAvailable({ curse, user });
      return curse.values.progress;
    };
    const setProgress = (value) => {
      user.action(ActionsMap.curseBeforeSetProgress);
      _setProgress(value);
    };

    const toString = () => {
      const curseBase = CurseManager.cursesBase.get(curse.id);

      if ("toString" in curseBase) {
        return curseBase.toString(user, curse);
      }

      const description = (() => {
        const { description } = curseBase;
        return typeof description === "function"
          ? description(user, curse)
          : description;
      })();
      const progressContent = curse.values.goal
        ? `Прогресс: ${curse.values.progress || 0}/${curse.values.goal}`
        : `Прогресс: ${curse.values.progress || 0}`;

      const timer = curse.values.timer
        ? `\nТаймер: <t:${Math.floor(
            (curse.timestamp + curse.values.timer) / 1000,
          )}:R> будет провалено`
        : "";

      const content = `${description}\n${progressContent}${timer}`;
      return content;
    };

    const success = () => {
      this.curseIndexOnUser({ curse, user }) !== null &&
        CurseManager.curseEnd({ lost: false, user, curse });
    };

    const fail = () => {
      this.curseIndexOnUser({ curse, user }) !== null &&
        CurseManager.curseEnd({ lost: true, user, curse });
    };
    return {
      incrementProgress,
      setProgress,
      _setProgress,
      toString,
      fail,
      success,
    };
  }

  static curseIndexOnUser({ curse, user }) {
    const index = user.data.curses.indexOf(curse);
    if (index === -1) {
      return null;
    }

    return index;
  }
  static checkAvailable({ curse, user }) {
    if (!curse) {
      return null;
    }

    if (curse.values.progress >= curse.values.goal) {
      this.curseIndexOnUser({ curse, user }) !== null &&
        CurseManager.curseEnd({ user, curse, lost: false });

      return;
    }

    if (
      curse.values.timer &&
      Date.now() > curse.timestamp + curse.values.timer
    ) {
      const event = new Event("curseTimeEnd", { cancelable: true });
      user.action(ActionsMap.curseTimeEnd, { event, curse });
      if (!event.defaultPrevented) {
        this.curseIndexOnUser({ curse, user }) !== null &&
          CurseManager.curseEnd({ user, curse, lost: true });

        return;
      }
    }
  }
  static checkAvailableAll(user) {
    user.data.curses?.forEach((curse) => this.checkAvailable({ curse, user }));
  }

  static removeCurse({ user, curse }) {
    const index = this.curseIndexOnUser({ curse, user });
    if (index === null) {
      return null;
    }

    user.data.curses.splice(index, 1);

    const keysToRemove = (callbackKey) =>
      !user.data.curses.some(
        ({ id }) => callbackKey in this.cursesBase.get(id).callback,
      );

    const callbackMap = user.data.cursesCallbackMap;
    Object.keys(callbackMap)
      .filter(keysToRemove)
      .forEach((key) => delete callbackMap[key]);
  }

  static curseEnd({ lost, user, curse }) {
    this.removeCurse({ user, curse });
    user.action(ActionsMap.curseEnd, { isLost: lost, curse });

    const curseBase = CurseManager.cursesBase.get(curse.id);

    const getDefaultFields = () => {
      const fields = [];
      fields.push({
        name: "Прогресс:",
        value: Object.entries(curse.values)
          .map(
            ([key, value]) =>
              `${key}: \`${Util.toLocaleDeveloperString(value)}\``,
          )
          .join("\n"),
      });

      fields.push({
        name: "Основа:",
        value: Object.entries(curseBase)
          .map(
            ([key, value]) =>
              `${key}: \`${Util.toLocaleDeveloperString(value)}\``,
          )
          .join("\n"),
      });

      fields.push({
        name: "Другое:",
        value: `Дата создания: <t:${Math.floor(curse.timestamp / 1000)}>`,
      });

      fields
        .filter((field) => field.value.length > 1024)
        .forEach((field) => (field.value = `${field.value.slice(0, 1021)}...`));

      return fields;
    };

    if (lost) {
      user.data.level = Math.max(1, user.data.level - 1);
      const fields = getDefaultFields();
      const image =
        "https://media.discordapp.net/attachments/629546680840093696/1014076170364534805/penguinwalk.gif";
      user.msg({
        title: "Вы не смогли его одолеть 💀",
        description:
          "Проклятие не было остановлено, а последствия необратимы. Вы теряете один уровень и, возможно, что-то ещё.",
        fields,
        color: "#000000",
        image,
      });
      return;
    }

    if (!lost) {
      user.data.cursesEnded = (user.data.cursesEnded ?? 0) + 1;
      const fields = getDefaultFields();

      const getVoidReward = () => {
        const BASIC_ODDS = 20;
        const REDUCTION_FOR_HARD = 0.25;
        const comparator = BASIC_ODDS * REDUCTION_FOR_HARD ** curseBase.hard;

        return Number(Math.random() < 1 / comparator);
      };
      const voidReward = getVoidReward();

      const getCoinsReward = () => {
        const BASIC_REWARD = 120;
        const ADDING_REWARD = 55;
        const { interactionIsLong, interactionIsShort } = curseBase;
        const stable =
          (BASIC_REWARD + ADDING_REWARD * curseBase.hard) * curseBase.reward;

        return Math.ceil(
          stable *
            (interactionIsLong ? 1.2 : 1) *
            (interactionIsShort ? 1 / 1.2 : 1),
        );
      };
      const coinsReward = getCoinsReward();

      Util.addResource({
        user,
        value: coinsReward,
        source: "curseManager.curse.onEnd",
        executor: null,
        resource: PropertiesEnum.coins,
        context: { curse },
      });
      Util.addResource({
        user,
        value: voidReward,
        source: "curseManager.curse.onEnd",
        executor: null,
        resource: PropertiesEnum.void,
        context: { curse },
      });

      const rewardContent = `${Util.ending(
        coinsReward,
        "коин",
        "ов",
        "",
        "а",
      )}${
        voidReward
          ? ` и ${Util.ending(voidReward, "нестабильност", "и", "ь", "и")}`
          : ""
      }`;
      const descriptionFooter = `${
        coinsReward ? "<:coin:637533074879414272>" : ""
      } ${voidReward ? "<a:void:768047066890895360>" : ""}`;
      const description = `Это ${user.data.cursesEnded}-й раз, когда Вам удаётся преодолеть условия, созданные нашей машиной для генерации проклятий.\nВ этот раз вы получаете: ${rewardContent}. Награда такая незначительная в связи с тем, что основным поставщиком ресурсов является сундук. Да будь он проклят!\n${descriptionFooter}`;

      const image =
        "https://media.discordapp.net/attachments/629546680840093696/1014076170364534805/penguinwalk.gif";

      user.msg({
        title: "Проклятие снято 🔆",
        description,
        fields,
        color: "#000000",
        image,
      });

      return;
    }
  }
}

export default CurseManager;
