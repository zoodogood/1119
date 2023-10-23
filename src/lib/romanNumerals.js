const CHARACTER_TABLE = {
  Z: 2000,
  M: 1000,
  D: 500,
  C: 100,
  L: 50,
  X: 10,
  V: 5,
  I: 1,
};

export function romanToDigit(str) {
  str = str.toUpperCase().trim();
  if (/^[IVXLCDMZ]+$/i.test(str) === false) {
    return NaN;
  }

  const largestCharacter = Object.keys(CHARACTER_TABLE).find((char) =>
    str.includes(char),
  );
  let value = 0;

  const { index, ["0"]: sub } = str.match(RegExp(`${largestCharacter}+`));

  value = CHARACTER_TABLE[largestCharacter] * sub.length;
  const left = romanToDigit(str.slice(0, index)) || 0;
  const right = romanToDigit(str.slice(index + sub.length)) || 0;
  value = value - left + right;

  return value;
}

export function digitToRoman(num) {
  if (num < 1) {
    return "";
  }
  let value = "";

  for (const character in CHARACTER_TABLE)
    while (num >= CHARACTER_TABLE[character]) {
      value += character;
      num -= CHARACTER_TABLE[character];
    }

  return value;
}

export { CHARACTER_TABLE as ROMAN_NUMERALS_TABLE };
