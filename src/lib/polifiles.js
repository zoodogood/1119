if (!Promise.withResolvers) {
  Promise.withResolvers = function () {
    let externalResolve, externalReject;
    const promise = new Promise((resolve, reject) => {
      externalResolve = resolve;
      externalReject = reject;
    });
    return {
      promise,
      resolve: externalResolve,
      reject: externalReject,
    };
  };
}

if (!Object.groupBy) {
  Object.groupBy = (arr, callback) => {
    return arr.reduce((acc = {}, ...args) => {
      const key = callback(...args);
      acc[key] ??= [];
      acc[key].push(args[0]);
      return acc;
    }, {});
  };
}
