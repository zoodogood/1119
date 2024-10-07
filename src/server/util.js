import config from "#config";
import { DataManager } from "#lib/DataManager/singletone.js";
import { CustomCollector } from "@zoodogood/utils/objectives";
import net from "net";

function checkPort(port) {
  const server = net.createServer();
  server.listen(port);

  return new Promise((resolve, reject) => {
    const errorCollector = new CustomCollector({
      target: server,
      event: "error",
    });
    const listeningCollector = new CustomCollector({
      target: server,
      event: "listening",
    });

    errorCollector.setCallback((error) => {
      errorCollector.end();
      listeningCollector.end();
      server.close();
      error.code === "EADDRINUSE" ? resolve(false) : reject(error);
    });

    listeningCollector.setCallback(() => {
      errorCollector.end();
      listeningCollector.end();
      server.close();
      resolve(true);
    });
  });
}

function getAddress(server) {
  return config.server.origin;

  const protocol = config.server.hasSSLCertificate ? "https" : "http";
  const { address, port } = server.address();
  return `${protocol}://${address.startsWith("::") ? "localhost" : address}:${port}/`;
}

function incrementEnterAPIStatistic(request, response, next) {
  let subpath = request.path.split("/").filter(Boolean).join("/");

  if (subpath.startsWith("static")) {
    subpath = "static";
  }

  const siteData = DataManager.data.site;

  siteData.enterToAPI[subpath] ||= 0;
  siteData.enterToAPI[subpath]++;
  siteData.entersToAPI++;
  siteData.entersToAPIToday++;
  next();
}

export { checkPort, getAddress, incrementEnterAPIStatistic };

