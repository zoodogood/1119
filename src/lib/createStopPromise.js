// Use it with await event.whenStopPromises();
export function createStopPromise() {
  const stoppers = [];
  const addStopPromise = () => {
    const credentials = Promise.withResolvers();
    stoppers.push(credentials.promise);
    return credentials;
  };
  const stopPromises = () => stoppers;
  const whenStopPromises = () => Promise.all(stopPromises());
  return { addStopPromise, stopPromises, whenStopPromises };
}
