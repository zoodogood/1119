// Use it with await Promise.all(event,_createStopPromise_stoppers);
export function createStopPromise() {
  const credentials = Promise.withResolvers();
  this._createStopPromise_stoppers ||= [];
  this._createStopPromise_stoppers.push(credentials.promise);
}
