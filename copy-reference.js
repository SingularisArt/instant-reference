#!/usr/bin/node

import { execa, execaCommand } from "execa";
import { copy, wait, press, notify, pathToId } from "./utils.js";
import { getCurrentPdfPage } from "./get-current-pdf-page.js";

async function getReference(browser, name) {
  var split_name = '';
  if (browser == "Firefox") {
    split_name = name.split("—");
  } else if (browser == "Chrome") {
    split_name = name.split("-");
  }
  const title = split_name[0].slice(0, -1);

  await wait(200);
  await press("ctrl+l");
  await press("ctrl+c");
  await wait(200);
  await press("F6");
  const { stdout: url } = await execaCommand("xclip -selection clipboard -o");

  await notify(`${title}, url:${url}`);
  await copy("\\urlref{" + url + "}{" + title + "}");
}

async function getPdfReference() {
  const { path, page } = await getCurrentPdfPage();
  const { stdout: metadataStr } = await execa("exiftool", ["-j", path]);
  const metadata = JSON.parse(metadataStr);

  const fileName = path.split("/").pop().replace(".pdf", "");
  const title = metadata[0].Title || fileName;
  const pageNumber = page + 1;

  console.log(fileName, title, pageNumber);

  await notify(`${title}, p. ${pageNumber}`);
  await copy(
    [
      "\\pdfref{",
      await pathToId(path),
      "}{",
      pageNumber,
      "}{",
      title,
      "}",
    ].join("")
  );
}

async function main() {
  const { stdout: name } = await execaCommand(
    "xdotool getactivewindow getwindowname"
  );

  if (name.includes("Firefox")) {
    await getReference("Firefox", name);
    process.exit(0);
  } else if (name.includes("Chrome")) {
    await getReference("Chrome", name);
    process.exit(0);
  }

  await getPdfReference();
  process.exit(0);
}

main();
