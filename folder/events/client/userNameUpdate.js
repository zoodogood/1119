import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";


class Event extends BaseEvent {
  constructor() {
    const EVENT = "client/userNameUpdate";
    super(EventsManager.emitter, EVENT);
  }

  async run(previousState, newState) {
    const isChangedOnlyDisplayName =
      previousState.displayName !== newState.displayName;

    const [previousValue, newValue] = isChangedOnlyDisplayName
      ? [previousState.displayName, newState.displayName]
      : [previousState.user.username, newState.user.username];

    if (!isChangedOnlyDisplayName) {
      newState.user.data.name = newState.user.username;
    }

    const title = `Новое имя: ${newValue}`;
    newState.guild.logSend({
      title,
      author: {
        name: isChangedOnlyDisplayName
          ? "На сервере изменился\nник пользователя"
          : "Участник изменил свой никнейм",
        iconURL: newState.user.avatarURL(),
      },
      footer: { text: `Старый никнейм: ${previousValue}` },
    });
  }

  options = {
    name: "client/userNameUpdate",
  };
}

export default Event;
