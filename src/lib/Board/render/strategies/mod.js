import { transformToCollectionUsingKey } from "#bot/util.js";
import channel_header from "./channel_header.js";
import message_content from "./message_content.js";
import newsletter from "./newsletter.js";
export const render_strategies = transformToCollectionUsingKey([
  message_content,
  channel_header,
  newsletter,
]);
