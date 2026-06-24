import { extractStructures } from "./js/mcworld.js";

const fileInput = document.getElementById("upload");
const statusBox = document.getElementById("status");
const grid = document.getElementById("results");

fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusBox.style.display = "block";
    statusBox.innerText = "Extracting structures...";

    grid.innerHTML = "";

    try {
        const files = await extractStructures(file);
        const keys = Object.keys(files);

        if (!keys.length) {
            statusBox.innerText = "No structures found.";
            return;
        }

        statusBox.innerText = `Found ${keys.length} structures`;

        keys.forEach(path => {
            const name = path.split("/").pop();

            const card = document.createElement("div");
            card.className = "card";

            const title = document.createElement("h3");
            title.innerText = name;

            const dl = document.createElement("a");
            dl.href = URL.createObjectURL(new Blob([files[path]]));
            dl.download = name;
            dl.innerText = "Download";

            card.appendChild(title);
            card.appendChild(dl);
            grid.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        statusBox.innerText = "FAILED — open console (F12)";
    }
});
