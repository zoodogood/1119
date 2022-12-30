import * as Util from '#src/modules/util.js';
import DataManager from '#src/modules/DataManager.js';

class Command {

	async onChatInput(msg, interaction){
    let guild = msg.guild;
    let others = ["637533074879414272", "763767958559391795", "630463177314009115", "🧤", "📜", "⚜️", (guild.data.boss?.isArrived ? "⚔️" : null)];

    let users = guild.members.cache.map(e => e.user).filter(el => !el.bot && !el.data.profile_confidentiality).sort((b, a) => ( (a.data.level - 1) * 22.5 * a.data.level + a.data.exp) - ( (b.data.level - 1) * 22.5 * b.data.level + b.data.exp));
    let rangs, sort;

    let pages = [];

    let page = 0;
    let embed = {fields: pages[0], author: {name: `Топ на сервере ${ guild.name }`, iconURL: guild.iconURL()}, title: "Загрузка Топа.."};
    if (pages[1]) embed.footer = {text: `Страница: ${page + 1} / ${pages.length}`};
    let message = await msg.msg(embed);
    let react = "763767958559391795";
    let index = -1;


    embed.edit = true;

    while (true){
      switch (react) {
        case "640449832799961088": page++;
        break;
        case "640449848050712587": page--;
        break;


        case "637533074879414272":
          // coins
          sort = users.sort((a, b) => (b.data.coins + b.data.berrys * DataManager.data.bot.berrysPrise) - (a.data.coins + a.data.berrys * DataManager.data.bot.berrysPrise));
          index = sort.indexOf(msg.author);
          rangs = sort.map((e, i) => {
            let name = (i + 1) + ". " + ((e.id == msg.author.id) ? (e.username) : e.username);
            let value = `— ${e.data.coins} (${ Math.floor( e.data.coins + e.data.berrys * DataManager.data.bot.berrysPrise ) }) <:coin:637533074879414272>`;
            return {name, value};
          });
          break;

        case "763767958559391795":
          // level
          sort = users.sort((b, a) => ( (a.data.level - 1) * 22.5 * a.data.level + a.data.exp) - ( (b.data.level - 1) * 22.5 * b.data.level + b.data.exp));
          index = sort.indexOf(msg.author);
          rangs = sort.map((e, i) => {
            let name = ((i == 0) ? "<a:crystal:637290417360076822> " : (i == 1) ? "<:crys3:763767653571231804> " : (i == 2) ? "<:crys2:763767958559391795>" : "<:crys:637290406958202880> ") + (i + 1) + ". " + ((e.id == msg.author.id) ? (e.username) : e.username);
            let value = `Уровень: **${ e.data.level }** | Опыта: ${(e.data.level - 1) * 22.5 * e.data.level + e.data.exp}`;
            return {name, value};
          });
          break;

        case "630463177314009115":
          // praises
          sort = users.filter(e => e.data.praiseMe).sort((a, b) => (b.data.praiseMe.length) - (a.data.praiseMe.length));
          index = sort.indexOf(msg.author);
          if (!msg.author.data.praiseMe) msg.author.data.praiseMe = [];
          rangs = sort.map((e, i) => {
            let name = (i + 1) + ". " + ((e.id == msg.author.id) ? (e.username) : e.username);
            let value = "— Был похвален " + Util.ending(e.data.praiseMe.length, "раз", "", "", "а") + " <:wellplayed:630463177314009115>";
            return {name, value};
          });
          break;

        case "🧤":
          // thief
          sort = users.sort((a, b) => (b.data.thiefGloves + (~~b.data.thiefWins / 5)) - (a.data.thiefGloves + (~~a.data.thiefWins / 5)));
          index = sort.indexOf(msg.author);
          rangs = sort.map((e, i) => {
            let name = (i + 1) + ". " + e.username;
            let value = `Состояние перчаток: \`${e.data.thiefGloves}|${ e.data.thiefCombo || 0 }\` > Отбито атак: ${e.data.thiefWins | 0}`.replace(/-/g, "!");
            return {name, value};
          });
          break;

        case "📜":
          // quests
          sort = users.filter(e => e.data.dayQuests).sort((a, b) => (b.data.dayQuests) - (a.data.dayQuests));
          index = sort.indexOf(msg.author);
          rangs = sort.map((e, i) => {
            let name = ((i == 0) ? "<a:cupZ:806813908241350696> " : (i == 1) ? "<a:cupY:806813850745176114> " : (i == 2) ? "<a:cupX:806813757832953876> " : "") + (i + 1) + ". " + e.username;
            let value = `Выполнено ежедневных квестов: ${e.data.dayQuests || 0} | Глобальных: ${(e.data.completedQuest || []).length}/${Object.values(quests.names).length}`;
            return {name, value};
          });
          break;

        case "⚜️":
          // void
          sort = users.filter(e => e.data.voidRituals).sort((a, b) => (b.data.voidRituals) - (a.data.voidRituals));
          index = sort.indexOf(msg.author);
          rangs = sort.map((e, i) => {
            let name = (i + 1) + ". " + ((e.id == msg.author.id) ? "?".repeat(e.username.length) : e.username) + ((i == 0) ? " <a:neonThumbnail:806176512159252512>" : "") + (Util.random(9) ? "" : " <a:void:768047066890895360>");
            let value = `Использований котла ${Util.random(3) ? e.data.voidRituals : "???"}`;
            return {name, value};
          });
          break;

        case "⚔️":
          sort = users.filter(user => guild.data.boss.users[user.id]?.damageDealt).sort((a, b) => guild.data.boss.users[b.id].damageDealt - guild.data.boss.users[a.id].damageDealt);
          index = sort.indexOf(msg.author);
          rangs = sort.map((user, i) => {
            const name = `${ i + 1 }. ${ user.username }`;
            const value = `Великий воин нанёс ${ guild.data.boss.users[user.id].damageDealt }ед. урона`;
            return {name, value};
          });
          break;

        default: return;
      }

      if (react != "640449848050712587" && react != "640449832799961088"){
        page = 0;
        pages = [];
        while (rangs.length) pages.push(rangs.splice(0, 15));
      }
      embed.message = index !== -1 ? `Вы находитесь на ${ index + 1 } месте, ${ msg.author.username }` : `Вы не числитесь в этом топе, ${ msg.author.username }`
      embed.footer = (pages[1]) ? {text: `Страница: ${page + 1} / ${pages.length}`} : null;
      embed.fields = (pages[0]) ? pages[page] : [{name: "Ещё никто не попал в топ", value: "Значит вы лёгко можете стать первым(-ой)"}];

      message = await message.msg(embed);
      react = await message.awaitReact({user: msg.author, removeType: "all"}, (page != 0 ? "640449848050712587" : null), ((pages[1] && page != pages.length - 1) ? "640449832799961088" : null), ...others.filter(e => e != react));
    }

  }


	options = {
	  "name": "top",
	  "id": 16,
	  "media": {
	    "description": "\n\nОтображает список лидеров на сервере по различным показателям.\n\nСуществующие данные:\n• Количество коинов\n• Уровень\n• Похвалы\n• Успешность краж\n• Статистика квестов\n• Использование котла\n\n:pencil2:\n```python\n!top #без аргументов\n```\n\n"
	  },
	  "allias": "топ ранги rank ranks rangs лидеры leaderboard leaders",
		"allowDM": true,
		"cooldown": 20000000,
		"type": "user",
		"Permissions": 16384
	};
};

export default Command;