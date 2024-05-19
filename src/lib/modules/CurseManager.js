import { Collection } from "@discordjs/collection";

import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { AttachmentBuilder } from "discord.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import EventsManager from "#lib/modules/EventsManager.js";
import QuestManager from "#lib/modules/QuestManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { ActionsMap } from "#constants/enums/actionsMap.js";
import DataManager from "#lib/modules/DataManager.js";
import { RanksUtils } from "#folder/commands/top.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import Executor from "#lib/modules/Executor.js";
import UserEffectManager from "#lib/modules/EffectsManager.js";
import { DAY, HOUR, MINUTE } from "#constants/globals/time.js";
import { provideTunnel } from "#folder/userEffects/provideTunnel.js";
import { LEVELINCREASE_EXPERIENCE_PER_LEVEL } from "#constants/users/events.js";
import { MessageMentions } from "discord.js";
import app from "#app";
import {
  DotNotatedInterface,
  clamp,
  ending,
  random,
  sleep,
  toLocaleDeveloperString,
  yaml,
} from "#lib/safe-utils.js";
import { addResource, overTheMessageSpamLimit } from "#lib/util.js";
import { createDefaultPreventable } from "#lib/createDefaultPreventable.js";

class CurseManager {
  static generate({ hard = null, user, context }) {
    const MAXIMAL_HARD = 2;
    if (hard > MAXIMAL_HARD) {
      hard = MAXIMAL_HARD;
    }

    const curseBase = this.getGeneratePull(user, context)
      .filter((curseBase) => hard === null || curseBase.hard === hard)
      .random({ weights: true });

    const curse = this.generateOfBase({ user, curseBase, context });
    return curse;
  }

  static getGeneratePull(user, context) {
    return [...CurseManager.cursesBase.values()].filter(
      (curseBase) =>
        !curseBase.filter || curseBase.filter.call(curseBase, user, context),
    );
  }

