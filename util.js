import { ending } from '@zoodogood/utils/primitives';
import { omit, CustomCollector } from '@zoodogood/utils/objectives';


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

function match(string = "", regular, flags){
  const reg = RegExp(regular, flags);
  let find = string.match(reg);
  return find ? find[0] : null;
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

function awaitReactOrMessage(msg, user, ...reactions){
  reactions = reactions.filter(Boolean);
  const MAX_TIMEOUT = 900000;
  const collectorOptions = {max: 1, time: MAX_TIMEOUT};
  

  return new Promise(async (resolve) => {
    let isFulfilled = false;

    reactions.forEach(reaction => msg.react(reaction));
    msg.awaitReactions((reaction, member) => member.id === user.id && reactions.includes(reaction.emoji.id || reaction.emoji.name), collectorOptions)
    .then(reaction => {
      if ((isFulfilled ^= 1) === 0) {
        return;
      }

      const emoji = reaction.first().emoji;
      resolve(emoji.id || emoji.name);
    });

    msg.channel.awaitMessages(message => message.author.id === user.id, collectorOptions)
    .then(messages => {
      if ((isFulfilled ^= 1) === 0) {
        return;
      }
  
      const message = messages.first();
      message.delete();
      resolve(message);
    });

    await Util.sleep(MAX_TIMEOUT);
    msg.reactions.cache
      .filter(reaction => reaction.me)
      .each(reaction => reaction.remove());

    resolve(false);
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





export {
  toLocaleDelevoperString,
  CustomCollector,
  omit,
  sleep, 
  random,
  ending,
  timestampToDate,
  toDayDate,
  awaitUserAccept,
  awaitReactOrMessage,
  similarity,
  getSimilar,
  match
};
