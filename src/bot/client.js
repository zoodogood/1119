import { Partials, GatewayIntentBits } from "discord.js";
import { Client } from "discord.js";

const client = new Client({
  messageCacheMaxSize: 110,
  intents: [...Object.values(GatewayIntentBits)],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

export default client;
export { client };
