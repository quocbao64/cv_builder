import fs from 'fs';
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

async function extractText(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const out = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();

    const items = tc.items
      .filter(item => item.str && item.str.trim())
      .map((item, idx) => ({
        idx,
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        fs: Math.round(item.transform[0]),
        text: item.str,
      }));

    // Sort by Y descending (top of page first), then X ascending
    const sorted = [...items].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
      return a.x - b.x;
    });

    out.push(`PAGE ${i}`);
    let lastY = -1;
    let lineText = '';
    sorted.forEach(it => {
      if (lastY !== -1 && Math.abs(it.y - lastY) > 3) {
        out.push(lineText);
        lineText = it.text;
      } else {
        lineText += (lineText ? ' ' : '') + it.text;
      }
      lastY = it.y;
    });
    if (lineText) out.push(lineText);
  }

  // Write as JSON array for easy reading
  fs.writeFileSync('sorted_lines.json', JSON.stringify(out, null, 2), 'utf8');
}

extractText('CV_HuynhQuocBao_BackendDeveloper.pdf').catch(e => process.stderr.write(e.stack));
