/** Download `data` as a pretty-printed JSON file. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Open the browser's file dialog and resolve with the chosen file, or `null` if the user cancels. */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('cancel', () => resolve(null));
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null));
    input.click();
  });
}

/** Let the user pick a JSON file and resolve with its text, or `null` if they cancel. */
export async function pickJsonFile(): Promise<string | null> {
  const file = await pickFile('application/json,.json');
  return file ? file.text() : null;
}
