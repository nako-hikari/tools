import { extractStructureFilesFromMcworld } from "mcbe-leveldb-reader";

const fileInput = document.getElementById("upload");
const statusBox = document.getElementById("status");
const grid = document.getElementById("results");

fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusBox.style.display = "block";
    statusBox.innerText = "Reading world file...";
    grid.innerHTML = "";

    try {
        const arrayBuffer = await file.arrayBuffer();

        statusBox.innerText = "Extracting structures from world DB...";

        const files = await extractStructureFilesFromMcworld(arrayBuffer);

        const keys = Object.keys(files);

        if (keys.length === 0) {
            statusBox.innerText =
                "No structures found. Make sure you saved them using a Structure Block.";
            return;
        }

        statusBox.innerText = `Success! Found ${keys.length} structure(s).`;

        for (const path of keys) {
            const filename = path.split("/").pop();
            buildCard(files[path], filename);
        }

    } catch (err) {
        console.error(err);
        statusBox.style.display = "block";
        statusBox.innerText =
            "Extraction failed. Check console (F12) for details.";
    }
});

function buildCard(bytes, filename) {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "15px";

    const title = document.createElement("h3");
    title.innerText = filename;

    const blob = new Blob([bytes], {
        type: "application/octet-stream"
    });

    const url = URL.createObjectURL(blob);

    const dl = document.createElement("a");
    dl.href = url;
    dl.download = filename;
    dl.className = "primary interactive";
    dl.innerText = "Download .mcstructure";

    const copy = document.createElement("button");
    copy.className = "secondary interactive";
    copy.innerText = "Copy Name";

    copy.onclick = async () => {
        await navigator.clipboard.writeText(
            filename.replace(".mcstructure", "")
        );

        const old = copy.innerText;
        copy.innerText = "Copied!";
        setTimeout(() => (copy.innerText = old), 1000);
    };

    card.appendChild(title);
    card.appendChild(dl);
    card.appendChild(copy);

    grid.appendChild(card);
}
