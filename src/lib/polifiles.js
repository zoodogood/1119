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
