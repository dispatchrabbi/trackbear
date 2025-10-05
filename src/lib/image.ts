export function saveSvgAsPng(svgEl: SVGSVGElement, filename: string) {
  // first, get a data URL for the SVG contents
  const expandedSvg = cloneAndExpand(svgEl);
  const svgString = (new XMLSerializer()).serializeToString(expandedSvg);
  const svgBlob = new Blob([svgString], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  // then, render the SVG URL to an image element
  const imageEl = new Image(
    +expandedSvg.getAttribute('width')!,
    +expandedSvg.getAttribute('height')!,
  );
  imageEl.src = svgUrl;
  // and then draw the contents of the image element onto a Canvas,
  // from which we can export a PNG file
  imageEl.onload = function() {
    const pngDataUri = makePngDataUriFromImage(imageEl);
    URL.revokeObjectURL(svgUrl);
    triggerDownload(pngDataUri, filename);
  };
}

function cloneAndExpand(svgEl: SVGSVGElement, padding: number = 8) {
  const cloned = svgEl.cloneNode(true) as SVGSVGElement;

  const width = +cloned.getAttribute('width')!;
  const height = +cloned.getAttribute('height')!;
  const viewBoxParts = cloned.getAttribute('viewBox')!.split(' ').map(part => +part);

  cloned.setAttribute('width', String(width + (padding * 2)));
  cloned.setAttribute('height', String(height + (padding * 2)));
  cloned.setAttribute('viewBox', [
    viewBoxParts[0] - padding,
    viewBoxParts[1] - padding,
    viewBoxParts[2] + (padding * 2),
    viewBoxParts[3] + (padding * 2),
  ].join(' '));

  return cloned;
}

function makePngDataUriFromImage(imageEl: HTMLImageElement) {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = imageEl.width;
  canvasEl.height = imageEl.height;

  const ctx = canvasEl.getContext('2d');
  if(ctx === null) {
    throw new Error('Could not get 2d context for ephemeral canvas');
  }
  ctx.drawImage(imageEl, 0, 0);

  const imageDataUri = canvasEl.toDataURL('image/png');
  return imageDataUri;
}

function triggerDownload(imageDataUri: string, filename: string) {
  const a = document.createElement('a');
  a.download = filename;
  a.target = '_blank';
  a.href = imageDataUri.replace('image/png', 'image/octet-stream'); // otherwise the browser will just open the image in a new tab

  a.dispatchEvent(new MouseEvent('click', {
    view: window,
    bubbles: false,
    cancelable: true,
  }));
}
