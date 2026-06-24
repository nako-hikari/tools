import { extractStructureFilesFromMcworld } from "mcbe-leveldb-reader";
import { ZipReader, BlobReader } from "@zip.js/zip.js";

const fileInput = document.getElementById("upload");
const statusBox = document.getElementById("status");
const grid = document.getElementById("results");

fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusBox.style.display = "block";
    statusBox.innerText = "Opening world archive...";
    grid.innerHTML = "";

    try {
        const zipReader = new ZipReader(new BlobReader(file));
        const entries = await zipReader.getEntries();

        const dbEntries = entries.filter(e => e.filename.startsWith("db/"));

        if (dbEntries.length === 0) {
            throw new Error("No db folder found in world");
        }

        statusBox.innerText = "Loading LevelDB files...";

        const dbBuffers = {};

        for (const entry of dbEntries) {
            if (!entry.getData) continue;
            dbBuffers[entry.filename] = await entry.getData(new BlobWriter());
        }

        const result = await extractStructureFilesFromMcworld(file);

        const keys = Object.keys(result);

        if (keys.length === 0) {
            statusBox.innerText = "No structures found in world.";
            return;
        }

        statusBox.innerText = `Extracted ${keys.length} structure(s)!`;

        for (const path of keys) {
            const filename = path.split("/").pop();
            buildCard(result[path], filename);
        }

    } catch (err) {
        console.error(err);
        statusBox.innerText = "Extraction failed (check console)";
    }
});

function buildCard(bytes, filename) {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h3");
    title.innerText = filename;

    const blob = new Blob([bytes], { type: "application/octet-stream" });

    const url = URL.createObjectURL(blob);

    const dl = document.createElement("a");
    dl.href = url;
    dl.download = filename;
    dl.className = "primary interactive";
    dl.innerText = "Download";

    card.appendChild(title);
    card.appendChild(dl);
    grid.appendChild(card);
}
