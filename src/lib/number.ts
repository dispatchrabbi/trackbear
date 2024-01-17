function commaify(n: number): string {
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

function kify(n: number): string {
  const na = Math.abs(n);
  if(na >= 1000000 && (na % 10000 === 0)) {
    return (n / 1000000) + 'm';
  } else if(na >= 1000 && (na % 100 === 0)) {
    return (n / 1000) + 'k';
  } else {
    return n.toString();
  }
}

export {
  commaify,
  kify
};
