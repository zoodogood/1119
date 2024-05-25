import bodyParser from "body-parser";

export async function parse_body(request, response) {
  const { promise, resolve } = Promise.withResolvers();
  bodyParser.text()(request, response, () => resolve(request.body));
  return await promise;
}
