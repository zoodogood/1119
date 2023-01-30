//@ts-check
import * as Util from '#src/modules/util.js';
import { MessageMentions } from 'discord.js';


class Command {

  removeNotAvailableRoles({guild, tieRoles}){
    for (const controllerId in tieRoles){
      const role = guild.roles.cache.get(controllerId);
      if (!role){
        delete tieRoles[controllerId];
        continue;
      }

      const controllerList = tieRoles[controllerId];

      for (const id of [...controllerList]){
        const role = guild.roles.cache.get(id);
        if (!role){
          const index = controllerList.indexOf(id);
          (~index) && controllerList.splice(index, 1);
        }

        if (!controllerList.length){
          delete tieRoles[controllerId];
        }
        continue;
      }
    }
    return;
  }

  async displayUserRolesInterface({user, interaction}){
    const tieRoles = interaction.guild.data.tieRoles;

    let roleId = interaction.params
      .replace(MessageMentions.UsersPattern, "")
      .trim()
      .match(/\d{17,19}/)
      ?.[1];

    const authorRoles = interaction.member.roles;
    const controledRoles = [...new Set(
      Object.entries(tieRoles)
        .filter(authorRoles.cache.has)
        .map((id, roles) => roles)
        .flat()
    )];
    

    if (!controledRoles.length){
      interaction.channel.msg({
        title: "На этом сервере нет ролей, которыми вы могли бы управлять",
        color: "#ff0000",
        delete: 5000,
        footer: {text: interaction.user.username, iconURL: interaction.user.avatarURL()}
      });
      return;
    }

    if (!roleId){
      const numberReactions = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"]
        .slice(0, controledRoles.length);

      const message = await interaction.channel.msg({title: "Вы не указали айди роли", description: `Выберите доступную вам роль, чтобы снять или выдать её пользователю ${ user.toString() }\n${controledRoles.map((id, i) => `${numberReactions[i]} ${guildRoles[id]}`).join("\n")}`, color: "#00ff00"});
      const react = await message.awaitReact({user: interaction.user, removeType: "all"}, ...numberReactions);
      message.delete();
      react && (roleId = controledRoles.at( numberReactions.indexOf(react) ));
    }

    if (!roleId){
      return;
    }

    const role = interaction.guild.roles.cache.get(roleId);

    if (!role){
      interaction.channel.msg({
        title: "Не удалось найти роль",
        description: `На сервере не найдено роли со следующим ID: \`${ roleId }\``
      });
      return;
    }

    if (!controledRoles.includes(roleId)){
      interaction.channel.msg({
        title: "Отсуствуют связанные роли",
        description: `Вы не можете выдавать ${ role.toString() }. У вас нет связанных с ней контролирующих ролей.\nИх могут создавать и редактировать администраторы сервера командой \`!role\``
      });
      return;
    }

    const member = interaction.guild.members.resolve(user);
    const heAlreadyHas = member.roles.cache.has(roleId);
    member.roles[heAlreadyHas ? "remove" : "add"](roleId);
    interaction.channel.msg({
      title: "Роли участника успешно изменены",
      description: `${heAlreadyHas ? `У ${ member.toString() } отняли` : `${ member.toString() } получил`} роль ${ role.toString() }`,
      delete: 5_000
    });
    return;
  }


