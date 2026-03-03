import JSZip from 'jszip';

export function buildStoryboardFilename(
  scriptTitle: string,
  version: number,
  sceneNumber: number,
  beatLetter: string
): string {
  const slug = scriptTitle.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  const v = String(version).padStart(2, '0');
  return `${slug}-v${v}-${sceneNumber}${beatLetter}.jpg`;
}

export function buildSceneZipName(
  scriptTitle: string,
  version: number,
  sceneNumber: number
): string {
  const slug = scriptTitle.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  const v = String(version).padStart(2, '0');
  return `${slug}-v${v}-Scene-${sceneNumber}.zip`;
}

export function buildFullZipName(
  scriptTitle: string,
  version: number
): string {
  const slug = scriptTitle.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  const v = String(version).padStart(2, '0');
  return `${slug}-v${v}-Storyboards.zip`;
}

export async function downloadSingleImage(imageUrl: string, filename: string): Promise<void> {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadStoryboardZip(
  frames: { imageUrl: string; filename: string }[],
  zipName: string
): Promise<void> {
  const zip = new JSZip();
  await Promise.all(
    frames.map(async ({ imageUrl, filename }) => {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      zip.file(filename, blob);
    })
  );
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  a.click();
  URL.revokeObjectURL(url);
}
