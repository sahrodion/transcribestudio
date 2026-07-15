import { jsPDF } from "jspdf";

export async function downloadPdf(options: {
  filename: string;
  sourceFilename: string;
  dateLabel: string;
  transcript: string;
}): Promise<void> {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Transcribe Studio", margin, y);
  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Source: ${options.sourceFilename}`, margin, y);
  y += 16;
  doc.text(`Transcribed: ${options.dateLabel}`, margin, y);
  y += 28;
  doc.setTextColor(20);

  doc.setFontSize(11);
  const paragraphs = options.transcript.split(/\n{2,}/).filter(Boolean);

  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph.replace(/\n/g, " "), maxWidth);
    for (const line of lines) {
      ensureSpace(16);
      doc.text(line, margin, y);
      y += 16;
    }
    y += 10;
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 24,
      { align: "center" },
    );
  }

  doc.save(options.filename);
}
