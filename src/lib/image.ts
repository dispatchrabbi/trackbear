export function saveSvgAsPng(svgEl: SVGSVGElement, filename: string, backgroundColor?: string) {
  // first, get a data URL for the SVG contents
  const svgString = (new XMLSerializer()).serializeToString(svgEl);
  const svgBlob = new Blob([svgString], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  // then, render the SVG URL to an image element
  const imageEl = new Image(svgEl.width.baseVal.value, svgEl.height.baseVal.value);
  imageEl.src = svgUrl;
  // and then draw the contents of the image element onto a Canvas,
  // from which we can export a PNG file
  imageEl.onload = function() {
    const pngDataUri = makePngDataUriFromImage(imageEl, backgroundColor);
    URL.revokeObjectURL(svgUrl);
    triggerDownload(pngDataUri, filename);
  };
}

function makePngDataUriFromImage(imageEl: HTMLImageElement, backgroundColor?: string) {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = imageEl.width;
  canvasEl.height = imageEl.height;

  const ctx = canvasEl.getContext('2d');
  if(ctx === null) {
    throw new Error('Could not get 2d context for ephemeral canvas');
  }
  if(backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
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
