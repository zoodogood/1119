class CustomCollector {
  #callback;

  constructor({target, event, filter, time = 0}){
    if ("on" in target === false){
      throw new Error("Target must extends EventEmitter");
    }

    this.target = target;
    this.event = event;
    this.filter = filter;
    this.time = time;
  }

  setCallback(callback){
  
    const handler = (...params) => {
      const passed = this?.filter(params);

      if (!!passed === true){
        callback.apply(this, params);
      };
    }
    
    this.handle(handler);
  }

  handle(){
    this.end();
    
    this.#callback = handler;
    this.target.on(this.event, this.#callback);

    if (this.time > 0){
      this.setTimeout(this.time);
    };
  }

  end(){
    this.removeTimeout();
    this.target.removeListener(this.event, this.#callback);
  }

  removeTimeout(){
    clearTimeout(this.timeoutId);
  }

  setTimeout(ms){
    const callback = this.end.bind(this);
    this.timeoutId = setTimeout(callback, ms);
  }
}

function toLocaleDelevoperString(value){
  if (typeof value === "string"){
    return `"${ value }"`;
  }

  if (typeof value === "number"){
    return value;
  }

  if (typeof value === "object"){
    const keys = Object.keys(value);
    return `Объект(${ keys.length }) <${ value.constructor.name }>`;
  }
}


export {
  toLocaleDelevoperString,
  CustomCollector
};
