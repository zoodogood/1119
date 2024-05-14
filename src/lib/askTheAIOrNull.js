import config from "#config";

class Agent {
  failures = 0;
  successes = 0;
  fail() {
    this.failures += 1;
  }
  success() {
    this.successes += 1;
  }
  constructor(payload) {
    Object.assign(this, payload);
  }
}
class Balancer {
  current = 0;
  weightsLength;
  constructor(payloads, weights) {
    this.agents = payloads.map((payload) => new Agent(payload));
    this.weights = weights.map(
      (weight, index, array) => weight + (array[index - 1] ?? 0),
    );
    this.weightsLength = this.weights.at(-1);
  }
  next() {
    const target = (this.current = (this.current + 1) % this.weightsLength);
    const index = this.weights.findIndex((weight) => target < weight);
    return this.agents[index] || this.agents[0] || null;
  }
}
export const balancer = new Balancer(config.ai_payloads, [3, 1]);

export async function askTheAI_or_null(
  context,
  { temperature = 0.7, max_tokens } = {},
) {
  if (!config.ai_payloads.length) {
    return null;
  }

  const agent = balancer.next();
  if (!agent) {
    return null;
  }
  const { endpoint, model, secret_enviroment } = agent;
  const secret = process.env[secret_enviroment];

  const messages = resolveContext(context);
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
  }).catch((error) => error);

  if (!response) {
    agent.fail();
    return null;
  }

  const json = await response.json();
  const answer = json.choices?.[0]?.message.content;
  if (!answer) {
    agent.fail();
    return null;
  }
  agent.success();
  return { response: answer, json };
}

const MessageSource = {
  System: "system",
  User: "user",
  Assistant: "assistant",
};

function resolveContext(context) {
  return context.map(resolveMessage);
}

function resolveMessage(message, index) {
  if (typeof message === "object") {
    message.role ||= [MessageSource.User, MessageSource.Assistant][index % 2];
    return message;
  }

  return {
    content: message,
    role: [MessageSource.User, MessageSource.Assistant][index % 2],
  };
}
