import config from "#config";

export function isDeveloper(user) {
  return config.developers.includes(user.id);
}
