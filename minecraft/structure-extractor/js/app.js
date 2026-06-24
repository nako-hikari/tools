import { extractStructureFilesFromMcworld } from 'mcbe-leveldb-reader';

const fileInput = document.getElementById('upload');
const statusBox = document.getElementById('status');
const grid = document.getElementById('results');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusBox.style.display = 'block';
    statusBox.innerText = 'Initializing LevelDB stream reader...';
    grid.innerHTML = '';

    try {
        const files = await extractStructureFilesFromMcworld(file);
        const keys = Object.keys(files);

        if (keys.length === 0) {
            statusBox.innerText = 'No structures detected in this save. Make sure you saved them inside an in-game Structure Block first.';
            return;
        }

        statusBox.innerText = `Successfully extracted ${keys.length} structure(s).`;

        keys.forEach(path => {
            const filename = path.split('/').pop();
            const binaryData = files[path];
            buildCard(binaryData, filename);
        });

    } catch (err) {
        statusBox.innerText = 'Error reading database. Make sure it is a valid, uncorrupted .mcworld file.';
        console.error(err);
    }
});

function buildCard(bytes, filename) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '15px';

    const title = document.createElement('h3');
    title.innerText = filename;
    title.style.marginTop = '0';

    const dl = document.createElement('a');
    dl.href = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
    dl.download = filename;
    dl.className = 'primary interactive';
    dl.innerText = 'Download Template';
    dl.style.display = 'inline-block';
    dl.style.marginRight = '10px';

    const copy = document.createElement('button');
    copy.className = 'secondary interactive';
    copy.innerText = 'Copy Name';
    copy.onclick = () => {
        navigator.clipboard.writeText(filename.replace('.mcstructure', ''));
        copy.classList.add('copy-success');
        const oldText = copy.innerText;
        copy.innerText = 'Copied!';
        setTimeout(() => {
            copy.classList.remove('copy-success');
            copy.innerText = oldText;
        }, 1200);
    };

    card.appendChild(title);
    card.appendChild(dl);
    card.appendChild(copy);
    grid.appendChild(card);
}
