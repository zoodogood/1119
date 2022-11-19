import { ending } from '@zoodogood/utils/primitives';
import { omit } from '@zoodogood/utils/objectives';


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
  if (!value){
    return String(value);
  }

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


function sleep(ms){
  return new Promise((response) => setTimeout(response, ms));
}

function random(...params){
  let lastArgument = params.splice(-1).last;
  let options = {round: true};

  if (typeof lastArgument === "object"){
    Object.assign(options, lastArgument);
    lastArgument = params.splice(-1).last;
  }

  const max = lastArgument + Number(options.round);
  const min = params.length ? params[0] : 0;
  let rand = Math.random() * (max - min) + min;

  if (options.round){
    rand = Math.floor(rand);
  }
  return rand;
}

async function awaitUserAccept(name, embed, channel, user){
  if (`first_${name}` in user) {
    return true;
  }
  let el = await channel.msg(embed);
  let collected = await el.awaitReact({user: user, type: "all"}, "685057435161198594", "763807890573885456");
  await el.delete();

  if (collected == "685057435161198594") {
    user[`first_${name}`] = 1;
    return true;
  }
  return false;
};

function joinWithAndSeparator(arr, ignore = false){
  if (typeof arr == "string") {
    arr = arr.includes("&AND") && !ignore ? arr.split("&AND") : arr.split(" ");
    arr = arr.filter(el => el != "" && el != " ");
  }
  if (arr.length == 1) {
    return arr[0];
  }

  if (arr.length > 1) {
    arr.last = "и " + arr.last;
  }
  return arr.join(" ");
}

function timestampToDate(ms, max){

  if ( isNaN(ms) ){
    return NaN;
  }

	const
	  date = new Date( Math.max(ms, 0) ),
	   s  = date.getUTCSeconds() + "с",
	   m  = date.getUTCMinutes() + "м ",
	   h  = date.getUTCHours() + "ч ",
	   d  = date.getUTCDate() - 1 + "д ",
	   mo = date.getUTCMonth() + "мес. ",
	   y  = date.getUTCFullYear() - 1970 + ((date.getUTCFullYear() - 1970 > 4) ? "л " : "г ");

  let input = joinWithAndSeparator(
    [y, mo, d, h, m, s]
    .filter(stamp => +stamp[0])
    .slice(0, max || 7)
    .join(" ")
    .trim()
  );

  if (!input){
    input = `0,${ ms.toString().slice(0, 3) }с`;
  }

	return input;
};



export {
  toLocaleDelevoperString,
  CustomCollector,
  omit,
  sleep, 
  random,
  ending,
  awaitUserAccept
};
