import APIPointAuthorizationManager from "./APIPointAuthorization.js";
import ActionManager from "./ActionManager.js";
import BossManager from "./BossManager.js";
import CommandsManager from "./CommandsManager.js";
import CooldownManager from "./CooldownManager.js";
import CurseManager from "./CurseManager.js";
import UserEffectManager from "./EffectsManager.js";
import ErrorsHandler from "./ErrorsHandler.js";
import EventsManager from "./EventsManager.js";
import Executor from "./Executor.js";
import GuildVariablesManager from "./GuildVariablesManager.js";
import I18nManager from "./I18nManager.js";
import Properties from "./Properties.js";
import QuestManager from "./QuestManager.js";
import StorageManager from "./StorageManager.js";
import Template from "./Template.js";
import TimeEventsManager from "./TimeEventsManager.js";

// deprecated style
export {
  APIPointAuthorizationManager,
  ActionManager,
  BossManager,
  CommandsManager,
  CooldownManager,
  CurseManager,
  ErrorsHandler,
  EventsManager,
  Executor,
  GuildVariablesManager,
  I18nManager,
  Properties,
  QuestManager,
  StorageManager,
  Template,
  TimeEventsManager,
  UserEffectManager,
};

// style for modern modules
export { singleton as board_singleton } from "#lib/Board/singleton.js";
export { singleton as ChangelogDaemon } from "#lib/ChangelogDaemon/singleton.js";
export { DataManager } from "#lib/DataManager/singletone.js";
