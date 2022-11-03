class CustomCollector {
  #handler;
  #callback;

  constructor({target, event, filter, limit = 0}){
    if ("on" in target === false){
      throw new Error("Target must extends EventEmitter");
    }

    this.#handler = this.handleEvent.bind(this);
    this.target = target;
    this.event = event;
    this.filter = filter;
    this.handle();

    if (limit){
      this.setTimer(limit);
    }
  }

  handleEvent(data){
    if (!!this?.filter(data) === true){
      this.#callback?.call(this, data);
    }
  }

  setCallback(callback){
    this.#callback = callback;
  }

  handle(){
    this.target.on(this.event, this.#handler);
  }

  end(){
    this.target.removeListener(this.event, this.#handler);
  }

  setTimer(ms){
    const callback = this.end.bind(this);
    setTimeout(callback, ms);
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
