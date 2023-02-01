import { ending } from '@zoodogood/utils/primitives';
import { omit, CustomCollector } from '@zoodogood/utils/objectives';
import Discord from 'discord.js';


function toLocaleDeveloperString(value){
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

  return String(value);
}


function sleep(ms){
  return new Promise((response) => setTimeout(response, ms));
}

function random(...params){
  let lastArgument = params.splice(-1).at(-1);
  let options = {round: true};

  if (typeof lastArgument === "object"){
    Object.assign(options, lastArgument);
    lastArgument = params.splice(-1).at(-1);
  }

  const max = lastArgument + Number(options.round);
  const min = params.length ? params[0] : 0;
  let rand = Math.random() * (max - min) + min;

  if (options.round){
    rand = Math.floor(rand);
  }
  return rand;
}

function match(string = "", regular, flags){
  const reg = RegExp(regular, flags);
  let find = string.match(reg);
  return find ? find[0] : null;
}

async function awaitUserAccept({name, message, channel, userData}){
  const prefix = "userAccept_";
  if (`${ prefix }${name}` in userData) {
    return true;
  }
  const context = {};
  context.message = await channel.msg(message);
  const react = await context.message.awaitReact({user: userData, removeType: "all"}, "685057435161198594", "763807890573885456");
  await context.message.delete();

  if (react === "685057435161198594") {
    userData[`${ prefix }${ name }`] = 1;
    return true;
  }
  return false;
};

function awaitReactOrMessage({target, user, time, reactionOptions = {}, messageOptions = {}}){
  const reactions = reactionOptions.reactions?.filter(Boolean);

  const MAX_TIMEOUT = time ?? 900_000;

  const filter = (some, adding) => some instanceof Discord.Message ? 
    some.author.id === user.id :
    adding.id === user.id && (!reactions.length || reactions.includes(some.emoji.id ?? some.emoji.name));

  const collectorOptions = { max: 1, time: MAX_TIMEOUT, filter };

  reactions.forEach(reaction => target.react(reaction));

  return new Promise(async (resolve) => {
    const collected = await Promise.race([
      target.channel.awaitMessages({...collectorOptions, ...messageOptions}),
      target.awaitReactions({...collectorOptions, ...reactionOptions})
    ]);

    const some = collected.first();
    if (some instanceof Discord.Message){
      some.delete();
    }
    target.reactions.cache.each(reaction => reaction.users.remove(target.client.user));
    console.log(some);
    resolve(some);
  });
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

function timestampDay(timestamp){
  timestamp -= new Date().getTimezoneOffset() * 60_000;
  return Math.floor(timestamp / 86_400_000);
}

function toDayDate(date){
  if (date instanceof Date === false){
    date = new Date(date);
  }

  const month = (date.getMonth() + 1).toString();
  const day   = date.getDate().toString();

  return `${ day.padStart(2, "0") }.${ month.padStart(2, "0") }`;
}

function similarity(a, b) {

  if (a.toLowerCase() == b.toLowerCase()) return 0;
  a = a.toLowerCase().split("");
  b = b.toLowerCase().split("");
  let i = 0, w = 0;

  while( i < Math.max(a.length, b.length) ){
    if (a[i] == b[i]) {}
    else if (a[i] == b[i + 1] && a[i + 1] == b[i]){
      a[i] = b[i + 1];
      a[i + 1] = b[i];
      b[i] = a[i];
      b[i + 1] = a[i + 1];
      w += 1;
      i++;
    }
    else if (a[i] == b[i + 1]){
      b.splice(i, 1);
      w += 0.75;
    }
    else if (a[i + 1] == b[i] || b[i] == undefined){
      b.splice(i, 0, a[i])
      w += 0.75;
    }
    else {
      b[i] = a[i];
      w += 1;
    }
    i++;
  }
  return w;
};

function getSimilar(arr, str) {
  if (arr.find((el) => el.toLowerCase() === str.toLowerCase())) return str;
  let max = Infinity;
  let input;
  arr.filter(el => el.length - str.length < 2 && el.length - str.length > -2).forEach(el => {
      let w = similarity(str, el);
      if (w < max && w < str.length + 2) max = w, input = el;
  });
  return input || false;
}

function resolveGithubPath(relative, lineOfCode){
  const GITHUB_REPO = `https://github.com/zoodogood/1119`;
  const BRANCH = "version-2";
  const BASE = `${ GITHUB_REPO }/blob/${ BRANCH }`;
  return `${ BASE }/${ relative }${ lineOfCode ? `#L${ lineOfCode }` : "" }`
}

function NumberFormatLetterize(numb){
  numb = String( ~~(+numb) );

  const THRESHOLD = 5;
  const DISTANCE  = 3;

  if (numb.length <= THRESHOLD)
    return numb;

  const cut = numb.length - (numb.length % (THRESHOLD - DISTANCE + 1) + DISTANCE);
  numb = numb.slice(0, numb.length - cut);
  numb = new Intl.NumberFormat().format(numb);

  const letters = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "d", "U", "D", "z", "Z", "x", "X", "c", "C", "v", "V", "!", "@", "#", "$", "/", "%", "^", "&", "*"];
  const letter = letters[ ~~(cut / DISTANCE) ] || `e+${ cut }`;

  return `${ numb }-${ letter }`;
}



export {
  toLocaleDeveloperString,
  CustomCollector,
  omit,
  sleep, 
  random,
  ending,
  timestampToDate,
  timestampDay,
  toDayDate,
  awaitUserAccept,
  awaitReactOrMessage,
  similarity,
  getSimilar,
  match,
  resolveGithubPath,
  NumberFormatLetterize
};
