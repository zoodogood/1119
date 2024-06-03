import { BaseCommand } from "#lib/BaseCommand.js";
class Command extends BaseCommand {
  options = {
    name: "voice",
    id: 21,
    media: {
      description: "Старые тестирования муз. команд.",
      example: `!voice #без аргументов`,
    },
    alias: "войс голосовий",
    allowDM: true,
    type: "dev",
  };

  async onChatInput(msg, interaction) {
    return false;
    let connection;
    if (msg.member.voice.channel)
      connection = await msg.member.voice.channel.join();
    else msg.msg({ title: "Быстро зашёл в войс!" });

    const dispatcher = connection.play(
      ytdl("https://youtu.be/tbr9dXoFKh8", { filter: "audioonly" }),
    );
    //main/images/one.mp3
  }
}

export default Command;
