import APIPointAuthorizationManager from "./APIPointAuthorization.js";
import ActionManager from "./ActionManager.js";
import BossManager from "./BossManager.js";
import CommandsManager from "./CommandsManager.js";
import CooldownManager from "./CooldownManager.js";
import CounterManager from "./CounterManager.js";
import CurseManager from "./CurseManager.js";
import DataManager from "./DataManager.js";
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
  CounterManager,
  CurseManager,
  DataManager,
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
export { singleton as ChangelogDaemon } from "#lib/ChangelogDaemon/singleton.js";
