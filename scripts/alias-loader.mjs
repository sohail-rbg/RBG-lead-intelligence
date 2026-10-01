import { resolve as r, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

function withExt(base) {
  for (const ext of ["", ".js", ".jsx", "/index.js"]) {
    if (existsSync(base + ext)) return base + ext;
  }
  return base;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = withExt(r(process.cwd(), "src", specifier.slice(2)));
    return nextResolve(pathToFileURL(target).href, context);
  }
  const isBareRelative = (specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[mc]?[jt]sx?$/.test(specifier);
  if (isBareRelative && context.parentURL) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const target = withExt(r(parentDir, specifier));
    return nextResolve(pathToFileURL(target).href, context);
  }
  return nextResolve(specifier, context);
}
