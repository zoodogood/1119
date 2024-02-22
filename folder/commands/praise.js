import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { Actions } from "#lib/modules/ActionManager.js";

class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    const memb = interaction.mention,
      userData = interaction.userData,
      membUser = memb.data;

    if (memb === msg.author) {
      msg.channel.msg({
        title: "Выберите другую жертву объятий!",
        author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
      });
      return;
    }

    const heAccpet = await Util.awaitUserAccept({
      name: "praise",
      message: { title: "Количество похвал ограничено\nПродолжить?" },
      channel: msg.channel,
      userData,
    });
    if (!heAccpet) {
      return;
    }

    userData.praise = userData.praise || [];
    if (userData.praise.length > 1 + Math.floor((userData.level * 1.5) / 10)) {
      msg.channel.msg({
        title: "Вы использовали все похвалы",
        color: "#ff0000",
      });
      return;
    }

    membUser.praiseMe = membUser.praiseMe || [];
    if (userData.praise.includes(memb.id)) {
      msg.channel.msg({ title: "Вы уже хвалили его!" });
      return;
    }

    userData.praise.push(memb.id);
    membUser.praiseMe.push(userData.id);
    msg.channel.msg({
      title: `${memb.username} похвалили ${membUser.praiseMe.length}-й раз\nЭто сделал ${msg.author.username}!`,
      author: { name: memb.username, iconURL: memb.avatarURL() },
    });

    msg.author.action(Actions.likedTheUser, {
      channel: msg.channel,
      target: memb,
      likeType: "byCommand",
    });
    msg.author.action(Actions.praiseUser, {
      channel: msg.channel,
      target: memb,
      msg,
    });
    memb.action(Actions.userPraiseMe, {
      channel: msg.channel,
      msg,
      memb: msg.author,
    });
  }

  options = {
    name: "praise",
    id: 5,
    media: {
      description:
        "\n\nМожете похвалить пользователя, например, если он классный. Однако количество похвал ограничено и зависит от уровня в профиле.\n\n✏️\n```python\n!praise {memb}\n```\n\n",
    },
    alias:
      "похвалить like лайк лайкнуть похвалити лайкнути simpatico симпатико сімпатіко",
    expectMention: true,
    allowDM: true,
    type: "user",
  };
}

export default Command;
