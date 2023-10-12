import { client } from '#bot/client.js';
import { PermissionFlagsBits } from 'discord.js';

class Command {

	async onChatInput(msg, interaction){
    let guild = msg.guild;
    let guildMember = guild.members.resolve(interaction.mention);
    let role;



    if (interaction.mention === msg.author)
      return msg.msg({title: "Если вы смогли отправить это сообщение, значит вы не в муте, верно?", author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, delete: 12000});

    if (interaction.mention === client.user)
      return msg.msg({title: "Благодарю, но я не в муте", delete: 12000});

    if (interaction.mention.bot)
      return msg.msg({title: "Существует легенда о.. А впрочем не важно. Невозможно размутить другого бота", description: "Но замутить его я все-равно не могу.", delete: 12000});

    if (guildMember.roles.highest.position > interaction.mention.roles.highest.position)
      return msg.msg({title: "Вы не можете размутить участника, роли которого выше ваших", author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, delete: 12000});

    if (guildMember.permissions.has(PermissionFlagsBits.Administrator))
      return msg.msg({title: "Вы не можете размутить Администратора, как бы это странно не звучало.", author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, delete: 12000});



    // find muted role
    if (guild.data.mute_role)
      role = guild.roles.cache.get(guild.data.mute_role);
    



    if (!guildMember.roles.cache.get(role?.id)){
      msg.msg({title: "Участник не имеет роли мута", description: `Если по какой-то причине вам нужно отозвать запрет на общение в каналах, замутьте пользователя на 1с или выдайте и заберите роль ${role}`, color: "#ff0000"});
      return;
    }

    guildMember.roles.remove(role);


    let embed = {
      description: `С пользователя сняты ограничения на общение в чатах`,
      color: "#de3c37",
      author: {name: guildMember.displayName, iconURL: guildMember.user.displayAvatarURL()},
      footer: {text: `Мут cнял ${msg.author.username}`, iconURL: msg.author.avatarURL()}
    }

    msg.guild.logSend({title: "С участника снят мут", ...embed});
    msg.msg({title: "С участника сняли мут", ...embed});
  }


	options = {
	  "name": "unmute",
	  "id": 18,
	  "media": {
	    "description": "\n\nМут наоборот — снимает ограничения на общение в чатах для пользователей.\n\n✏️\n```python\n!unmute {memb}\n```\n\n"
	  },
	  "allias": "анмут анмьют відглушити",
		"expectMention": true,
		"allowDM": true,
		"type": "guild",
		"myPermissions": 268435456,
		"Permissions": 4194304
	};
};

export default Command;