  static generateOfBase({ curseBase, user, context }) {
    const curse = {
      id: curseBase.id,
      values: {},
      timestamp: Date.now(),
    };

    Object.entries(curseBase.values).forEach(
      ([key, callback]) =>
        (curse.values[key] = callback.call(curseBase, user, curse, context)),
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
          goal: () => random(1, 5),
          timer: () => random(1, 3) * 86_400_000,
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
          goal: () => random(5, 20),
          timer: () => random(1, 2) * DAY,
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
        _weight: 2,
        id: "weekdaysQuest",
        description: "Не пропускайте выполнение ежедневного квеста",
        hard: 2,
        values: {
          goal: () => random(3, 5),
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
        filter: (user) =>
          user.data.quest?.id === "namebot" && !user.data.quest.isCompleted,
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
          chilliBooh: (user, curse, { boohIn, chilli }) =>
            boohIn !== user && chilli.rebounds > 0
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
          chilliBooh: (user, curse, { boohIn, chilli }) =>
            boohIn !== user && chilli.rebounds > 0
              ? CurseManager.interface({ user, curse }).incrementProgress(1)
              : CurseManager.interface({ user, curse }).fail(),
        },
        interactionIsShort: true,
        reward: 7,
      },
      {
        _weight: 3,
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
        reward: 12,
      },
      {
        _weight: 10,
        id: "sonic",
        description: "Отправьте 70 сообщений за минуту",
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
        reward: 5,
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
            const mentionId = content.match(MessageMentions.UsersPattern)?.[1];

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
            const haveCurse = target.data.curses?.length;
            if (haveCurse && !target.data.voidFreedomCurse) {
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

            CurseManager.interface({ user, curse }).setProgress(
              list.length - 1,
            );
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
            if (random(6)) {
              return;
            }

            const data = user.data;
            const previousCoins = data.coins;

            EventsManager.emitter.emit("users/getCoinsFromMessage", {
              user,
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
        reward: 1,
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
        filter: (_user, { guild }) => guild && guild.data.boss?.isArrived,
        interactionIsLong: true,
        reward: 10,
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
          anonTaskResolve: (user, curse, { primary, task }) => {
            const sticks = CommandsManager.collection
              .get("anon")
              .justCalculateStickCount(task, primary);
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
        reward: 15,
      },
      {
        _weight: 5,
        id: "noBagAvailable",
        description:
          "Вы не можете класть ресурсы в сумку, как и извлекать их из неё. Проклятие будет засчитано по окончании таймера",
        hard: 0,
        values: {
          goal: () => 1,
          timer: () => 86_400_000,
        },
        callback: {
          curseTimeEnd: (user, curse, data) => {
            if (data.curse !== curse) {
              return;
            }

            data.event.preventDefault();
            CurseManager.interface({ user, curse }).success();
          },
          beforeBagInteracted: (user, curse, context) => {
            context.preventDefault();
          },
        },
        interactionIsLong: false,
        reward: 3,
      },
      {
        _weight: 5,
        id: "anyAction",
        description: "Сделайте что-нибудь",
        hard: 0,
        values: {
          goal: () => 175 + random(5) * 5,
          timer: () => 60_000 * 8,
        },
        callback: {
          [ActionsMap.any]: (user, curse, { actionName, data }) => {
            if (actionName === ActionsMap.curseEnd && curse === data.curse) {
              return;
            }

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
        reward: 5,
        interactionIsShort: true,
      },
      {
        _weight: 2,
        id: "spiritOfTheDailyQuest",
        description: (user, { values }) =>
          `Выполняйте сегодняшний квест до ${values.maximumProgress}-ти раз. Вы провалите проклятие, если не выполните хотя бы ${values.minimalProgress}-х`,
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
          maximumProgress: () => 10,
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

            if (curse.values.progress >= curse.values.maximumProgress) {
              CurseManager.interface({ user, curse }).success();
              return;
            }

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
        reward: 5,
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
            const auditInterface = new DotNotatedInterface(audit);

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
            const document = new yaml.Document(audit);

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
        reward: 10,
        interactionIsLong: true,
      },
      {
        _weight: 3,
        id: "notKind",
        hard: 1,
        description: (user, curse) => {
          const valueContent = new Intl.NumberFormat("ru-RU").format(
            curse.values.maximum,
          );
          return `Не получайте больше, чем ${valueContent} коинов, ни из какого источника`;
        },
        toString(user, curse) {
          const { values, timestamp } = curse;
          const { timer, progress, maximum } = values;
          const endAtContent = `<t:${Math.floor(
            (timestamp + timer) / 1_000,
          )}:R>`;
          return `${this.description(
            user,
            curse,
          )}\nПолучено: ${progress}/${maximum}\nДо спокойного конца: ${endAtContent}`;
        },
        values: {
          timer: () => 3_600_000 * 8,
          progress: () => 0,
          maximum: () => 7_000,
        },
        callback: {
          curseTimeEnd: (user, curse, data) => {
            if (data.curse !== curse) {
              return;
            }

            data.event.preventDefault();

            CurseManager.interface({ user, curse }).success();
          },
          resourceChange: (user, curse, data) => {
            if (data.resource !== PropertiesEnum.coins) {
              return;
            }

            if (data.value <= 0) {
              return;
            }

            const { values: curseValues } = curse;

            curseValues.progress += data.value;
            if (curseValues.progress >= curseValues.maximum) {
              CurseManager.interface({ user, curse }).fail();
            }
          },
        },
        reward: 5,
      },
      {
        _weight: 2,
        id: "haveGoToCasino",
        hard: 1,
        description: (user, curse) => {
          return `Поставьте >${curse.values.goal} ставкой в казино`;
        },
        values: {
          timer: () => HOUR,
          goal: (user) => {
            const { coins, berrys } = user.data;
            const { coinsInBag } = user.data.bag || {};
            const value =
              coins +
              (coinsInBag || 0) / 2 +
              (berrys * DataManager.data.bot.berrysPrice) / 2;

            return Math.floor(value);
          },
        },
        callback: {
          casinoSession: (user, curse, { bet }) => {
            CurseManager.interface({ user, curse }).setProgress(bet);
          },
        },
        interactionIsShort: true,
        reward: 5,
      },
      {
        _weight: 1,
        id: "greedyChest",
        hard: 1,
        description: "Вы теряете на 10% больше коинов, откройте 2 сундука",
        values: {
          timer: () => DAY * 3,
          goal: () => 2,
        },
        callback: {
          openChest: (user, curse) => {
            CurseManager.interface({ user, curse }).incrementProgress(1);
          },
          resourceChange: (user, curse, data) => {
            if (data.resource !== PropertiesEnum.coins) {
              return;
            }

            if (data.value >= 0) {
              return;
            }

            if (data.source === "curseManager.events.greedyChest") {
              return;
            }

            addResource({
              user,
              value: Math.floor(data.value * 0.1),
              resource: PropertiesEnum.coins,
              context: { curse, data },
              source: "curseManager.events.greedyChest",
              executor: null,
            });
          },
        },
        reward: 5,
        interactionIsLong: true,
      },
      {
        _weight: 1,
        id: "generousChest",
        EFFECT_ID: "curseManager.events.greedyChest",
        hard: 1,
        description:
          "Вы теряете и получаете на 5% больше коинов, откройте сундук",
        values: {
          timer: () => DAY * 3,
          goal: () => 2,
        },
        callback: {
          openChest: (user, curse) => {
            CurseManager.interface({ user, curse }).incrementProgress(1);
          },
          resourceChange: (user, curse, data) => {
            if (data.resource !== PropertiesEnum.coins) {
              return;
            }

            if (data.source === this.EFFECT_ID) {
              return;
            }

            addResource({
              user,
              value: Math.floor(data.value * 0.05),
              resource: PropertiesEnum.coins,
              context: { curse, data },
              source: this.EFFECT_ID,
              executor: null,
            });
          },
        },
        reward: 5,
      },
      {
        _weight: 1,
        id: "independent",
        hard: 1,
        description: "Накопите коины, передача ресурсов заблокирована",
        values: {
          timer: () => DAY,
          progress: (user) => user.data.coins,
          goal: (user) => user.data.coins + 2000,
        },
        callback: {
          resourceChange: (user, curse, data) => {
            if (data.resource !== PropertiesEnum.coins) {
              return;
            }
            const { coins } = user.data;
            CurseManager.interface({ curse, user }).setProgress(coins);
          },
          beforeProfileDisplay: (user, curse) => {
            const { coins } = user.data;
            CurseManager.interface({ curse, user }).setProgress(coins);
          },
          beforeResourcePayed: (user, curse, context) => {
            context.event.preventDefault();
          },
          beforeBerryBarter: (user, curse, context) => {
            context.preventDefault();
          },
        },
        reward: 5,
        interactionIsShort: true,
      },
      {
        _weight: 1,
        id: "itAllBag",
        hard: 1,
        description:
          "По завершении проклятия вы потеряете все свои коины, опыт, ключи",
        values: {
          timer: () => DAY,
        },
        callback: {
          curseTimeEnd: (user, curse, target) => {
            if (target.curse !== curse) {
              return;
            }
            const userData = user.data;
            for (const resource of [
              PropertiesEnum.coins,
              PropertiesEnum.keys,
              PropertiesEnum.exp,
            ]) {
              addResource({
                user,
                value: -userData[resource],
                resource,
                executor: null,
                source: "curseManager.events.itAllBag",
              });
            }
            target.event.preventDefault();
            CurseManager.interface({ user, curse }).silentEnd();
            CurseManager.removeCurse({ user, curse });
          },
        },
        reward: 3,
        interactionIsShort: true,
      },
      {
        _weight: 1,
        id: "pointOfNoReturn",
        hard: 2,
        description:
          "Таймер трёх проклятий должен пройти. В случае провала, вы теряете все ресурсы",
        values: {
          timer: () => DAY * 100,
          goal: () => 3,
        },
        callback: {
          curseTimeEnd: (user, curse, target) => {
            if (target.curse !== curse) {
              CurseManager.interface({ curse, user }).incrementProgress(1);
              return;
            }

            const userData = user.data;
            for (const resource of [
              PropertiesEnum.coins,
              PropertiesEnum.keys,
              PropertiesEnum.exp,
              PropertiesEnum.level,
              PropertiesEnum.berrys,
              PropertiesEnum.void,
              PropertiesEnum.chestBonus,
            ]) {
              addResource({
                user,
                value: -userData[resource],
                resource,
                executor: null,
                source: "curseManager.events.pointOfNoReturn",
              });
            }
          },
        },
        reward: 5,
        filter: (user) => user.data.voidFreedomCurse,
      },
      {
        _weight: 1,
        id: "pacifier",
        hard: 1,
        EFFECT_ID: "curseManager.event.pacifier",
        description: "На время заменяет ваш профиль пустышкой",
        SYNCED_KEYS: ["reminds", "praises"],
        values: {
          timer: () => HOUR * 2,
        },
        callback: {
          curseTimeEnd(user, curse, target) {
            if (curse !== target.curse) {
              return;
            }

            const userData = user.data;
            const puppet = userData[this.EFFECT_ID];
            for (const key of Object.keys(userData)) {
              delete userData[key];
            }
            Object.assign(userData, puppet);
            target.event.preventDefault();
            CurseManager.interface({ user, curse }).success();
          },
          curseInit(user, curse, target) {
            if (curse !== target.curse) {
              return;
            }

            const userData = user.data;
            const puppet = { ...userData };
            const defaults = DataManager.userToDefaultData(user, user.id);
            for (const key of Object.keys(userData)) {
              if (this.SYNCED_KEYS.includes(key)) {
                continue;
              }
              delete userData[key];
            }
            Object.assign(userData, defaults);
            userData.curses = [curse];
            userData.cursesCallbackMap = { curseTimeEnd: true };
            userData[this.EFFECT_ID] = puppet;
          },
          timeEventEffectTimeoutEnd(user, curse, data) {
            const userData = user.data;
            const puppet = userData[this.EFFECT_ID];

            const compare = (effect) => effect.uid === data.uid;
            const target = (puppet.effects || []).find(compare);
            if (!target) {
              return;
            }
            UserEffectManager.removeEffect({ effect: target, user });
            data.event.preventDefault();
          },
          timeEventCurseTimeoutEnd: (user, curse, data) => {
            if (curse.timestamp === data.timestamp) {
              return;
            }
            const userData = user.data;
            const puppet = userData[this.EFFECT_ID];

            const compare = (curse) => curse.timestamp === data.timestamp;
            const target = (puppet.curses || []).find(compare);
            if (!curse) {
              return;
            }
            CurseManager.removeCurse({ user, curse: target });
            data.event.preventDefault();
          },
        },
        reward: 5,
        filter: (user) => user.data.level > 30,
      },
      {
        _weight: 5,
        id: "toTheTop",
        hard: 1,
        description: (user, curse) => {
          const { client } = user;
          const { name } = client.guilds.cache.get(curse.values.guildId) || {};
          return `Поднимитесь в топе по богатству на "${name}" хотя бы на один ранг и дождитесь конца проклятия`;
        },
        values: {
          timer: () => 86_400_000,
          goal: () => 1,
          guildId: (_user, _curse, data) => data.guild.id,
          previousRank: () => null,
        },
        callback: {
          curseTimeEnd(user, curse, target) {
            if (curse !== target.curse) {
              return;
            }
            target.event.preventDefault();

            const { client } = user;
            const guild = client.guilds.cache.get(curse.values.guildId);
            const { value: resolver } =
              RanksUtils.leaderboardTypes.get("coins");

            const pull = RanksUtils.createPullWithResolver(
              [...guild.members.cache.values()].map((member) => member.user),
              resolver,
            );

            const index = RanksUtils.sortMutableAndFilterPull(pull).findIndex(
              ([target]) => target.id === user.id,
            );

            if (index === 0) {
              CurseManager.interface({ curse, user }).success();
              return;
            }

            if (index === -1 || curse.values.previousRank <= index) {
              CurseManager.interface({ curse, user }).fail();
              return;
            }
            CurseManager.interface({ curse, user }).success();
          },
          curseInit(user, curse, target) {
            if (curse !== target.curse) {
              return;
            }
            const { client } = user;
            const guild = client.guilds.cache.get(curse.values.guildId);
            const { value: resolver } =
              RanksUtils.leaderboardTypes.get("coins");
            const pull = RanksUtils.createPullWithResolver(
              [...guild.members.cache.values()].map((member) => member.user),
              resolver,
            );
            const index = RanksUtils.sortMutableAndFilterPull(pull).findIndex(
              ([target]) => target.id === user.id,
            );
            curse.values.previousRank =
              index === -1 ? Number.MAX_SAFE_INTEGER : index;
          },
        },
        reward: 7,
        interactionIsShort: true,
        filter: (user, { guild }) => guild,
      },
      {
        _weight: 0.25,
        id: "buggyProggy",
        hard: 0,
        description: "Переживите багги",
        values: {
          timer: () => HOUR,
          goal: () => 1,
          addable: () => null,
        },
        callback: {
          curseTimeEnd(user, curse, target) {
            if (curse !== target.curse) {
              return;
            }
            target.event.preventDefault();
            CurseManager.interface({ curse, user }).success();
          },
          curseEnd(user, curse, target) {
            if (curse !== target.curse) {
              return;
            }
            addResource({
              user,
              value: -curse.values.addable,
              source: "curseManager.events.buggyProggy",
              executor: null,
              context: { curse, target },
              resource: PropertiesEnum.coins,
            });
          },
          curseInit(user, curse, target) {
            if (curse !== target.curse) {
              return;
            }

            const TARGET_VALUE = 99_999;
            const adding = TARGET_VALUE - user.data.coins;
            curse.values.addable = adding;
            addResource({
              user,
              value: adding,
              source: "curseManager.events.buggyProggy",
              executor: null,
              context: { curse, target },
              resource: PropertiesEnum.coins,
            });
          },
          beforeResourcePayed(user, curse, context) {
            const { interaction, resource } = context;
            if (interaction.user !== user) {
              return;
            }

            if (resource !== PropertiesEnum.coins) {
              return;
            }

            const realCount = user.data.coins - curse.values.addable;
            context.numeric = Math.min(realCount, context.numeric);

            CurseManager.interface({ user, curse }).success();
          },
          resourceChange(user, curse, { executor, resource, value }) {
            if (executor !== user) {
              return;
            }
            if (resource !== PropertiesEnum.coins) {
              return;
            }
            if (value > 0) {
              return;
            }

            CurseManager.interface({ user, curse }).success();
          },
        },
        reward: 3,
        filter: (user) => user.data.coins < 50_000,
      },
      {
        _weight: 0,
        id: "happySnowy",
        hard: 2,
        description:
          "Собирайте снежинки: и открывайте !сумка использовать подарок, с наступающим",
        values: {
          timer: () => {
            const now = new Date();
            const tomorrow = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 1,
            ).getTime();
            return Math.floor(tomorrow - now);
          },
          progress: () => 0,
        },
        async onComponent({ params, interaction }) {
          const [target, ...parsed] = params;
          const callbacks = (await import("#lib/snowyEvent.js"))
            .componentsActions;

          callbacks[target].call(this, {
            params: parsed,
            interaction,
          });
        },
        callback: {
          coinFromMessage(user, curse) {
            CurseManager.interface({ user, curse }).incrementProgress(
              random(1, 4) * 5,
            );
          },
          messageCreate(user, curse, message) {
            if (overTheMessageSpamLimit(user)) {
              return;
            }
            if (random(20) === 0) {
              EventsManager.emitter.emit("users/getCoinsFromMessage", {
                user,
                message,
              });
            }
          },
          async inputCommandParsed(user, curse, context) {
            const { commandBase } = context;
            const targetKeywords = new Map(
              [
                "present",
                "presents",
                "подарок",
                "подарки",
                "подарунок",
                "подарунки",
              ].map((key) => [key, true]),
            );

            if (!targetKeywords.has(commandBase)) {
              return;
            }

            return (
              await import("#lib/snowyEvent.js")
            ).onPresentsChatInputCommand(user, curse, context);
          },
          curseTimeEnd(user, curse, target) {
            if (curse !== target.curse) {
              return;
            }

            curse.values["h0-h0-h0"] = "❤️‍🔥";
            CurseManager.interface({ user, curse }).success();
            target.event.preventDefault();
          },
        },
        reward: 3,
        filter: () => false,
      },
      {
        _weight: 1,
        id: "candyFactory",
        hard: 0,
        EFFECT_ID: "curseManager.event.candyFactory",
        description:
          "Вам становится доступна команда !клик, заработайте конфеты",
        values: {
          timer(user) {
            const userData = user.data;
            const defaults = 20 * 60_000;
            const candyData = userData[this.EFFECT_ID] || {};
            return defaults * (candyData.level || 1);
          },
          goal(user) {
            const userData = user.data;
            const defaults = 7;
            const candyData = userData[this.EFFECT_ID] || {};
            return defaults * (candyData.level || 1) * userData.level;
          },
          progress: () => 0,
        },
        onComponent({ params, interaction }) {
          const [userId] = params;
          interaction.msg({
            ephemeral: true,
            content: `Привет, ${userId}`,
          });
        },
        calculateCandiesPerRest({ timeDiff }) {
          const secondsRemind = timeDiff / 1_000;
          return Math.floor(secondsRemind / 300);
        },
        callback: {
          async inputCommandParsed(user, curse, context) {
            const { commandBase } = context;
            const targetKeywords = new Map(
              ["click", "клик"].map((key) => [key, true]),
            );

            if (!targetKeywords.has(commandBase)) {
              return;
            }

            const userData = user.data;
            const candyData = (userData[this.EFFECT_ID] ||= {});
            candyData.candies ||= 0;

            const timeDiff = Date.now() - (candyData.receiveAt ?? Date.now());
            const _context = {
              user,
              curse,
              context,
              candyData,
              timeDiff,
            };
            const value =
              random(1, userData.level) +
              this.calculateCandiesPerRest(_context);

            candyData.candies += value;

            candyData.receiveAt = Date.now();
            const { channel } = context;
            const message = await channel.msg({
              color: "#65dbeb",
              description: `+ ${value} :candy:`,
              components: justButtonComponents({
                emoji: "🍬",
                customId: `@curseManager/events/candyFactory:${user.id}`,
              }),
            });

            CurseManager.interface({ user, curse }).setProgress(
              candyData.candies,
            );

            await sleep(7_000);
            random(1) ? context.message.delete() : message.delete();
          },
        },
        reward: 5,
      },
      {
        _weight: 3,
        id: "learnTogether",
        description:
          "Упомяните до 5 участников, вместе вы должны получить опыта",
        hard: 1,
        values: {
          goal: (user) => user.data.level * LEVELINCREASE_EXPERIENCE_PER_LEVEL,
          timer: () => DAY,
          listOfUsers: () => [],
        },
        callback: {
          messageCreate(user, curse, message) {
            const { content } = message;
            const mentionId = content.match(MessageMentions.UsersPattern)?.[1];

            if (!mentionId) {
              return;
            }

            const target = message.client.users.cache.get(mentionId);
            if (target.id === user.id || target.bot) {
              return;
            }

            const list = curse.values.listOfUsers || [];

            if (list.includes(target.id) || list.length >= 5) {
              message.react("❌");
              return;
            }

            message.react("💀");

            list.push(target.id);
            const effectsToHear = Object.fromEntries(
              [ActionsMap.resourceChange].map((action) => [action, true]),
            );
            provideTunnel(target, user, effectsToHear);
          },
          resourceChange(user, curse, context) {
            const { value, resource } = context;
            if (resource !== PropertiesEnum.exp) {
              return;
            }
            CurseManager.interface({ user, curse }).incrementProgress(value);
          },
          tunnelMessageReceive(user, curse, context) {
            const { data } = context;
            context.resumeAlive();
            this.callback.resourceChange.call(this, user, curse, data);
          },
        },
        interactionIsLong: true,
        reward: 12,
      },
      {
        _weight: 2,
        id: "collectDino",
        description: "Соберите 20 монстров",
        hard: 1,
        values: {
          goal: () => 20,
          timer: () => DAY,
          progress: (user) => user.data.monster,
        },
        callback: {
          resourceChange(user, curse, context) {
            const { resource } = context;
            if (resource !== PropertiesEnum.monster) {
              return;
            }

            const value = user.data.monster;
            CurseManager.interface({ user, curse }).setProgress(value);
          },
          beforeProfileDisplay(user, curse) {
            const value = user.data.monster ?? 0;
            CurseManager.interface({ user, curse }).setProgress(value);
          },
        },
        interactionIsShort: true,
        reward: 15,
        filter: (user) => user.data.monster >= 3,
      },
      {
        _weight: 2,
        id: "collectDinoGrande",
        description: "Соберите 80 монстров",
        hard: 1,
        values: {
          goal: () => 80,
          timer: () => DAY,
          progress: (user) => user.data.monster,
        },
        callback: {
          resourceChange(user, curse, context) {
            const { resource } = context;
            if (resource !== PropertiesEnum.monster) {
              return;
            }

            const value = user.data.monster;
            CurseManager.interface({ user, curse }).setProgress(value);
          },
          beforeProfileDisplay(user, curse) {
            const value = user.data.monster ?? 0;
            CurseManager.interface({ user, curse }).setProgress(value);
          },
        },
        interactionIsShort: true,
        reward: 20,
        filter: (user) => user.data.monster >= 30,
      },
      {
        _weight: 2,
        id: "transfiguro",
        description:
          "Вы поменяетесь коинами со следующим участником, которого упомянете",
        hard: 0,
        values: {
          goal: () => 1,
          timer: () => MINUTE * 15,
        },
        callback: {
          messageCreate(user, curse, message) {
            const { content } = message;
            const mentionId = content.match(MessageMentions.UsersPattern)
              ?.groups.id;
            if (!mentionId) {
              return;
            }

            const { guild, channel } = message;
            const target = guild.members.cache.get(mentionId)?.user;
            if (!target || target.id === user.id || target.bot) {
              return;
            }
            CurseManager.interface({ user, curse }).incrementProgress(1);

            const value = user.data.coins - target.data.coins;
            addResource({
              user,
              resource: PropertiesEnum.coins,
              value: -value,
              executor: user,
              source: "curseManager.events.transfiguro",
              context: { message, curse, user, target },
            });
            addResource({
              user: target,
              resource: PropertiesEnum.coins,
              value,
              executor: user,
              source: "curseManager.events.transfiguro",
              context: { message, curse, user, target },
            });
            message.react("💀");
            channel.msg({
              description: `${user.toString()} и ${target.toString()} поменялись коинами`,
              color: "#6534bf",
              reference: message.id,
              footer: { text: "Трансфигурейшн произошло!" },
            });
          },
        },
        interactionIsShort: true,
        reward: 5,
      },
      {
        _weight: 2,
        id: "cheeseHere",
        EFFECT_ID: "curseManager.events.cheeseHere",
        COINS_COUNT: 199,
        description: "Сыр здесь. Заработаете 200 коинов",
        hard: 0,
        values: {
          goal() {
            return this.COINS_COUNT;
          },
          timer: () => MINUTE * 15,
          upped: () => 0,
          progress: () => 0,
        },
        processUpped(curse, value) {
          if (value >= curse.values.goal === false) {
            return;
          }
          curse.values.goal = value + this.COINS_COUNT;
          curse.values.upped++;
        },
        processEnd(user, curse) {
          const { upped } = curse.values;
          const previous = (DataManager.data.bot[this.EFFECT_ID] ||= {
            value: 0,
            userId: null,
          });
          const isBigThan = upped > previous.value;
          if (isBigThan) {
            DataManager.data.bot[this.EFFECT_ID].value;
          }
          this.processUserDisplayUpped(user, {
            curse,
            previous,
            isBigThan,
          });
          if (!isBigThan) {
            return;
          }
          addResource({
            user,
            resource: PropertiesEnum.cheese,
            value: 1,
            executor: user,
            source: "curseManager.events.cheeseHere",
            context: { curse, previous, isBigThan },
          });
          DataManager.data.bot[this.EFFECT_ID] = {
            value: upped,
            userId: user.id,
          };
        },
        processUserDisplayUpped(user, { curse, previous, isBigThan }) {
          const { upped } = curse.values;
          const previousUser = previous.userId
            ? app.client.users.cache.get(previous.userId)
            : null;
          const contents = {
            title: "Рекорд сыра",
            upped: `${user.toString()}, Вы подняли цену сыра ${ending(upped, "раз", "", "", "а", { unite: (quantity, word) => `**${quantity}** ${word}` })}`,
            newRecord: isBigThan ? " — И установили рекорд." : "",
            youCanMore: `Это немного конечно, но ладно.`,
            previous: `Предыдущее достижение: ${ending(previous.value, "подняти", "й", "е", "я")}, пользователем ${previousUser?.displayName || "null :)"}`,
          };
          user.msg({
            color: "#ffcc4d",
            description: `:cheese: ${contents.title}. ${contents.upped}!${contents.newRecord} ${contents.youCanMore}\n\n${contents.previous}`,
          });
        },
        callback: {
          resourceChange(user, curse, context) {
            const { resource, value } = context;
            if (resource !== PropertiesEnum.coins) {
              return;
            }
            const progress = Math.max(0, curse.values.progress + value);
            this.processUpped(curse, progress);
            CurseManager.interface({ user, curse }).setProgress(progress);
          },
          beforeProfileDisplay(user, curse) {
            const progress = curse.values.progress;
            this.processUpped(curse, progress);
          },
          curseTimeEnd(user, curse, data) {
            if (curse !== data.curse) {
              return;
            }
            if (curse.values.upped === 0) {
              return;
            }
            data.event.preventDefault();
            CurseManager.interface({ user, curse }).success();

            const progress = curse.values.progress;
            this.processUpped(curse, progress);
            this.processEnd(user, curse);
          },
        },
        interactionIsShort: true,
        reward: 5,
      },
      {
        _weight: 2,
        id: "theChestIsFullOfCurses",
        VOID_COUNT: 2,
        CHEST_COUNT: 300,
        description: (user, curse) => {
          const { voidCount, chestCount } = curse.values;
          return `Следующее открытые сундука даст вам ${ending(voidCount, "нестабильност", "ей", "ь", "и")}, но и отберёт ${ending(chestCount, "бонус", "ов", "", "а")} сундука`;
        },
        hard: 0,
        values: {
          goal: () => 1,
          timer: () => DAY,
          chestCount() {
            return this.CHEST_COUNT;
          },
          voidCount() {
            return this.VOID_COUNT;
          },
        },
        callback: {
          beforeOpenChest(user, curse, context) {
            const {
              values: { voidCount, chestCount },
            } = curse;
            const { treasures } = context;
            treasures.void ||= 0;
            treasures.void += voidCount;
            addResource({
              user,
              value: -chestCount,
              resource: PropertiesEnum.chestBonus,
              executor: null,
              source: "curseManager.events.theChestIsFullOfCurses",
              context,
            });

            CurseManager.interface({ curse, user }).success();
          },
        },
        reward: 5,
      },
      {
        _weight: 5,
        id: "anonToTheSpace",
        description(user, curse) {
          return `Доберитесь до ${curse.values.goal} локации в команде !анон`;
        },
        hard: 1,
        values: {
          goal: () => random(2, 7),
          timer: () => DAY,
        },
        callback: {
          anonTaskResolve(user, curse, context) {
            const { primary } = context;
            const location = primary.auditor.length;
            CurseManager.interface({ user, curse }).setProgress(location);
          },
        },
        reward: 20,
      },
      {
        _weight: 2,
        id: "rottingBag",
        description: "Достаньте клубнику из сумки и продайте её",
        hard: 0,
        values: {
          goal: (user) => Math.ceil(user.data.bag.berrys * 0.5),
          timer: () => MINUTE * 30,
          takedFromBag: () => 0,
        },
        callback: {
          bagItemMove(user, curse, context) {
            if (context.resource !== PropertiesEnum.berrys) {
              return;
            }
            const { isToBag, count } = context;
            curse.values.takedFromBag += isToBag ? -count : count;
          },
          berryBarter(user, curse, context) {
            const { quantity, isBuying } = context;
            if (isBuying) {
              return;
            }
            const { takedFromBag } = curse.values;
            const progress = curse.values.progress || 0;
            const value = clamp(progress, quantity + progress, takedFromBag);
            CurseManager.interface({ user, curse }).setProgress(value);
          },
        },
        filter: (user) => user.data.bag?.berrys > 5,
        reward: 15,
        interactionIsShort: true,
      },
      {
        _weight: 1,
        id: "4elements_of_thing",
        description(user, curse) {
          return `Решите задачу: ${curse.values.generated.map((i) => this.EMOJIS[i]).join("")}`;
        },
        EMOJIS: ["🍃", "☁️", "🔥", "👾"],
        hard: 1,
        values: {
          goal: () => 4,
          generated: () => [0, 1, 2, 3].toSorted(() => Math.random() - 0.5),
          timer: () => DAY * 2,
          progress: () => 0,
        },
        callback: {
          thing(user, curse, context) {
            const { generated, progress } = curse.values;
            const { elementBase } = context;
            if (generated[progress] !== elementBase.index) {
              CurseManager.interface({ user, curse }).setProgress(
                generated[0] === elementBase.index ? 1 : 0,
              );
              return;
            }
            CurseManager.interface({ user, curse }).incrementProgress(1);
          },
        },
        reward: 20,
      },
      {
        _weight: 5,
        id: "mayWorstNeverHappedAgain",
        description: "Следующее проклятие, которое вы выполните, повторится",
        toString() {
          return this.description;
        },
        hard: 0,
        values: {},
        callback: {
          curseEnd(user, curse, context) {
            const { curse: target } = context;
            const { id } = target;
            const base = CurseManager.cursesBase.get(id);
            if (!base._weight || base.id === this.id) {
              return;
            }
            const newCurse = CurseManager.generateOfBase({
              curseBase: base,
              user,
              context,
            });
            newCurse.values.goal = target.values.goal;
            CurseManager.init({ curse: newCurse, user });
            CurseManager.interface({ user, curse }).success();
          },
        },
        reward: 5,
        filter: (user) => user.data.curses.length,
      },
      // MARK: End of curses list
      // {
      //   _weight: 5,
      //   id: "__example",
      //   description:
      //     "Вы не можете класть ресурсы в сумку, как и извлекать их из неё. Проклятие будет засчитано по окончании таймера",
      //   hard: 0,
      //   values: {
      //     goal: (user) => 1,
      //     timer: () => DAY,
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
      setProgress((+curse.values.progress || 0) + value);
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

      if (Object.hasOwnProperty.call(curseBase, "toString")) {
        return curseBase.toString(user, curse);
      }

      const description = (() => {
        const { description } = curseBase;
        return typeof description === "function"
          ? description.call(curseBase, user, curse)
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

    const silentEnd = () => {
      this.curseIndexOnUser({ curse, user }) !== null &&
        CurseManager._curseEnd({ lost: false, user, curse });
    };
    return {
      incrementProgress,
      setProgress,
      _setProgress,
      toString,
      fail,
      success,
      silentEnd,
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
    const { values } = curse;

    if (
      values.goal &&
      !isNaN(values.progress) &&
      values.progress >= values.goal
    ) {
      this.curseIndexOnUser({ curse, user }) !== null &&
        CurseManager.curseEnd({ user, curse, lost: false });

      return;
    }

    if (values.timer && Date.now() > curse.timestamp + values.timer) {
      const context = {
        curse,
        ...createDefaultPreventable(),
      };
      user.action(ActionsMap.curseTimeEnd, context);
      if (!context.defaultPrevented()) {
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

  static _curseEnd({ lost, user, curse }) {
    user.action(ActionsMap.curseEnd, { isLost: lost, curse });
    this.removeCurse({ user, curse });
  }

  static curseEnd({ lost, user, curse }) {
    this._curseEnd({ lost, user, curse });

    const curseBase = CurseManager.cursesBase.get(curse.id);

    const getDefaultFields = () => {
      const fields = [];
      fields.push({
        name: "Прогресс:",
        value: Object.entries(curse.values)
          .map(
            ([key, value]) => `${key}: \`${toLocaleDeveloperString(value)}\``,
          )
          .join("\n"),
      });

      fields.push({
        name: "Основа:",
        value: Object.entries(curseBase)
          .map(
            ([key, value]) => `${key}: \`${toLocaleDeveloperString(value)}\``,
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
      addResource({
        user,
        executor: null,
        value: user.data.level > 1 ? -1 : 0,
        resource: PropertiesEnum.level,
        source: "curseManager.curse.onEnd.lost",
        context: { curse },
      });
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

      addResource({
        user,
        value: coinsReward,
        source: "curseManager.curse.onEnd",
        executor: null,
        resource: PropertiesEnum.coins,
        context: { curse },
      });
      addResource({
        user,
        value: voidReward,
        source: "curseManager.curse.onEnd",
        executor: null,
        resource: PropertiesEnum.void,
        context: { curse },
      });

      const rewardContent = `${ending(coinsReward, "коин", "ов", "", "а")}${
        voidReward
          ? ` и ${ending(voidReward, "нестабильност", "и", "ь", "и")}`
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

Executor.bind("curseManager", (target, { params, interaction }) => {
  if (target === "events") {
    const [event, ...parsed] = params.split(":");
    const base = CurseManager.cursesBase.get(event);
    base.onComponent.call(base, { interaction, params: parsed });

    return;
  }
});
export default CurseManager;
