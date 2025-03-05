import {
	BaseCommand,
	BaseFlagSubcommand,
} from "#src/commands/BaseCommand/BaseCommand.js";
import { BaseCommandRunContext } from "#src/commands/CommandRunContext.js";
import { SECOND } from "#src/constants/time.js";
import { PermissionsBits } from "#src/discord/permissions.js";
import { transformToCollectionUsingKey } from "#src/nodejs/Collection/transformToCollectionUsingKey.js";
import { CliParser } from "@zoodogood/utils/CliParser";
import { sendToLogsChannel, SpecialChannel } from "./special_channel_enum.js";

const SpecialChannelExtend = transformToCollectionUsingKey([
	{
		key: "chatChannel",
		congratulations: (channel) => `#${channel.name} канал стал чатом!`,
		onDisableMessage: () => "Отправляемые в чат уведомления откючены",
	},
	{
		key: "logChannel",
		congratulations: (channel) =>
			`Готово, в #${channel.name} будут отправляться логи сервера!`,
		onDisableMessage: () => "Логи отключены",
	},
	{
		key: "hiChannel",
	},
]);

class CommandRunContext extends BaseCommandRunContext {
	_specialChannelType = null;

	parseCli(input) {
		const parsed = new CliParser()
			.setText(input)
			.captureFlags(this.command.options.cliParser.flags)
			.collect();
		const values = parsed.resolveValues((capture) => capture?.toString());
		this.setCliParsed(parsed, values);
		return parsed;
	}
	async specialChannelType() {
		return this._specialChannelType;
	}
}

class CommandDefaultBehaviour extends BaseFlagSubcommand {
	async onProcess() {
		const { interaction, user, guild } = this.context;
		const { mentions } = interaction.message;
		const type = await this.context.specialChannelType();
		const channel = mentions.channels.first() ?? interaction.channel;

		guild.data[type] = channel.id;
		interaction.msg({
			title: SpecialChannelExtend.get(type).congratulations(channel),
			delete: 9 * SECOND,
		});
		sendToLogsChannel(guild, {
			description: `Каналу #${channel.name} установили метку «${SpecialChannel.get(type).label}»`,
			author: { name: user.username, avatarURL: user.avatarURL() },
		});
	}
}

class Remove_FlagSubcommand extends BaseFlagSubcommand {
	static FLAG_DATA = {
		name: "--remove",
		capture: ["--remove"],
	};
	async onProcess() {
		const { guild, interaction } = this.context;
		const type = await this.context.specialChannelType();
		await sendToLogsChannel(guild, {
			description: SpecialChannelExtend.get(type).onDisableMessage(),
			author: {
				name: interaction.user.username,
				avatarURL: interaction.user.avatarURL(),
			},
		});
		delete guild.data[type];
		interaction.msg({
			title: `«${SpecialChannel.get(type).label}» канал отключен!`,
			delete: 9 * SECOND,
		});
	}
}
class Command extends BaseCommand {
	options = {
		name: "setchannel",
		id: 11,
		media: {
			description:
				"Устанавливает для бота указанный канал, как чат, туда будет отправляться ежедневная статистика, а также не будут удалятся сообщения о повышении уровня.",
			example: `!setChan <channel>`,
		},
		cliParser: {
			flags: [Remove_FlagSubcommand.FLAG_DATA],
		},
		alias:
			"setchan setchat установитьчат встановитичат setlogs установитьлоги встановитилоги",
		allowDM: true,
		type: "guild",
		userPermissions: PermissionsBits.ManageGuild,
	};

	async onChatInput(msg, interaction) {
		const context = new CommandRunContext(interaction, this);
		context.setWhenRunExecuted(this.run(context));
		return context;
	}

	processRemoveFlag(context) {
		const value = context.cliParsed.at(1).get("--remove");
		if (!value) {
			return false;
		}
		new Remove_FlagSubcommand(context).onProcess();
		return true;
	}

	async run(context) {
		context.parseCli(context.interaction.params);
		if (await this.processRemoveFlag(context)) {
			return;
		}
		await new CommandDefaultBehaviour(context).onProcess();
	}
}

export default Command;
