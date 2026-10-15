import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const errors = [];
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
const idSet = new Set(ids);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length) errors.push(`Повторяющиеся id: ${[...new Set(duplicates)].join(", ")}`);

for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) {
  const ref = match[1];
  if (/^(https?:|mailto:|tel:|#|data:|javascript:)/i.test(ref)) continue;
  const local = ref.split(/[?#]/)[0];
  if (!local || !fs.existsSync(path.join(root, local))) errors.push(`Не найден локальный ресурс: ${ref}`);
}
for (const match of html.matchAll(/\bhref=["']#([^"']+)["']/g)) {
  if (!idSet.has(match[1])) errors.push(`Не найден якорь: #${match[1]}`);
}
if (/<img\b[^>]*\bsrc=["']data:image/i.test(html)) {
  errors.push("Найдены встроенные изображения: используйте файлы assets/img/");
}
for (const file of ["css/style.css", "js/data.js", "js/main.js"]) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Отсутствует обязательный файл: ${file}`);
}

if (errors.length) {
  console.error("Проверка проекта не пройдена:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Проверка пройдена: ${ids.length} id, локальные ресурсы и якоря найдены.`);
}
