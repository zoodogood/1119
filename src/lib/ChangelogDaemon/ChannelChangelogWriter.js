import client from "#bot/client.js";
import config from "#config";
import { ChangelogDaemon } from "#lib/ChangelogDaemon/ChangelogDaemon.js";
import {
  change_to_string,
  group_changes_by_group_symbol,
} from "#lib/ChangelogDaemon/api/display.js";
import { metadata } from "#lib/ChangelogDaemon/api/metadata.js";
import { version } from "#lib/enviroment.js";

export class ChannelPatchLogWriter {
  /**
   *
   * @param {ChangelogDaemon} daemon
   */
  constructor(daemon) {
    this.daemon = daemon;
  }
  async listen() {
    this.daemon.emitter.on(ChangelogDaemon.Events.beforePushHandler, () =>
      this.on_daemon_push(),
    );
  }

  async on_daemon_push() {
    const changes = [];
    const callback = ({ data }) => changes.push(data);
    this.daemon.emitter.on(ChangelogDaemon.Events.changeParsed, callback);
    const { promise, resolve } = Promise.withResolvers();
    this.daemon.emitter.once(ChangelogDaemon.Events.pushHandlerEnd, resolve);
    await promise;
    this.daemon.emitter.off(ChangelogDaemon.Events.changeParsed, callback);
    await this.write_changes(changes);
  }

  async write_changes(changes) {
    const channel = client.channels.cache.get(config.guild.patchlogChannelId);

    const groups = group_changes_by_group_symbol(changes.map(metadata));
    const description = groups
      .map(
        ([{ label }, changes]) =>
          `${label}:\n${changes.map(change_to_string).join("\n")}`,
      )
      .join("\n\n");

    channel.msg({
      description,
      footer: { text: `Изменения версии v${version}` },
    });
  }
}
