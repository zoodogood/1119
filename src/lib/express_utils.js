import bodyParser from "body-parser";

export async function parse_body(request, response, { method = "text" } = {}) {
  const { promise, resolve } = Promise.withResolvers();
  bodyParser[method]()(request, response, () => resolve(request.body));
  return await promise;
}
