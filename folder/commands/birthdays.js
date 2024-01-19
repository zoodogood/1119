import DataManager from "#lib/modules/DataManager.js";

class Command {
  async onChatInput(msg, interaction) {
    const splitDate = (date) => date.split(".").map(Number);

    const [currentDay, currentMonth] = splitDate(DataManager.data.bot.dayDate);

    const users = msg.guild.members.cache
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

    msg.msg({ title: title, description, fields, footer });
  }

  options = {
    name: "birthdays",
    id: 22,
    media: {
      description:
        "\n\nОтображает список ближайших именинников! :tada:\nНе забудьте поздравить их с праздником.\n\n✏️\n```python\n!birthdays #без аргументов\n```\n\n",
    },
    alias: "parties праздники вечеринки днирождения др днінарождення",
    allowDM: true,
    cooldown: 15_000,
    type: "user",
  };
}

export default Command;
