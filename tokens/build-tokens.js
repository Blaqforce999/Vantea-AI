/**
 * Converts the Vantea design token JSON files into a single CSS custom
 * properties file (tokens.css).
 *
 * Usage: node build-tokens.js
 *
 * Reads:
 *   - color-design-tokens.tokens.json
 *   - spacing-border-token.json
 *   - typography-design-tokens.tokens.json
 * Writes:
 *   - tokens.css
 */

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const COLOR_FILE = path.join(DIR, "color-design-tokens.tokens.json");
const SPACING_BORDER_FILE = path.join(DIR, "spacing-border-token.json");
const TYPOGRAPHY_FILE = path.join(DIR, "typography-design-tokens.tokens.json");
const OUTPUT_FILE = path.join(DIR, "tokens.css");

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toKebabCase(str) {
  return String(str)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Some primitive color values are broken Figma alias placeholders, e.g.
// "{color.brand — original warm ink #14120f. logo, headings, body text...}"
// instead of a plain hex value. Pull the real hex out of that text.
function normalizeHex(rawValue) {
  const match = String(rawValue).match(/#[0-9a-fA-F]{6,8}/);
  if (!match) return null;
  let hex = match[0].toLowerCase();
  if (hex.length === 7) hex += "ff"; // pad missing alpha channel
  return hex;
}

function pushVar(lines, name, value) {
  lines.push(`  --${name}: ${value};`);
}

// ---------------------------------------------------------------------------
// Color tokens (primitives, semantic roles, gradients)
// ---------------------------------------------------------------------------

function buildColorVars(colorTokens) {
  const primitiveLines = [];
  const semanticLines = [];
  const gradientLines = [];

  const primitives = colorTokens.color?.vantea?.color?.primitive || {};
  for (const [paletteName, shades] of Object.entries(primitives)) {
    const paletteSlug = toKebabCase(paletteName);
    for (const [shadeKey, node] of Object.entries(shades)) {
      const hex = normalizeHex(node.value);
      if (!hex) continue;
      pushVar(primitiveLines, `color-primitive-${paletteSlug}-${shadeKey}`, hex);
    }
  }

  const semantics = colorTokens.color?.vantea?.color?.semantic || {};
  for (const [roleName, node] of Object.entries(semantics)) {
    const hex = normalizeHex(node.value);
    if (!hex) continue;
    pushVar(semanticLines, `color-${toKebabCase(roleName)}`, hex);
  }

  const gradients = colorTokens.gradient?.vantea?.gradient || {};
  for (const [gradientName, node] of Object.entries(gradients)) {
    const { rotation, stops } = node.value;
    const stopList = stops
      .map((stop) => `${normalizeHex(stop.color)} ${stop.position * 100}%`)
      .join(", ");
    pushVar(
      gradientLines,
      `gradient-${toKebabCase(gradientName)}`,
      `linear-gradient(${rotation}deg, ${stopList})`
    );
  }

  return { primitiveLines, semanticLines, gradientLines };
}

// ---------------------------------------------------------------------------
// Spacing + border tokens
// ---------------------------------------------------------------------------

function buildSpacingBorderVars(spacingBorderTokens) {
  const spacingLines = [];
  const borderLines = [];

  for (const [key, value] of Object.entries(spacingBorderTokens.spacing || {})) {
    pushVar(spacingLines, `spacing-${toKebabCase(key)}`, `${value}px`);
  }

  for (const [key, value] of Object.entries(spacingBorderTokens.border || {})) {
    pushVar(borderLines, `border-${toKebabCase(key)}`, `${value}px`);
  }

  return { spacingLines, borderLines };
}

// ---------------------------------------------------------------------------
// Typography tokens
// ---------------------------------------------------------------------------

function isFontStyleNode(node) {
  return (
    node &&
    typeof node === "object" &&
    node.value &&
    typeof node.value === "object" &&
    "fontFamily" in node.value
  );
}

function collectFontStyleNodes(tree, pathParts, out) {
  for (const [key, node] of Object.entries(tree)) {
    const nextPath = [...pathParts, key];
    if (isFontStyleNode(node)) {
      out.push({ name: nextPath.join("-"), style: node.value });
    } else if (node && typeof node === "object") {
      collectFontStyleNodes(node, nextPath, out);
    }
  }
}

function buildTypographyVars(typographyTokens) {
  const lines = [];
  const root = typographyTokens.font?.vantea?.typography || {};
  const nodes = [];
  collectFontStyleNodes(root, [], nodes);

  for (const { name, style } of nodes) {
    const slug = toKebabCase(name);
    const family = style.fontFamily.includes(" ")
      ? `"${style.fontFamily}"`
      : style.fontFamily;

    pushVar(lines, `font-family-${slug}`, family);
    pushVar(lines, `font-size-${slug}`, `${style.fontSize}px`);
    pushVar(lines, `font-weight-${slug}`, style.fontWeight);
    pushVar(lines, `line-height-${slug}`, `${style.lineHeight}px`);
    pushVar(lines, `letter-spacing-${slug}`, `${style.letterSpacing}px`);
    pushVar(lines, `font-style-${slug}`, style.fontStyle);
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Assemble output
// ---------------------------------------------------------------------------

function section(title, lines, note) {
  if (!lines.length) return "";
  const header = note
    ? `  /* ---- ${title} ----\n     ${note} */`
    : `  /* ---- ${title} ---- */`;
  return `${header}\n${lines.join("\n")}\n`;
}

function main() {
  const colorTokens = readJSON(COLOR_FILE);
  const spacingBorderTokens = readJSON(SPACING_BORDER_FILE);
  const typographyTokens = readJSON(TYPOGRAPHY_FILE);

  const { spacingLines, borderLines } = buildSpacingBorderVars(spacingBorderTokens);
  const { primitiveLines, semanticLines, gradientLines } = buildColorVars(colorTokens);
  const typographyLines = buildTypographyVars(typographyTokens);

  const body = [
    section("Spacing", spacingLines),
    section("Border", borderLines),
    section(
      "Color Primitives",
      primitiveLines,
      "Internal palette values only — do NOT use these directly in the UI. Use Color Roles below."
    ),
    section(
      "Color Roles (Semantic)",
      semanticLines,
      "Use these in the UI."
    ),
    section("Gradients", gradientLines),
    section("Typography", typographyLines),
  ]
    .filter(Boolean)
    .join("\n");

  const css = `/* ==========================================================================
   Vantea Design Tokens
   Auto-generated by build-tokens.js — do not edit directly.
   Source files:
     - color-design-tokens.tokens.json
     - spacing-border-token.json
     - typography-design-tokens.tokens.json
   ========================================================================== */

:root {
${body}}
`;

  fs.writeFileSync(OUTPUT_FILE, css, "utf8");
  console.log(`Wrote ${OUTPUT_FILE}`);
  console.log(
    `  spacing: ${spacingLines.length}, border: ${borderLines.length}, ` +
      `color primitives: ${primitiveLines.length}, color roles: ${semanticLines.length}, ` +
      `gradients: ${gradientLines.length}, typography: ${typographyLines.length / 6}`
  );
}

main();
