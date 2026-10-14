import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SEO_PAGES, SEO_SITE_URL } from "../../shared/seo-pages.js";

const outputDirectory = path.resolve("dist");
const template = await readFile(path.join(outputDirectory, "index.html"), "utf8");

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function setAttribute(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`Expected metadata tag was not found: ${pattern}`);
  return html.replace(pattern, replacement);
}

for (const [route, page] of Object.entries(SEO_PAGES)) {
  const canonicalUrl = `${SEO_SITE_URL}${route === "/" ? "/" : route}`;
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttribute(page.title)}</title>`);
  html = setAttribute(html, /<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeAttribute(page.description)}" />`);
  html = setAttribute(html, /<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonicalUrl}" />`);
  html = setAttribute(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeAttribute(page.title)}" />`);
  html = setAttribute(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeAttribute(page.description)}" />`);
  html = setAttribute(html, /<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = setAttribute(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeAttribute(page.title)}" />`);
  html = setAttribute(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeAttribute(page.description)}" />`);

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: canonicalUrl,
    isPartOf: { "@id": `${SEO_SITE_URL}/#website` },
    inLanguage: "en-IN",
  };
  html = html.replace("</head>", `  <script type="application/ld+json">${JSON.stringify(pageSchema)}</script>\n</head>`);

  const routeDirectory = route === "/" ? outputDirectory : path.join(outputDirectory, route.slice(1));
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(path.join(routeDirectory, "index.html"), html);
}

console.log(`Prerendered metadata for ${Object.keys(SEO_PAGES).length} public routes.`);