export function triggerFileDownload(
  filename: string,
  fileContent: string,
  mimeType: string,
) {
  const url = URL.createObjectURL(new Blob([fileContent], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
