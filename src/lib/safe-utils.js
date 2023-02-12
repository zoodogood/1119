import config from "#config";

import { ending } from '@zoodogood/utils/primitives';
import { omit, CustomCollector } from '@zoodogood/utils/objectives';




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
	const GITHUB_REPO = config.enviroment.github;
	const BRANCH = "version-2";
	const BASE = `${ GITHUB_REPO }/blob/${ BRANCH }`;
	return `${ BASE }/${ relative }${ lineOfCode ? `#L${ lineOfCode }` : "" }`
 }
 
 function NumberFormatLetterize(numb){
	numb = String( Math.floor(+numb) );
 
	const THRESHOLD = 5;
	const DISTANCE  = 3;
 
	if (numb.length <= THRESHOLD)
	  return numb;
 
	const cut = numb.length - (numb.length % (THRESHOLD - DISTANCE + 1) + DISTANCE);
	numb = numb.slice(0, numb.length - cut);
	numb = new Intl.NumberFormat().format(numb);
 
	const letters = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "d", "U", "D", "z", "Z", "x", "X", "c", "C", "v", "V", "!", "@", "#", "$", "/", "%", "^", "&", "*"];
	const letter = letters[ ~~(cut / DISTANCE) ] || `e+${ cut }`;
 
	return `${ numb } ${ letter }`;
 }
 
 function resolveDate(day, month, year){
	 const date = new Date();
	 if (day){
		 date.setDate(day);
	 }
 
	 if (month){
		 date.setMonth(month - 1);
	 }
 
	 if (year){
		 date.setYear(year);
	 }
	 return date;
 }

 function parseDocumentLocate(location){
	const url = location.pathname;

	const key = config.server.paths.site.split("/")
		.at(-1);

	const regex = new RegExp(key);
	const index = (url.match(regex)?.index ?? 0) + key.length;
	const base = url.slice(0, index);
	const subpath = url.slice(index)
		.split("/")
		.filter(Boolean);

	return {
		subpath,
		base: parseLocationBase(base)
	};	
}

function parseLocationBase(base){
	typeof base === "string" && (base = base.split("/"));
	base = base.filter(Boolean);

	const entry 	= base.at(-1);
	const lang  	= base.at(-2);
	const prefix   = base.at(-3);
	return {prefix, lang, entry};
}
  

 export {
	ending,
	omit,
	CustomCollector,

	toLocaleDeveloperString,
	sleep,
	random,
	match,
	similarity,
	getSimilar,
	joinWithAndSeparator,
	NumberFormatLetterize,

	toDayDate,
	timestampDay,
	timestampToDate,
	resolveDate,

	resolveGithubPath,
	parseDocumentLocate,
	parseLocationBase
 }

 export { relativeSiteRoot } from '#site/lib/util.js';