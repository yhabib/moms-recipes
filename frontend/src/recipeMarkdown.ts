/**
 * An ATX level-1 heading: up to three spaces of indent, one `#`, then a space
 * or tab (or nothing). An optional closing run of `#` is not part of the text.
 */
const H1_LINE = /^ {0,3}#(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;

/**
 * Takes the leading `# Title` line off a recipe's Markdown, so the page can show
 * the title in its own header. Blank lines before the heading are skipped and
 * dropped with it. Without such a heading (a `##` heading counts as none) the
 * title is null and the Markdown comes back unchanged.
 */
export function splitTitle(markdown: string): { title: string | null; body: string } {
  const lineBreak = /\r?\n/g;
  let start = 0;
  for (;;) {
    lineBreak.lastIndex = start;
    const match = lineBreak.exec(markdown);
    const end = match ? match.index : markdown.length;
    const line = markdown.slice(start, end);
    if (line.trim() === "") {
      if (!match) break;
      start = lineBreak.lastIndex;
      continue;
    }
    const heading = H1_LINE.exec(line);
    if (!heading) break;
    return {
      title: (heading[1] ?? "").trim(),
      body: match ? markdown.slice(lineBreak.lastIndex) : "",
    };
  }
  return { title: null, body: markdown };
}
