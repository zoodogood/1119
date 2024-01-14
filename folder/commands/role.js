//@ts-check
import * as Util from '#lib/util.js';
import { MessageMentions } from 'discord.js';


class Command {

  getTieRoles(guild){
    return (guild.data.tieRoles ||= {});
  }

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

    const authorRolesCache = interaction.member.roles.cache;
    const controledRoles = [...new Set(
      Object.entries(tieRoles)
        .filter(([id]) => authorRolesCache.has(id))
        .map(([id, roles]) => roles)
        .flat()
    )];

    if (!controledRoles.length){
      interaction.channel.msg({
        title: "На этом сервере нет ролей, которыми вы могли бы управлять",
        color: "#ff0000",
        delete: 5_000,
        footer: {text: interaction.user.username, iconURL: interaction.user.avatarURL()}
      });
      return;
    }

    if (!roleId){
      const numberReactions = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"]
        .slice(0, controledRoles.length);

      const contents = {
        list: controledRoles.slice(0, numberReactions.length)
          .map((id, i) => `${ numberReactions[i] } ${ interaction.guild.roles.cache.get(id)?.toString() }`)
          .join("\n")
      }

      const message = await interaction.channel.msg({
        title: "Вы не указали айди роли",
        description: `Выберите доступную вам роль, чтобы снять или выдать её пользователю ${ user.toString() }\n${ contents.list }`,
        color: "#00ff00"
      });
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
      description: `${heAlreadyHas ? `У ${ member.toString() } снята` : `${ member.toString() } получил`} роль ${ role.toString() }`,
      delete: 5_000
    });
    return;
  }

  async displayRolesListInterface(interaction){
    const context = {
      page: 0,
      pagesCount: Object.keys(this.getTieRoles(interaction.guild)).length,
      interaction,
      userIsAdmin: !interaction.member.wastedPermissions(8n)[0],
      edit: false,
      reactions: null,
      rolesCache: interaction.guild.roles.cache
    }

    context.message = await interaction.channel.msg(
      this.rolesListCreateEmbed(context)
    );
    context.edit = true;

    const filter = (reaction, user) => user === interaction.user && reaction.me;
    const collector = context.message.createReactionCollector({filter, time: 120_000});
    collector.on("collect", (reaction, user) => {
      this.rolesListOnReact(context, reaction, user);
    });
    collector.on("end", () => {
      context.message.delete();
    })
  }

  async rolesListOnReact(context, reaction, user){
    const react = reaction.emoji.id || reaction.emoji.name;
    const { message, interaction } = context;
    message.reactions.removeAll();

    await this.rolesListReactionsCallbacks[react](context);
    context.pagesCount = Object.keys(this.getTieRoles(interaction.guild)).length;

    const embed = this.rolesListCreateEmbed(context);
    context.message.msg(embed);
  }

  rolesListCreateEmbed(context){
    const {interaction, page, pagesCount, edit = false, rolesCache, userIsAdmin} = context;

    const tieRoles = this.getTieRoles(interaction.guild);
    
    const tieToPage = ([controlId, roles]) =>
      `[${ String(rolesCache.get(controlId)) }]\n${
        roles.map(id => `• ${ String(rolesCache.get(id)) }`).join("\n") 
      }`;

    const description = pagesCount ?
      tieToPage( Object.entries(tieRoles).at(page) ) :
      "На сервер нет ни одной связи — список пуст.";



    const embed = {
      title: "Связанные роли",
      description,
      footer: {
        text: `Чтобы выдать пользователю роль, используйте !роль @упоминание\n${ userIsAdmin ? "С помощью реакций ниже создайте новую связь или удалите старые." : "" }${ pagesCount > 1 ? `\nСтраница: ${ page + 1 } / ${ pagesCount }` : "" }`
      },
      edit,
      reactions: this.rolesListCreateReactions(context)
    };

    return embed;
  }


	async onChatInput(msg, interaction){
    let heAccpet = await Util.awaitUserAccept({
      name: "tieRoles",
      message: {title: "С помощью этой команды администраторы серверов могут дать своим модераторам возможность выдавать или снимать определенные роли, не давая создавать новые или управлять старыми"},
      channel: interaction.channel,
      userData: interaction.userData
    });
    if (!heAccpet) {
      return;
    }

    const tieRoles = this.getTieRoles(interaction.guild);

    
    this.removeNotAvailableRoles({guild: interaction.guild, tieRoles});
    


    if (interaction.mention){
      const user = interaction.mention;
      this.displayUserRolesInterface({user, interaction});
      return;
    }


    this.displayRolesListInterface(interaction);
  }

  rolesListCreateReactions({page, userIsAdmin, pagesCount}){
    const reactionsBases = [
      {emoji: "640449848050712587", filter: () => page != 0},
      {emoji: "640449832799961088", filter: () => pagesCount > 1 && page !== pagesCount - 1},
      {emoji: "⭐", filter: () => userIsAdmin},
      {emoji: "❌", filter: () => userIsAdmin && pagesCount}
    ];

    return reactionsBases
      .filter(({filter}) => filter())
      .map(({emoji}) => emoji);
  }

  rolesListReactionsCallbacks = {
    "640449832799961088": (context) => context.page++,

    "640449848050712587": (context) => context.page--,

    "⭐": async (context) => {
      const {interaction, rolesCache} = context;
      let _questionMessage;
      
      _questionMessage = await interaction.channel.msg({title: "Укажите айди роли", description: "Она сможет выдавать или снимать участникам далее указанные роли"});
      const controllerId = (await interaction.channel.awaitMessage({user: interaction.user, remove: true}))?.content;

      if (!controllerId){
        return;
      }
      const controllerRole = rolesCache.get(controllerId);
      if (!controllerRole){
        interaction.channel.msg({title: `Неудалось найти на сервере роль с айди ${ controllerId }`, delete: 12_000});
        return;
      }

      _questionMessage = await interaction.channel.msg({title: "С чём связать..?", description: `Через пробел укажите айди всех ролей, которыми будет управлять ${ controllerRole.name }`});
      const rolesIds = (await interaction.channel.awaitMessage({user: interaction.user, remove: true}))?.content;
      if (!rolesIds){
        return;
      }

      const rolesList = rolesIds
        .split(" ")
        .map(id => rolesCache.get(id))
        .filter(Boolean);

      if (rolesList.length === 0){
        interaction.channel.msg({title: `Неудалось найти ни одну из указанных ролей`, delete: 12_000});
        return;
      }

      const tieRoles = this.getTieRoles(interaction.guild);
      const previousRoles = tieRoles[controllerId] || [];
      tieRoles[controllerId] = [...new Set(
        previousRoles.concat( rolesList.map(role => role.id) )
      )];

      interaction.channel.msg({
        title: `Успешно добавлено: ${ Util.ending(tieRoles[controllerId].length - previousRoles.length, "связ", "ей", "ь", "и") }`,
        footer: {text: "Связь установлена, а главное никакой мистики!"},
        description: rolesList.map(role => `• ${ role }`).join("\n"),
        delete: 20_000
      });
      return;
    },

    "❌": async (context) => {
      const {interaction, rolesCache} = context;

      const tieRoles = this.getTieRoles(interaction.guild);
      const controllerId = Object.keys(tieRoles)[context.page];

      const _questionMessage = await interaction.channel.msg({title: `Вы уверены, что хотите удалить..?`, description: `Вы очистите все связи с ролью ${ rolesCache.get(controllerId) }`});
      const react = await _questionMessage.awaitReact({user: interaction.user, removeType: "all"}, "685057435161198594", "763807890573885456");
      _questionMessage.delete();

      if (react !== "685057435161198594"){
        return;
      }

      delete tieRoles[controllerId];
      context.pagesCount = Object.keys(tieRoles).length;

      interaction.channel.msg({title: `Связь #${ context.page + 1 } успешно удалена.`, delete: 12_000});
      context.page = Math.max(context.page - 1, 0);
    }
  }


	options = {
	  "name": "role",
	  "id": 37,
	  "media": {
	    "description": "\n\nБывает такое, что вы хотите дать право для одной роли управлять другой ролью, и только ею? Редко, но такая потребность действительно имеется, и теперь вы знаете что с ней делать!\n\n✏️\n```python\n!role <memb> <roleID> #аргументы нужны только при выдаче / снятии роли. roleID Даже в этом случае необязателен\n```\n\n"
	  },
	  "alias": "роль roles роли ролі",
		"allowDM": true,
		"cooldown": 3_000,
		"type": "guild"
	};
};

export default Command;