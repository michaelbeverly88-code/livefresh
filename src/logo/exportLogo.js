export function downloadSvg(svgRef, filenameBase) {
  if (!svgRef.current) return;
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgRef.current);
  const blob = new Blob(
    ['<?xml version="1.0" standalone="no"?>\r\n' + source],
    { type: "image/svg+xml;charset=utf-8" }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenameBase}-logo.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadPng(svgRef, filenameBase, { size = 500, scaleFactor = 3 } = {}) {
  if (!svgRef.current) return;
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgRef.current);
  const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const aspect = img.height / img.width;
    canvas.width = size * scaleFactor;
    canvas.height = size * scaleFactor * aspect;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      const pngUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${filenameBase}-logo.png`;
      link.click();
      URL.revokeObjectURL(pngUrl);
    }, "image/png");
  };
  img.src = url;
}

export function slugify(text) {
  return (text || "lake").replace(/\s+/g, "-").toLowerCase();
}
