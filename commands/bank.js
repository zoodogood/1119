import * as Util from '#src/modules/util.js';

class Command {

	async onChatInput(msg, interaction){
    let user = interaction.userData, action, coins, cause;
    let server = msg.guild.data;
    const isAdmin = !interaction.mentioner.wastedPermissions(32)[0];


    const cash = async (coins, isPut, cause) => {
      let heAccpet;

      if (coins === "+"){
        coins = isPut ? interaction.userData.coins : server.coins;
      }
      coins = Math.max(Math.floor(coins), 0);

      if (isNaN(coins)) {
        return msg.msg({title: "Указана строка вместо числа", color: "#ff0000", delete: 5000});
      }

      if (coins === 0) {
        return msg.msg({title: "Невозможно положить/взять 0 коинов", color: "#ff0000", delete: 5000});
      }

      if (isPut){
        heAccpet = await Util.awaitUserAccept({name: "bank_put", message: {title: "Вы точно хотите это сделать?", description: "<a:message:794632668137652225> Отправленненные в общую казну коины более не будут предналежать вам, и вы не сможете ими свободно распоряжаться.\nПродолжить?"}, channel: msg.channel, userData: interaction.userData});
        if (!heAccpet) return;

        if (interaction.userData.coins < coins){
          msg.msg({title: "Образовались проблемки..", description: "Недостаточно коинов", color: "#ff0000", delete: 7000});
          return;
        }

        interaction.userData.coins -= coins;
        server.coins += coins;
        msg.guild.logSend({title: "Содержимое банка изменено:", description: `${interaction.mentioner.displayName} отнёс в казну ${Util.ending(coins, "коин", "ов", "а", "ов")}`, footer: {iconURL: msg.author.avatarURL(), text: msg.author.tag}});
        msg.react("👌");
        msg.msg({title: `Вы успешно вложили **${ Util.ending(coins, "коин", "ов", "а", "ов")}** на развитие сервера`, delete: 5000});
        return;
      }

      if (!isPut){
        heAccpet = await Util.awaitUserAccept({name: "bank", message: {title: "Осторожно, ответственность!", description: "<a:message:794632668137652225> Не важно как сюда попадают коины, главное — они предналежат пользователям этого сервера\nРаспоряжайтесь ими с пользой, умом."}, channel: msg.channel, userData: interaction.userData});
        if (!heAccpet) return;
        let problems = [];

        if (!isAdmin)
          problems.push("Для использования содержимого казны требуется право \"Управление сервером\"");
        if (server.coins < coins)
          problems.push(`Похоже, тут пусто. В хранилище лишь ${ Util.ending(server.coins, "коин", "ов", "", "а")}.`);
        if (!cause)
          problems.push(`Вы должны указать причину использования ${ Util.ending(coins, "коин", "ов", "а", "ов")}.`);
        if (!cause || !cause.match(/.{2,}\s+?.{2,}/i))
          problems.push(`Причина обязана содержать минимум 2 слова.`);

        if (problems[0]){
          msg.msg({title: "Образовались проблемки..", description: problems.join("\n"), color: "#ff0000", delete: 7000});
          return;
        }

        interaction.userData.coins += coins;
        server.coins -= coins;
        msg.guild.logSend({title: "Содержимое банка изменено:", description: `${interaction.mentioner.displayName} обналичил казну на сумму **${ Util.ending(coins, "коин", "ов", "а", "ов")}**\nПричина: ${cause}`, footer: {iconURL: msg.author.avatarURL(), text: msg.author.tag}});
        msg.react("👌");
        const title = `Вы успешно взяли **${ Util.ending(coins, "коин", "ов", "а", "ов")}** из казны сервера\nПо причине: ${cause}`;
        msg.msg({title, delete: 5000});
        return;
      }
    }


    if (interaction.params){
      action = interaction.params.split(" ")[0];
      coins  = interaction.params.split(" ")[1];
      cause  = interaction.params.split(" ").slice(2).join(" ");

      if (action == "положить" || action == "put"){
        await cash(coins, true, cause);
        return;
      }

      if (action == "взять"    || action == "take"){
        await cash(coins, false, cause);
        return;
      }
    }





    let embed = {title: "Казна сервера", description: `В хранилище **${ Math.letters(server.coins) }** <:coin:637533074879414272>\n\n<a:message:794632668137652225> ⠿ Заработные платы\n<:meow:637290387655884800> ⠿ Положить\n<:merunna:755844134677512273> ${[..."⠯⠷⠟⠻"].random()} Взять`, author: {name: msg.guild.name, iconURL: msg.guild.iconURL()}, image: "https://media.discordapp.net/attachments/629546680840093696/830774000597991434/96-967226_tree-forest-green-vector-map-of-the-trees.png"};
    let coinInfo = server.coins;
    let react, answer;
    let reactions = ["637290387655884800", isAdmin ? "755844134677512273" : null, "794632668137652225"];
    let message = await msg.msg(embed);
    embed.edit = true;

    while (true) {
      message = await message.msg(embed);
      react = await message.awaitReact({user: msg.author, type: "all"}, ...reactions);
      switch (react) {
        case "637290387655884800":
          answer = await msg.channel.awaitMessage(msg.author, {title: "Укажите сумму коинов, которую хотите внести в казну"});
          if (!answer){
            break;
          }

          await cash(answer.content, true, cause);
          embed.description = `В казну внесли коины`;
          break;
        case "755844134677512273":
          answer = await msg.channel.awaitMessage(msg.author, {title: "Укажите сумму коинов. А также причину их извлечения из общей казны."});
          if (!answer){
            break;
          }

          let coins;

          cause = answer.content.replace(/\d+/, e => {
            coins = e;
            return "";
          }).trim();

          await cash(coins, false, cause);
          embed.description = `Из казны извлекли коины`;
          break;
        case "794632668137652225":
          let professions = msg.guild.data.professions || (msg.guild.data.professions = {});
          let workers = new Set();
          let costs = 0;

          let workersList = "<a:message:794632668137652225> Здесь пока пусто, также тут может быть ваша реклама";
          if (Object.keys(professions).length){
            Object.keys(professions).forEach(([id]) => msg.guild.roles.cache.get(id) ? true : delete professions[id]);

            msg.guild.members.cache.each(memb => {
              Object.entries(professions).forEach(([id, cost]) => memb.roles.cache.has(id) ? workers.add(memb) && (costs += +cost) : false);
            });
            workersList = Object.entries(professions).map(([id, cost]) => {
              let allCost = [...workers].filter(memb => memb.roles.cache.has(id)).length;
              return `${msg.guild.roles.cache.get(id)}\n${cost} <:coin:637533074879414272> в день (${ Util.ending(allCost, "Пользовател", "ей", "ь", "я")})`;
            });
            workersList = workersList.filter(e => e).join("\n");


          }
          let professionManager = await msg.msg({
            title: "- Работы сервера",
            description: `**Созданные профессии ${Object.keys(professions).length}/20**\n${workersList}\n\n\`\`\`Доходы: ${msg.guild.memberCount * 2}\nРасходы: ${costs}\n${ Util.ending(workers.size, "пользовател", "ей", "ь", "я")} получает зарплату\`\`\``,
            footer: {text: "Используйте реакции, чтобы создать, удалить профессию или закрыть это окно."}
          })
          while (true){
            react = await professionManager.awaitReact({user: msg.author, type: "all"}, isAdmin ? "✅" : null, isAdmin ? "❎" : null, "❌");
            embed.description = `<a:message:794632668137652225> Без изменений`;
            if (react == "✅"){
              if (Object.keys(professions).length >= 20){
                msg.msg({title: `Лимит 20 профессий`, delete: 4500, color: "#ff0000"});
                continue;
              }
              answer = await msg.channel.awaitMessage(msg.author, {title: "Укажите айди роли, а также количество коинов, выдаваемое ежедневно"});
              if (!answer) {
                professionManager.delete();
                return;
              }
              answer = answer.content.split(" ");

              let role = msg.guild.roles.cache.get(answer[0]);
              if (!role){
                msg.msg({title: `Не удалось найти роль с айди ${answer[0]}`, delete: 4500, color: "#ff0000"});
                continue;
              }
              if (isNaN(answer[1]) || answer[1] == 0){
                msg.msg({title: `Не указано выдаваемое количество коинов`, delete: 4500, color: "#ff0000"});
                continue;
              }
              msg.guild.data.professions[answer[0]] = Math.max(Math.floor(answer[1]), 1);
              embed.description = `<a:message:794632668137652225> Вы успешно создали новую профессию!\n(${role} ${answer[1]} <:coin:637533074879414272>)`;
            }

            if (react == "❎"){
              answer = await msg.channel.awaitMessage(msg.author, {title: "Укажите айди роли профессии, для её удаления"});
              if (!answer) {
                professionManager.delete();
                return;
              }
              if (answer.content in professions){
                delete professions[answer.content];
                embed.description = `<a:message:794632668137652225> Вы успешно удалили профессию! ${msg.guild.roles.cache.get(answer.content)}`;
              } else {
                msg.msg({title: `Не удалось найти роль с айди ${answer.content} для удаления связанной с ней профессии`, delete: 4500, color: "#ff0000"});
                continue;
              }
            }
            break;
          }

          professionManager.delete();
          break;
        default: return message.delete();
      }
      embed.description += `\n\nВ хранилище: ${ Util.ending(server.coins, "золот", "ых", "ая", "ых")}!\nКоличество коинов ${server.coins - coinInfo === 0 ? "не изменилось" : server.coins - coinInfo > 0 ? "увеличилось на " + (server.coins - coinInfo) : "уменьшилось на " + (coinInfo - server.coins) } <:coin:637533074879414272>`;
    }
  }


	options = {
	  "name": "bank",
	  "id": 50,
	  "media": {
	    "description": "Во-первых, банк позволяет не смешивать приключения с обязанностями, а во-вторых, это просто удобно.\nТакже с их помощью вы можете создать на сервере профессии с автоматически выдаваемыми зарплатами!\n\n:pencil2:\n```python\n!bank <\"взять\" | \"положить\"> <coins | \"+\"> #\"+\" обозначает \"Все коины, которые у вас есть\"\n```",
	    "poster": "https://cdn.discordapp.com/attachments/769566192846635010/872463081672949890/bank.gif"
	  },
	  "allias": "cash банк казна"
	};
};

export default Command;