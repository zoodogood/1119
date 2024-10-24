// [request_remove]: any
export const request_remove = Symbol("request_remove");
export const request_continue = Symbol("request_continue");
export const unsanitizible = Symbol("unsanitizible");

// MARK: Contexted
class TransformerContext {
  childs = [];
  path = [];
  constructor(previous, key = null) {
    // if key is not defined — is root object
    this.path = key
      ? [...(previous?.path || []), key]
      : [...(previous?.path || [])];

    this.previous = previous;
    if (previous) {
      previous.append(this);
    }
  }

  append(context) {
    this.childs.push(context);
  }
}

export function entries_recursive_map(
  object,
  fn,
  context = new TransformerContext(),
) {
  if (object === null || typeof object !== "object") {
    return object;
  }

  if (unsanitizible in object) {
    return object;
  }

  if (Array.isArray(object)) {
    return object.map((item, i) =>
      entries_recursive_map(
        // returns [key, value], get value
        fn(i, item, context)[1],
        fn,
        new TransformerContext(context, i),
      ),
    );
  }

  return Object.entries(object).reduce((acc, [key, value]) => {
    const [newKey, newValue] = fn(key, value, context);
    if (newKey === request_remove) {
      return acc;
    }
    if (newKey === request_continue) {
      acc[key] = value;
      return acc;
    }

    acc[newKey] = entries_recursive_map(
      newValue,
      fn,
      new TransformerContext(context, newKey),
    );

    return acc;
  }, {});
}
