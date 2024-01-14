import { transformToCollectionUsingKey } from "#bot/util.js";
import { Emoji } from "#constants/emojis.js";
import CurseManager from "#lib/modules/CurseManager.js";
import DataManager from "#lib/modules/DataManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { sleep } from "#lib/safe-utils.js";
import { addResource } from "#lib/util.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";

export const PRE_PHRASES = [
  () => "Эта музыка не спешит заканчиваться :notes:",
  () => "Хо-хо-хо :robot:",
  () =>
    "**Хо-хо-хо, @everyone, Отправляйте сообщения, чтобы получить проклятие зимнего праздника :snowflake: !**",
];
export const SNOWFLAKES_TO_PRESENT = 200;

export function initSnowyEventIn(guild) {
  return (guild.data.snowyEvent = { preGlowExplorers: [], isArrived: true });
}

export function checkAvailableIn(_guild) {
  const [day, month] = DataManager.data.bot.dayDate.split(".");
  const STARTS_AT = 20;
  const ENDS_AT = 31;
  const MONTH = 12;
  return month === MONTH && day >= STARTS_AT && day <= ENDS_AT;
}

export function getSnowyEventIn(guild) {
  return guild.data.snowyEvent;
}

export function getOrInitSnowyEventIn(guild) {
  return getSnowyEventIn(guild) || initSnowyEventIn(guild);
}

export async function onGetCoinsFromMessage({ user, message }) {
  if (!getSnowyEventIn(guild)) {
    return;
  }
  const { guild } = message;
  if (!guild) {
    return;
  }

  const snowyEvent = getOrInitSnowyEventIn(guild);

  if (snowyEvent.preGlowExplorers.length < PRE_PHRASES.length) {
    if (snowyEvent.preGlowExplorers.includes(user.id)) {
      return;
    }
    message.react("🌲");
    snowyEvent.preGlowExplorers.push(user.id);
    message.channel.sendTyping();

    await sleep(2_500);
    const content = PRE_PHRASES.at(snowyEvent.preGlowExplorers.length - 1)();
    message.channel.msg({
      reference: message.id,
      content,
    });
    return;
  }

  const userData = user.data;
  if (userData.curses?.some((curse) => curse.id === "happySnowy")) {
    return;
  }

  message.react("🌲");
  const curseBase = CurseManager.cursesBase.get("happySnowy");
  const curse = CurseManager.generateOfBase({
    curseBase,
    user,
    context: { message, guild },
  });
  CurseManager.init({ curse, user });
  return;
}

export function getPresentsList() {
  return transformToCollectionUsingKey([
    {
      weights: 5,
      key: "lollipop",
      async callback(context) {
        const { user } = context;
        const { CommandUtil } = (await import("#folder/commands/bag.js"))
          .default;
        CommandUtil.addResourceAndMoveToBag({
          resource: PropertiesEnum.lollipops,
          user,
          context,
          executor: user,
          value: 1,
          source: "curseManager.events.happySnowy.presents.lollipop",
        });
      },
      emoji: Emoji.lollipops,
      description:
        "Леденец. Используйте леденец в сумке !bag use lollipop, чтобы призвать босса на сервер",
    },
    {
      weights: 15,
      key: "snowyTree",
      callback(context) {
        const { user } = context;
        addResource({
          resource: PropertiesEnum.snowyTree,
          user,
          context,
          executor: user,
          value: 1,
          source: "curseManager.events.happySnowy.presents.snowyTree",
        });
      },
      emoji: Emoji.snowyTree,
      description:
        "Символ дерево - эмблема. Этот редкий предмет останется с вами ещё надолго",
    },
    {
      weights: 5,
      key: "presentsPack",
      callback(context) {
        const { user } = context;
        addResource({
          resource: PropertiesEnum.presents,
          user,
          context,
          executor: user,
          value: 3,
          source: "curseManager.events.happySnowy.presents.presentsPack",
        });
      },
      emoji: Emoji.presentsPack,
      description: "Коробка подарков. Уже распаковано — три подарка получено",
    },
    {
      weights: 15,
      key: "bonuses",
      callback(context) {
        const { user } = context;
        addResource({
          resource: PropertiesEnum.chestBonus,
          user,
          context,
          executor: user,
          value: 90,
          source: "curseManager.events.happySnowy.presents.bonuses",
        });
      },
      emoji: Emoji.chestBonus,
      description: "90 сундуков. В подарке было 90 сундуков",
    },
    {
      weights: 20,
      key: "multiVoid",
      callback(context) {
        const { user } = context;
        addResource({
          resource: PropertiesEnum.void,
          user,
          context,
          executor: user,
          value: 3,
          source: "curseManager.events.happySnowy.presents.multiVoid",
        });
      },
      emoji: Emoji.void,
      description: "3 нестабильности. В подарке было 3 нестабильности",
    },
    {
      weights: 10,
      key: "snowyQuote",
      async callback(context) {
        context.provideComponents(
          justButtonComponents([
            {
              label: "Читать",
            },
          ]),
        );

        context.onComponent = async (interaction) => {
          const { getNewYearQuote } = await import("#lib/getNewYearQuote.js");
          await sleep(1000);
          interaction.msg({
            description: getNewYearQuote(),
            footer: {
              text: "Большинство цитат взяты отсюда: https://citaty.info/topic/novyi-god, они так же могут быть получены по API",
            },
          });

          context.componentsCollector.stop();
        };
      },
      emoji: Emoji.plain_scroll,
      description:
        "Новогодняя цитата. Бот хочет отправить вам одну из доступных цитат",
    },
    {
      weights: 20,
      key: "coins",
      callback(context) {
        const { user } = context;
        addResource({
          resource: PropertiesEnum.coins,
          user,
          context,
          executor: user,
          value: 9_000,
          source: "curseManager.events.happySnowy.presents.coins",
        });
      },
      emoji: Emoji.coins,
      description: "9 000 коинов. В подарке 9 000 коинов",
    },
    {
      weights: 10,
      key: "oneVoid",
      callback(context) {
        const { user } = context;
        addResource({
          resource: PropertiesEnum.void,
          user,
          context,
          executor: user,
          value: 1,
          source: "curseManager.events.happySnowy.presents.oneVoid",
        });
      },
      emoji: Emoji.void,
      description: "Нестабильность. Получите нестабильность!",
    },
  ]);
}
