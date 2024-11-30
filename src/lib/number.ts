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

export function roundTowardZero(n: number) {
  return Math.sign(n) * Math.floor(Math.abs(n));
}

export function decisiveSign(n: number) {
  return n < 0 ? -1 : 1;
}

export function formatPercent(numerator: number, denominator: number) {
  const percentage = (numerator * 100) / denominator;
  const precision = Number.isInteger(percentage) ? 0 : 2;
  return percentage.toFixed(precision);
}