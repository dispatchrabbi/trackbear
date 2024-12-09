export function commaify(n: number): string {
  if(n === Infinity) {
    return 'Infinity';
  } else if(n === -Infinity) {
    return '-Infinity';
  } else if(isNaN(n)) {
    return 'NaN';
  }

  const isNegative = n < 0;
  const [ intStr, decimalStr ] = Math.abs(n).toString().split('.');

  const commaizedArr = [];
  for(let i = 0; i < intStr.length; ++i) {
    if(i % 3 === 0 && i !== 0) {
      commaizedArr.unshift(',');
    }

    commaizedArr.unshift(intStr[intStr.length - (i + 1)]);
  }

  return (isNegative ? '-' : '') + commaizedArr.join('') + (decimalStr ? '.' + decimalStr : '');
}

export function commaifyWithPrecision(n: number, precision: number): string {
  const [int, decimal] = n.toFixed(precision).split('.');
  const commaified = commaify(+int);

  if(precision === 0 || n === Infinity || n === -Infinity) {
    return commaified;
  } else {
    return [commaified, decimal].join('.');
  }
}

export function kify(n: number): string {
  const na = Math.abs(n);
  if(na >= 1000000 && (na % 10000 === 0)) {
    return (n / 1000000) + 'm';
  } else if(na >= 1000 && (na % 100 === 0)) {
    return (n / 1000) + 'k';
  } else {
    return n.toString();
  }
}

/**
 * Math.floor(), but aware of negative numbers
 * @param n The number to round
 * @returns n, rounded to the nearest integer in the direction toward zero
 */
export function roundTowardZero(n: number) {
  return Math.sign(n) * Math.floor(Math.abs(n));
}

/**
 * Math.ceil(), but aware of negative numbers
 * @param n The number to round
 * @returns n, rounded to the nearest integer in the opposite direction from zero
 */
export function roundAwayFromZero(n: number) {
  return Math.sign(n) * Math.ceil(Math.abs(n));
}

/**
 * Math.sign(), but it returns 1 for 0
 * @param n The number to decide the sign of
 * @returns -1 if n is negative, 1 otherwise
 */
export function decisiveSign(n: number) {
  return n < 0 ? -1 : 1;
}

export function formatPercent(numerator: number, denominator: number) {
  const percentage = (numerator * 100) / denominator;
  const precision = Number.isInteger(percentage) ? 0 : 2;
  return percentage.toFixed(precision);
}