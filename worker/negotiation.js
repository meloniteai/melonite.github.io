function parseAccept(accept) {
  return accept
    .split(",")
    .map((part, order) => {
      const [range, ...parameters] = part.trim().toLowerCase().split(";");
      let quality = 1;

      for (const parameter of parameters) {
        const [name, value] = parameter.trim().split("=");
        if (name === "q") {
          const parsed = Number(value);
          quality = Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
            ? parsed
            : 0;
        }
      }

      return { range, quality, order };
    })
    .filter(({ range }) => range.includes("/"));
}

function matchQuality(ranges, mediaType) {
  const [type] = mediaType.split("/");
  let best = null;

  for (const range of ranges) {
    let specificity = -1;
    if (range.range === mediaType) specificity = 2;
    else if (range.range === `${type}/*`) specificity = 1;
    else if (range.range === "*/*") specificity = 0;

    if (
      specificity >= 0 &&
      (best === null || specificity > best.specificity)
    ) {
      best = { ...range, specificity };
    }
  }

  return best ?? { quality: 0, order: Number.POSITIVE_INFINITY, specificity: -1 };
}

export function prefersMarkdown(accept) {
  if (!accept) return false;

  const ranges = parseAccept(accept);
  const explicitlyRequestsMarkdown = ranges.some(
    ({ range, quality }) =>
      quality > 0 && (range === "text/markdown" || range === "text/*"),
  );

  // Browsers commonly send */*. Keep HTML as the default unless a client
  // explicitly asks for Markdown or for a textual representation.
  if (!explicitlyRequestsMarkdown) return false;

  const markdown = matchQuality(ranges, "text/markdown");
  const html = matchQuality(ranges, "text/html");
  if (markdown.quality === 0) return false;
  if (markdown.quality !== html.quality) return markdown.quality > html.quality;
  if (markdown.specificity !== html.specificity) {
    return markdown.specificity > html.specificity;
  }

  // text/* alone is an explicit request for a textual representation. If
  // both concrete types were named, their order breaks an otherwise equal tie.
  if (markdown.specificity === 1) return true;
  return markdown.order < html.order;
}
