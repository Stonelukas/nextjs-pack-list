// Lazy imports for heavy libraries

export const lazyImportJsPDF = async () => {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
};

export const lazyImportHtmlToImage = async () => {
  const htmlToImage = await import('html-to-image');
  return htmlToImage;
};

export const lazyImportQRCode = async () => {
  const QRCode = await import('qrcode');
  return QRCode;
};

export const lazyImportFileSaver = async () => {
  const { saveAs } = await import('file-saver');
  return saveAs;
};

export const lazyImportCanvasConfetti = async () => {
  const confetti = (await import('canvas-confetti')).default;
  return confetti;
};