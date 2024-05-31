import { fetchFromInnerApi } from "#lib/safe-utils.js";

export async function writeError(error) {
  if (typeof error === "string") {
    error = new Error(error);
  }

  if (error.cause) {
    error.stack ||= error.cause.stack;
    error.stack += `\nCause:\n${error.cause.stack}`;
  }

  await fetchFromInnerApi("toys/throw", {
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      cause: error.cause?.message,
    }),
    headers: { "Content-Type": "text/plain" },
    method: "POST",
  }).catch(() => {});
}

export default writeError;
