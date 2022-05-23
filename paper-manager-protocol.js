#!/usr/bin/node

import { papersDirectory, pdfReader } from "./config.js";
import { execa } from "execa";
import { join } from "node:path";
// import fs from "node:fs";
import url from "node:url";
import { idToPath, downloadFile, notify } from "./utils.js";

async function openPdf({ id, page = 0 }) {
  const path = await idToPath(id);
  console.log(id, path);
  if (pdfReader == 'zathura')
    return await execa(pdfReader, [path, "-P", page]);
  if (pdfReader == 'evince')
    return await execa(pdfReader, ["--page-index", page, path]);

  try {
    await execa(pdfReader, [path, "-p", page]);
  } catch (e) {
    try {
      await execa(pdfReader, [path, "-p", page]);
    } catch (e) { }
  }
}

async function downloadArxiv({ authors: authorsStr, title, download }) {
  notify('Downloading ' + title);
  const allAuthors = authorsStr.split(",").map(lastNameFirst);
  const authors = allAuthors.slice(0, 5);

  const path = join(
    papersDirectory,
    title + " -- " + authors + ".pdf"
  );

  // check if file exists.

  // only if it exists!
  await downloadFile(download + ".pdf", path);
  await execa("exiftool", [
    "-overwrite_original_in_place",
    `-Title=${title}`,
    `-Author=${allAuthors.join(", ")}`,
    path,
  ]);

  execa(pdfReader, [path]);
}

function lastNameFirst(author) {
  const splitted = author.split(" ");
  const last = splitted[splitted.length - 1];
  const rest = splitted.slice(0, -1);
  return [last, ...rest].join(" ").replace(".", "");
}

async function handle(host, query) {
  if (host == "open-paper") {
    openPdf(query);
  }

  if (host == "download-arxiv") {
    downloadArxiv(query);
  }
}

const args = process.argv;
const parsed = url.parse(args[2], true);
const { host, query } = parsed;

handle(host, query);
