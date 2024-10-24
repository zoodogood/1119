import { PermissionFlagsBits } from "discord.js";

const CustomPermissionBits = {};

export const PermissionFlags = {
  [PermissionFlagsBits.Speak]: "PermissionFlagsBits.Speak",
  [PermissionFlagsBits.MuteMembers]: "PermissionFlagsBits.MuteMembers",
  [PermissionFlagsBits.Connect]: "PermissionFlagsBits.Connect",
  [PermissionFlagsBits.DeafenMembers]: "PermissionFlagsBits.DeafenMembers",
  [PermissionFlagsBits.ViewChannel]: "PermissionFlagsBits.ViewChannel",
  [PermissionFlagsBits.EmbedLinks]: "PermissionFlagsBits.EmbedLinks",
  [PermissionFlagsBits.AttachFiles]: "PermissionFlagsBits.AttachFiles",
  [PermissionFlagsBits.BanMembers]: "PermissionFlagsBits.BanMembers",
  [PermissionFlagsBits.ManageRoles]: "PermissionFlagsBits.ManageRoles",
  [PermissionFlagsBits.KickMembers]: "PermissionFlagsBits.KickMembers",
  [PermissionFlagsBits.MentionEveryone]: "PermissionFlagsBits.MentionEveryone",
  [PermissionFlagsBits.ManageGuild]: "PermissionFlagsBits.ManageGuild",
  [PermissionFlagsBits.AddReactions]: "PermissionFlagsBits.AddReactions",
  [PermissionFlagsBits.UseVAD]: "PermissionFlagsBits.UseVAD",
  [PermissionFlagsBits.MoveMembers]: "PermissionFlagsBits.MoveMembers",
  [PermissionFlagsBits.SendMessages]: "PermissionFlagsBits.SendMessages",
  [PermissionFlagsBits.ManageChannels]: "PermissionFlagsBits.ManageChannels",
  [PermissionFlagsBits.PrioritySpeaker]: "PermissionFlagsBits.PrioritySpeaker",
  [PermissionFlagsBits.ManageWebhooks]: "PermissionFlagsBits.ManageWebhooks",
  [PermissionFlagsBits.ChangeNickname]: "PermissionFlagsBits.ChangeNickname",
  [PermissionFlagsBits.ManageNicknames]: "PermissionFlagsBits.ManageNicknames",
  [PermissionFlagsBits.ManageMessages]: "PermissionFlagsBits.ManageMessages",
  [PermissionFlagsBits.Administrator]: "PermissionFlagsBits.Administrator",
  [PermissionFlagsBits.SendTTSMessages]: "PermissionFlagsBits.SendTTSMessages",
  [PermissionFlagsBits.ViewAuditLog]: "PermissionFlagsBits.ViewAuditLog",
  [PermissionFlagsBits.CreateInstantInvite]:
    "PermissionFlagsBits.CreateInstantInvite",
  [PermissionFlagsBits.ReadMessageHistory]:
    "PermissionFlagsBits.ReadMessageHistory",
  [PermissionFlagsBits.UseExternalEmojis]:
    "PermissionFlagsBits.UseExternalEmojis",
  [PermissionFlagsBits.ViewGuildInsights]:
    "PermissionFlagsBits.ViewGuildInsights",
  [PermissionFlagsBits.Stream]: "PermissionFlagsBits.Stream",
  [PermissionFlagsBits.ManageGuildExpressions]:
    "PermissionFlagsBits.ManageGuildExpressions",
  [PermissionFlagsBits.UseApplicationCommands]:
    "PermissionFlagsBits.UseApplicationCommands",
  [PermissionFlagsBits.RequestToSpeak]: "PermissionFlagsBits.RequestToSpeak",
  [PermissionFlagsBits.ManageEvents]: "PermissionFlagsBits.ManageEvents",
  [PermissionFlagsBits.ManageThreads]: "PermissionFlagsBits.ManageThreads",
  [PermissionFlagsBits.CreatePublicThreads]:
    "PermissionFlagsBits.CreatePublicThreads",
  [PermissionFlagsBits.CreatePrivateThreads]:
    "PermissionFlagsBits.CreatePrivateThreads",
  [PermissionFlagsBits.UseExternalStickers]:
    "PermissionFlagsBits.UseExternalStickers",
  [PermissionFlagsBits.SendMessagesInThreads]:
    "PermissionFlagsBits.SendMessagesInThreads",
  [PermissionFlagsBits.UseEmbeddedActivities]:
    "PermissionFlagsBits.UseEmbeddedActivities",
  [PermissionFlagsBits.ModerateMembers]: "PermissionFlagsBits.ModerateMembers",
  [PermissionFlagsBits.ViewCreatorMonetizationAnalytics]:
    "PermissionFlagsBits.ViewCreatorMonetizationAnalytics",
  [PermissionFlagsBits.UseSoundboard]: "PermissionFlagsBits.UseSoundboard",
  [PermissionFlagsBits.UseExternalSounds]:
    "PermissionFlagsBits.UseExternalSounds",
  [PermissionFlagsBits.SendVoiceMessages]:
    "PermissionFlagsBits.SendVoiceMessages",
};

export const PermissionsBits = {
  ...PermissionFlagsBits,
  ...CustomPermissionBits,
};