	async onChatInput(msg, interaction){
    let heAccpet = await Util.awaitUserAccept({
      name: "tieRoles",
      message: {title: "С помощью этой команды администраторы серверов могут дать своим модераторам возможность выдавать или снимать определенные роли, не давая создавать новые или управлять старыми"},
      channel: msg.channel,
      userData: interaction.userData
    });
    if (!heAccpet) {
      return;
    }

    const tieRoles = msg.guild.data.tieRoles || (msg.guild.data.tieRoles = {});
    const guildRoles = {};

    
    this.removeNotAvailableRoles({guild: interaction.guild, tieRoles});
    


    if (interaction.mention){
      const user = interaction.mention;
      this.displayUserRolesInterface({user, interaction});
      return;
    }


    let page = 0;
    let pages = [];

    const isAdmin = !interaction.mention.wastedPermissions(8)[0];
    const reactions = [
      {emoji: "640449848050712587", filter: () => page != 0},
      {emoji: "640449832799961088", filter: () => pages[1] && page !== pages.length - 1},
      {emoji: "⭐", filter: () => isAdmin},
      {emoji: "❌", filter: () => isAdmin && Object.keys(tieRoles).length !== 0}
    ]


    const createPages = () => pages = Object.entries(tieRoles).map(([control, roles]) => `[${guildRoles[control]}]\n${roles.map(e => `• ${guildRoles[e]}`).join("\n")}`);
    createPages();

    if (pages.length === 0) {
      pages.push("На сервер нет ни одной связи — список пуст.");
    }

    const embed = {
      title: "Связанные роли",
      description: pages[0],
      footer: {
        text: `Чтобы выдать пользователю роль, используйте !роль @упоминание\n${isAdmin ? "С помощью реакций ниже создайте новую связь или удалите старые." : ""}${pages[1] ? `\nСтраница: ${page + 1} / ${pages.length}` : ""}`
      }
    };






    let message = await msg.msg(embed);
    embed.edit = true;

    let react;
    while (true) {
      react = await message.awaitReact({user: msg.author, removeType: "all"}, ...reactions.filter( r => r.filter() ).map( r => r.emoji ));
      switch (react) {
        case "640449832799961088": page++;
        break;
        case "640449848050712587": page--;
        break;

        case "⭐":
          let controller = await msg.channel.awaitMessage(msg.author, {title: "Укажите айди роли", embed: {description: "Она сможет выдавать или снимать участникам позже указанные роли"}});
          if (!controller){
            continue;
          }
          controller = msg.guild.roles.cache.get(controller.content);
          if (!controller){
            msg.msg({title: `Неудалось найти на сервере роль с айди ${controller.content}`, delete: 8000});
            continue;
          }

          let rolesList = await msg.channel.awaitMessage(msg.author, {title: "С чём связать..?", embed: {description: `Через пробел укажите айди всех ролей, которыми будет управлять ${controller.name}`}});
          if (!rolesList){
            continue;
          }
          rolesList = rolesList.content.split(" ").map(e => msg.guild.roles.cache.get(e)).filter(e => e);
          if (rolesList.length === 0){
            msg.msg({title: `Неудалось найти ни одну из указанных ролей`, delete: 8000});
            continue;
          }

          tieRoles[controller.id] = tieRoles[controller.id] || [];
          rolesList.forEach(e => {
            guildRoles[e.id] = e;
            if (e.id in tieRoles[controller.id]){
              return;
            }
            tieRoles[controller.id].push(e.id);
          });
          guildRoles[controller.id] = controller;
          msg.msg({title: `Успешно добавлено ${Util.ending(rolesList.length, "связ", "ей", "ь", "и")}`, footer: {text: "Связь установлена, а главное никакой мистики!"}, description: rolesList.map(role => `• ${role}`).join("\n"), delete: 12000});
          createPages();
        break;

        case "❌":
        let id = Object.keys(tieRoles)[page];
        let deleteRolesMessage = await msg.msg({title: `Вы уверены, что хотите удалить..?`, description: `Вы очистите все связи с ролью ${guildRoles[id]}`});
        react = await deleted.awaitReact({user: msg.author, removeType: "all"}, "685057435161198594", "763807890573885456");
        deleted.delete();

        if (react == "685057435161198594"){
          delete tieRoles[id];
          if (pages[0]){
            pages = ["На сервер нет ни одной связи, вы удалили последнюю — список пуст."];
          }
          msg.msg({title: `Связь #${page + 1} успешно удалена.`, delete: 5000});
          pages = pages.splice(page, 1);
          page = Math.max(page - 1, 0);
          createPages();
        }
        break;

        default:
        return message.delete();
      }
      embed.description = pages[page];
      if (pages[1]) {
        embed.footer.text = embed.footer.text.split("\n").slice(0, 2).join("\n").concat(`\nСтраница: ${page + 1} / ${pages.length}`);
      }
      message.msg(embed);
    }
  }


	options = {
	  "name": "role",
	  "id": 37,
	  "media": {
	    "description": "\n\nБывает такое, что вы хотите дать право для одной роли управлять другой ролью, и только ею? Редко, но такая потребность действительно имеется, и теперь вы знаете что с ней делать!\n\n:pencil2:\n```python\n!role <memb> <roleID> #аргументы нужны только при выдаче / снятии роли. roleID Даже в этом случае необязателен\n```\n\n"
	  },
	  "allias": "роль roles роли",
		"allowDM": true,
		"cooldown": 3000000,
		"type": "guild"
	};
};

export default Command;