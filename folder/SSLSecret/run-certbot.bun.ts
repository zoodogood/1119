import { $ } from "bun";
import config from "#config";

const {
  server: { origin },
} = config;
const { hostname } = new URL(origin);

console.info(`Hostname: ${hostname} in src/config.json.js\n--------------`);

const CERT_BOT_INIT = (host) =>
`sudo certbot certonly --standalone -d ${host} --agree-tos`;
const CERT_BOT_LIVE_FOLDER = () => `/etc/letsencrypt/live/`;
const CERT_BOT_SNAP_INSTALL = () => `snap install --classic certbot`;
const CERT_BOT_IS_INSTALLED = () => `certbot --version`;
const CREATE_SYMBOL_LINK = (from, to) => `sudo ln -f $(sudo realpath ${from}) ${to}`;
const ALLOW_MODIFY_FILE_FOR_EVERYONE = (path) => `sudo chmod 777 $(sudo realpath ${path})`;


const execute = (raw) => {
  console.info(`\n=== ${raw} ===\n`);
  return $`${{ raw }}`
};

// ========================================= Install cerbot =========================================
await (async () => {
  if ((await execute(CERT_BOT_IS_INSTALLED()).finally()).exitCode !== 0) {
    const COMMAND = CERT_BOT_SNAP_INSTALL();
    if (!confirm(`Установить серт бот?:\n-----\n$: ${COMMAND}`)) {
      process.exit(1);
    }

    await execute(`sudo ${COMMAND}`).finally();
  }
})();

// ========================================= Run certbot =========================================
await (async () => {
  const result = await execute(CERT_BOT_INIT(hostname)).finally();
  if (result.exitCode === 0) {
    return;
  }

  console.info("What's wrong");
  process.exit(1);
})();

// ========================================= Create symbol links of cert files =========================================

await (async () => {
  const commands = [
    ALLOW_MODIFY_FILE_FOR_EVERYONE(
      `${CERT_BOT_LIVE_FOLDER()}/${hostname}/privkey.pem`,
    ),
    CREATE_SYMBOL_LINK(
      `${CERT_BOT_LIVE_FOLDER()}/${hostname}/privkey.pem`,
      `./privkey.pem`,
    ),
    ALLOW_MODIFY_FILE_FOR_EVERYONE(
      `${CERT_BOT_LIVE_FOLDER()}/${hostname}/cert.pem`,
    ),
    CREATE_SYMBOL_LINK(
      `${CERT_BOT_LIVE_FOLDER()}/${hostname}/cert.pem`,
      `./cert.pem`,
    ),
  ];

  for (const command of commands) {
    const result = await execute(command).finally();
    if (!processResultIsOk(result)) {
      process.exit(1);
    }
  }

  function processResultIsOk(result) {
    if (result.exitCode === 0) {
      return true;
    }

    console.info(
      `\n-----\nAutomatically installation — loses; Please use: \`${CERT_BOT_INIT(hostname)}\`, — manually and check the paths where certeficates is installed; Check the ${import.meta.path} for more details.`,
    );
  }
})();


