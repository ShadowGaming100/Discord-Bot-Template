const PERMISSION_LABELS = {
  CreateInstantInvite: 'Create Instant Invite',
  KickMembers: 'Kick Members',
  BanMembers: 'Ban Members',
  Administrator: 'Administrator',
  ManageChannels: 'Manage Channels',
  ManageGuild: 'Manage Server',
  AddReactions: 'Add Reactions',
  ViewAuditLog: 'View Audit Log',
  PrioritySpeaker: 'Priority Speaker',
  Stream: 'Stream / Video',
  ViewChannel: 'View Channel',
  SendMessages: 'Send Messages',
  SendTTSMessages: 'Send TTS Messages',
  ManageMessages: 'Manage Messages',
  EmbedLinks: 'Embed Links',
  AttachFiles: 'Attach Files',
  ReadMessageHistory: 'Read Message History',
  MentionEveryone: 'Mention Everyone',
  UseExternalEmojis: 'Use External Emojis',
  ViewGuildInsights: 'View Server Insights',
  Connect: 'Connect',
  Speak: 'Speak',
  MuteMembers: 'Mute Members',
  DeafenMembers: 'Deafen Members',
  MoveMembers: 'Move Members',
  UseVAD: 'Use Voice Activity',
  ChangeNickname: 'Change Nickname',
  ManageNicknames: 'Manage Nicknames',
  ManageRoles: 'Manage Roles',
  ManageWebhooks: 'Manage Webhooks',
  ManageEmojisAndStickers: 'Manage Emojis and Stickers',
  ManageGuildExpressions: 'Manage Guild Expressions',
  UseApplicationCommands: 'Use Application Commands',
  RequestToSpeak: 'Request to Speak',
  ManageEvents: 'Manage Events',
  ManageThreads: 'Manage Threads',
  CreatePublicThreads: 'Create Public Threads',
  CreatePrivateThreads: 'Create Private Threads',
  UseExternalStickers: 'Use External Stickers',
  SendMessagesInThreads: 'Send Messages in Threads',
  UseEmbeddedActivities: 'Use Embedded Activities',
  ModerateMembers: 'Moderate Members',
  ViewCreatorMonetizationAnalytics: 'View Creator Monetization Analytics',
  UseSoundboard: 'Use Soundboard',
  CreateGuildExpressions: 'Create Guild Expressions',
  CreateEvents: 'Create Events',
  UseExternalSounds: 'Use External Sounds',
  SendVoiceMessages: 'Send Voice Messages',
  SetVoiceChannelStatus: 'Set Voice Channel Status',
  SendPolls: 'Send Polls',
  UseExternalApps: 'Use External Apps',
  PinMessages: 'Pin Messages',
  BypassSlowmode: 'Bypass Slowmode'
};

function getPermissionLabel(permission) {
  return PERMISSION_LABELS[permission] ?? permission.replace(/([A-Z])/g, ' $1').trim();
}

const DEFAULT_BOT_PERMISSIONS = ['ViewChannel', 'EmbedLinks', 'SendMessages', 'ReadMessageHistory'];
const DEFAULT_USER_PERMISSIONS = ['SendMessages', 'ViewChannel', 'UseApplicationCommands'];

module.exports = { getPermissionLabel, DEFAULT_BOT_PERMISSIONS, DEFAULT_USER_PERMISSIONS };