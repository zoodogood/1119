import { ActionsMap } from "#constants/enums/actionsMap.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import DataManager from "#lib/modules/DataManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { addResource } from "#lib/util.js";
import { CliParser } from "@zoodogood/utils/primitives";

class Birthdays {}

class BirthdayMember {
  PRICES_FOR_UPDATE_BIRTHDAY = [1200, 3000, 12000];
  calculateUpdatePrice() {
    return this.PRICES_FOR_UPDATE_BIRTHDAY[this.userData.chestLevel];
  }
  constructor(user) {
    this.user = user;
    this.userData = user.data;
  }

  isValidDate(day, month) {
    return day && month && day <= 31 && day >= 1 && month >= 1 && month <= 12;
  }

  async processUpdate(channel, value) {
    const { user } = this;
    const parsed = value.match(/\d\d\.\d\d/)?.[0];

    const [day, month] = parsed?.split(".").map(Number) || [];

    if (!this.isValidDate(day, month)) {
      channel.msg({
        title: 'Ожидалось значение в формате "19.11", — день, месяц',
        color: "#ff0000",
        delete: 5000,
      });
      return;
    }

    if (!(await this.processExistsBeforeUpdate(channel))) {
      return;
    }

    this.setBirhday(user, parsed);
    channel.msg({ title: "Установлено! 🎉", delete: 5_000 });
    return true;
  }

  setBirhday(user, value) {
    user.data.BDay = value;
    user.action(ActionsMap.globalQuest, { name: "setBirthday" });
  }

  async processExistsBeforeUpdate(channel) {
    const { userData, user } = this;
    if (!userData.BDay) {
      return true;
    }

    const price = this.calculateUpdatePrice();

    const message = await channel.msg({
      title: `Вы уже устанавливали дату своего дня рождения, повторная смена будет стоить вам ${price} коинов\nПродолжить?`,
    });
    const react = await message.awaitReact(
      { user, removeType: "all" },
      "685057435161198594",
      "763807890573885456",
    );

    if (react !== "685057435161198594") {
      channel.msg({
        title: "Действие отменено",
        color: "#ff0000",
        delete: 4000,
      });
      return false;
    }
    if (userData.coins < price) {
      channel.msg({
        title: "Недостаточно коинов",
        color: "#ff0000",
        delete: 4000,
      });
      return false;
    }

    addResource({
      user: user,
      value: -price,
      executor: user,
      source: "command.birthdays.member.update",
      resource: PropertiesEnum.coins,
      context: this,
    });

    return true;
  }
}

class MembersCommandManager {
  constructor(context) {
    this.context = context;
  }
  onProcess() {
    const { channel, guild } = this.context;
    const splitDate = (date) => date.split(".").map(Number);

    const [currentDay, currentMonth] = splitDate(DataManager.data.bot.dayDate);

    const users = guild.members.cache
      .map((member) => member.user)
      .filter((user) => user.data.BDay && !user.data.profile_confidentiality);

    const sortByDate = (userA, userB) => {
      const [aDay, aMonth] = splitDate(userA.data.BDay);
      const [bDay, bMonth] = splitDate(userB.data.BDay);

      if (aMonth !== bMonth) {
        return (-1) ** (aMonth < bMonth);
      }

      if (aDay !== bDay) {
        return (-1) ** (aDay < bDay);
      }

      return 0;
    };

    const usersByBirthdays = {
      inThisYear: [],
      inNextYear: [],
    };

    const checkInThisYear = (day, month) =>
      month > currentMonth || (month === currentMonth && day >= currentDay);

    users.forEach((user) => {
      const [day, month] = splitDate(user.data.BDay);

      const inThisYear = checkInThisYear(day, month);

      inThisYear
        ? usersByBirthdays.inThisYear.push(user)
        : usersByBirthdays.inNextYear.push(user);
    });

    const sortedUsers =
      usersByBirthdays.inThisYear.length >= 20
        ? usersByBirthdays.inThisYear.sort(sortByDate)
        : [
            ...usersByBirthdays.inThisYear.sort(sortByDate),
            ...usersByBirthdays.inNextYear.sort(sortByDate),
          ];

    const daysTo = ({ date: [day, month], current }) => {
      const year = new Date().getFullYear() + +!current;
      const compare = new Date(`${year}.${month}.${day}`);

      const diff = compare.getTime() - Date.now();
      return Math.ceil(diff / 86_400_000);
    };

    const toField = (user) => {
      const isToday = user.data.BDay === DataManager.data.bot.dayDate;
      const inThisYear = checkInThisYear(...splitDate(user.data.BDay));

      const dateContent = isToday ? "сегодня! 🎁" : user.data.BDay;
      const inDaysContent = ` (через ${daysTo({
        current: inThisYear,
        date: splitDate(user.data.BDay),
      })}д.)`;
      const name = `${dateContent}${inDaysContent}`;
      const value = user.tag;
      return { name, value, inline: true };
    };

    const fields = sortedUsers.length
      ? sortedUsers.slice(0, 20).map(toField)
      : [
          {
            name: "Никто не установил дату своего дня рождения",
            value: "Сделать это можно — `!нп др <date>`",
          },
        ];

    const birthdaysToday = DataManager.data.bot.clearParty || 0;

    const title = "🎉 Дни рождения!";
    const description = `Здесь отображаются даты дней рождения пользователей, которые указали эту информацию`;
    const footer = {
      text: birthdaysToday ? `Празднующих сегодня: ${birthdaysToday}` : "glhf",
    };

    channel.msg({ title: title, description, fields, footer });
  }
}

class CommandRunContext extends BaseCommandRunContext {
  parseCli() {
    const parser = new CliParser().setText(this.interaction.params);

    const parsed = parser
      .processBrackets()
      .captureFlags(this.command.options.cliParser.flags)
      .captureResidue({ name: "rest" })
      .collect();

    const values = parsed.resolveValues((capture) => capture?.toString());
    this.setCliParsed(parsed, values);
  }
}
class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  async run(context) {
    context.parseCli();
    if (this.processUpdateCommand(context)) {
      return;
    }
    this.processDefaultBehavior(context);
  }

  processUpdateCommand(context) {
    const { captures } = context.cliParsed.at(0);
    const value = captures.get("--set-birthday")?.valueOfFlag();
    if (!value) {
      return;
    }
    const { channel } = context;
    new BirthdayMember(context.user).processUpdate(channel, value);
    return true;
  }

  processDefaultBehavior(context) {
    new MembersCommandManager(context).onProcess();
  }

  options = {
    name: "birthdays",
    id: 22,
    media: {
      description:
        "\n\nОтображает список ближайших именинников! :tada:\nНе забудьте поздравить их с праздником.\n\n✏️\n```python\n!birthdays #без аргументов\n```\n\n",
    },
    cliParser: {
      flags: [
        {
          name: "--set-birthday",
          capture: ["--set-birthday", "-sb"],
          description: "Установите дату своего дня рождения",
          expectValue: true,
        },
      ],
    },
    accessibility: {
      publicized_on_level: 5,
    },
    alias: "parties праздники вечеринки днирождения др днінарождення",
    allowDM: true,
    cooldown: 15_000,
    type: "user",
  };
}

export default Command;

export { Birthdays, BirthdayMember };
