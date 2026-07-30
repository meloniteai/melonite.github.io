import { prefersMarkdown } from "./negotiation.js";

const MARKDOWN_TYPE = "text/markdown; charset=utf-8";
const ALTERNATE_LINK = '</index.md>; rel="alternate"; type="text/markdown"';

function appendVary(headers, name) {
  const values = (headers.get("Vary") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!values.some((value) => value.toLowerCase() === name.toLowerCase())) {
    values.push(name);
  }
  headers.set("Vary", values.join(", "));
}

export function createHandler(markdown, fetchOrigin = fetch) {
  return {
    async fetch(request, _environment, context) {
      context.passThroughOnException();

      const directMarkdownRequest = new URL(request.url).pathname === "/index.md";

      if (
        (request.method === "GET" || request.method === "HEAD") &&
        (directMarkdownRequest || prefersMarkdown(request.headers.get("Accept")))
      ) {
        const headers = new Headers({
          "Cache-Control": "public, max-age=600",
          "Content-Language": "en",
          "Content-Type": MARKDOWN_TYPE,
          "Link": '<https://melonite.ai/>; rel="canonical"; type="text/html"',
          "Vary": "Accept",
          "X-Content-Type-Options": "nosniff",
        });

        return new Response(request.method === "HEAD" ? null : markdown, {
          headers,
        });
      }

      const originResponse = await fetchOrigin(request);
      const response = new Response(originResponse.body, originResponse);
      appendVary(response.headers, "Accept");
      response.headers.append("Link", ALTERNATE_LINK);
      return response;
    },
  };
}
