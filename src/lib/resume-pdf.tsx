// Tailored resume Markdown -> a clean one-column PDF, built in the browser.
// Loaded on demand (dynamic import) so react-pdf never ships in the page bundle.
import { Document, Page, pdf, StyleSheet, Text, View } from "@react-pdf/renderer";
import { resumeFileName } from "./resume-file-name";

const NAVY = "#13294B";
const INK = "#1f2937";
const MUTED = "#6b7280";

const s = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 48, fontSize: 10, lineHeight: 1.45, color: INK, fontFamily: "Helvetica" },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 2 },
  section: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    letterSpacing: 1,
    textTransform: "uppercase",
    borderBottomWidth: 0.75,
    borderBottomColor: "#d1d5db",
    paddingBottom: 2,
    marginTop: 12,
    marginBottom: 6,
  },
  role: { fontFamily: "Helvetica-Bold", marginTop: 6, marginBottom: 2 },
  para: { marginBottom: 3 },
  first: { color: MUTED, marginBottom: 4 },
  bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 4 },
  dot: { width: 10 },
  bulletText: { flex: 1 },
  bold: { fontFamily: "Helvetica-Bold" },
});

/** Render **bold** runs; drop other Markdown emphasis and links. */
function inline(text: string) {
  const clean = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/(^|[^*])\*([^*]+)\*/g, "$1$2").replace(/`/g, "");
  return clean.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <Text key={i} style={s.bold}>
        {part.slice(2, -2)}
      </Text>
    ) : (
      part
    ),
  );
}

/** Markdown lines -> PDF blocks. The line right after the name (the headline) is muted. */
function blocks(markdown: string) {
  const out: React.ReactNode[] = [];
  let afterName = false;
  markdown.split("\n").forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    if (t.startsWith("# ")) {
      afterName = true;
      out.push(<Text key={i} style={s.name}>{t.slice(2)}</Text>);
    } else if (t.startsWith("## ")) {
      afterName = false;
      out.push(<Text key={i} style={s.section}>{t.slice(3)}</Text>);
    } else if (t.startsWith("### ")) {
      out.push(<Text key={i} style={s.role}>{inline(t.slice(4))}</Text>);
    } else if (/^[-*•] /.test(t)) {
      out.push(
        <View key={i} style={s.bullet} wrap={false}>
          <Text style={s.dot}>•</Text>
          <Text style={s.bulletText}>{inline(t.slice(2))}</Text>
        </View>,
      );
    } else {
      out.push(<Text key={i} style={afterName ? s.first : s.para}>{inline(t)}</Text>);
      afterName = false;
    }
  });
  return out;
}

function ResumeDocument({ markdown, title }: { markdown: string; title: string }) {
  return (
    <Document title={title} author="Smart Resume">
      <Page size="LETTER" style={s.page}>
        {blocks(markdown)}
      </Page>
    </Document>
  );
}

export async function downloadResumePdf(markdown: string, company: string | null) {
  const fileName = resumeFileName(markdown, company);
  const blob = await pdf(<ResumeDocument markdown={markdown} title={fileName.replace(/\.pdf$/, "")} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
