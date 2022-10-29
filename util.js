
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
  toLocaleDelevoperString
};
