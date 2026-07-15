import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

export async function downloadDocx(options: {
  filename: string;
  title: string;
  sourceFilename: string;
  dateLabel: string;
  transcript: string;
}): Promise<void> {
  const paragraphs = options.transcript
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: block.replace(/\n/g, " "),
              font: "Calibri",
              size: 24,
            }),
          ],
        }),
    );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: options.title,
                bold: true,
                font: "Calibri",
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: `Source: ${options.sourceFilename}`,
                font: "Calibri",
                size: 20,
                color: "555555",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 320 },
            children: [
              new TextRun({
                text: `Transcribed: ${options.dateLabel}`,
                font: "Calibri",
                size: 20,
                color: "555555",
              }),
            ],
          }),
          ...paragraphs,
          new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: "Generated with Transcribe Studio",
                italics: true,
                font: "Calibri",
                size: 18,
                color: "888888",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = options.filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
