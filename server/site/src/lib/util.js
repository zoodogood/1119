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


function timestampDay(timestamp){
	timestamp -= new Date().getTimezoneOffset() * 60_000;
  	return Math.floor(timestamp / 86_400_000)
}

function relativeSiteRoot(app, path, removeHash = true){
	const {origin, hash} = app.document.location;
	const pathname = Object.values(app.url.base).join("/");
	return `${ origin }${ pathname }/${ path }${ removeHash ? "" : `#${ hash }` }`;
}

export {
	resolveDate,
	timestampDay,
	relativeSiteRoot
}