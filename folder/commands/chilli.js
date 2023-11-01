import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import { Actions } from "#lib/modules/ActionManager.js";

export const REASON_FOR_CHANGE_NICKNAME = "Special: in chilli game";
const FOOTER_EMOJI =
  "https://media.discordapp.net/attachments/629546680840093696/1158272956812759050/hot-pepper-2179.png?ex=651ba540&is=651a53c0&hm=9cf4a793a57fb7d37d1f3a935fc6b39ad00b015df7ec500d548d4d4920801e64&=";

class Command {
  async onChatInput(msg, interaction) {
    const memb = interaction.mention;
    let chilli =
      msg.channel.chilli &&
      msg.channel.chilli.find((chilli) => chilli.current === msg.author.id);
    setTimeout(() => msg.delete(), 30_000);

    const guildMembers = interaction.guild.members;
    const addName = (member) => {
      const newName = member.displayName + "(🌶)";
      member.setNickname(newName, REASON_FOR_CHANGE_NICKNAME).catch(() => {});
    };
    const removeName = (member) => {
      const newName = member.displayName.replace(/\(🌶\)/g, "").trim();
      member.setNickname(newName, REASON_FOR_CHANGE_NICKNAME).catch(() => {});
    };

    if (!chilli && !msg.author.data.chilli) {
      return msg.msg({
        title:
          "Для броска у вас должен быть чилли 🌶️\nКупить его можно в !лавке",
        color: "#ff0000",
        delete: 5000,
        footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
      });
    }
    if (
      msg.channel.chilli &&
      msg.channel.chilli.find((channelChilli) => channelChilli.id === memb.id)
    ) {
      return msg.msg({
        title: "Вы не можете бросить перец в участника с перцем в руке",
        color: "#ff0000",
        footer: { iconURL: FOOTER_EMOJI, text: "Перчик™" },
      });
    }
    if (memb.bot) {
      return msg.msg({
        title: "🤬🤬🤬",
        description: "it's hot fruitctttt",
        color: "#ff0000",
        footer: {
          iconURL: FOOTER_EMOJI,
          text: "Кое-кто бросил перец в бота..",
        },
      });
    }

    if (chilli) {
      chilli.current = memb.id;
      chilli.players[msg.author.id] = ++chilli.players[msg.author.id] || 1;
      removeName(guildMembers.resolve(interaction.mention));
      addName(guildMembers.resolve(memb));

      msg.msg({
        title: ["Бросок!", "А говорят перцы не летают..."].random(),
        description: `Вы бросили перчиком в ${memb}`,
        author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
        footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
        delete: 7000,
      });

      chilli.rebounds++;
      clearTimeout(chilli.kickTimeout);
      chilli.kickTimeout = setTimeout(
        () => (
          msg.channel.chilli &&
            msg.channel.chilli.includes(chilli) &&
            chilli.timeout._onTimeout(),
          clearTimeout(chilli.timeout)
        ),
        5500,
      );
      return;
    }

    const confirm = await msg.msg({
      title: "Подготовка",
      description: `${msg.author.username}, вы бросили перец, нажмите "❌" чтобы отменить`,
      reactions: ["❌"],
    });

    await Util.sleep(2000);
    confirm.delete();

    const confirmed = !confirm.reactions.cache
      .get("❌")
      .users.cache.has(msg.author.id);
    if (!confirmed) {
      msg.msg({ title: "Отменено 🌶️", delete: 7000 });
      return;
    }

    msg.author.data.chilli--;
    msg.channel.chilli = msg.channel.chilli || [];

    msg.msg({
      title: "Перец падает! Перец падает!!",
      description: `\\*перец упал в руки ${memb.toString()}\\*\nЧтобы кинуть обратно используйте \`!chilli @memb\``,
      author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
      footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
    });
    addName(guildMembers.resolve(memb));
    let ms = Util.random(30, 37) * 1000;

    chilli = {
      timestamp: Date.now() + ms,
      players: {},
      current: memb.id,
      rebounds: 0,
      author: msg.author.id,
    };
    chilli.players[memb.id] = 0;
    chilli.players[msg.author.id] = 0;

    msg.channel.chilli.push(chilli);

    chilli.timeout = setTimeout(() => {
      const member = guildMembers.cache.get(chilli.current);

      Object.keys(chilli.players).forEach((id) => {
        const user = client.users.cache.get(id);
        user.action(Actions.chilliBooh, {
          boohTarget: member,
          chilli,
          msg,
          interaction,
        });
        removeName(guildMembers.resolve(user));
      });

      msg.msg({
        title: "Бах! Перчик взорвался!",
        description: `Перец бахнул прямо у ${member}\nИгра окончена.\nБыло совершено отскоков: ${chilli.rebounds}`,
        fields: Object.entries(chilli.players)
          .sortBy("1", true)
          .map(([id, score]) => ({
            name: guildMembers.cache.get(id).user.username,
            value: `Счёт: ${score}`,
          }))
          .slice(0, 20),
        footer: { iconURL: FOOTER_EMOJI, text: "Безудержный перчик™" },
      });
      removeName(member);
      msg.channel.chilli.splice(msg.channel.chilli.indexOf(chilli), 1);

      if (!msg.channel.chilli[0]) {
        delete msg.channel.chilli;
      }
    }, ms);
  }

  options = {
    name: "chilli",
    id: 38,
    media: {
      description:
        '\n\nМини-игра "Жгучий перчик" подразумивает перебрасывание вымешленного перца, который через некоторое время бабахнет в руках у одного из участников — в этом случае игрок проигрывает.\nСтратегия здесь приветсвуется, а сама игра отлично подходит для проведения турниров.\n\n✏️\n```python\n!chilli {memb}\n```\n\n',
    },
    allias: "перчик перец перець",
    expectMention: true,
    allowDM: true,
    hidden: true,
    cooldown: 3_500,
    cooldownTry: 2,
    type: "other",
  };
}

export default Command;
