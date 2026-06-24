import { extractStructureFilesFromMcworld } from 'mcbe-leveldb-reader';

const fileInput = document.getElementById('upload');
const statusBox = document.getElementById('status');
const grid = document.getElementById('results');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusBox.style.display = 'block';
    statusBox.innerText = 'Reading world file bytes...';
    grid.innerHTML = '';

    const reader = new FileReader();
    reader.onload = async function(evt) {
        try {
            statusBox.innerText = 'Extracting structures via LevelDB stream...';
            
            // Convert the uploaded file into a clean byte array for the decoder
            const fileData = new Uint8Array(evt.target.result);
            
            // This is the exact function HoloPrint uses to grab those 20 files
            const files = await extractStructureFilesFromMcworld(fileData);
            const keys = Object.keys(files);

            if (keys.length === 0) {
                statusBox.innerText = 'No structures found. Double check that you hit Save to Disk in-game.';
                return;
            }

            statusBox.innerText = `Successfully extracted ${keys.length} structure layouts!`;

            keys.forEach(path => {
                const filename = path.split('/').pop();
                buildCard(files[path], filename);
            });

        } catch (err) {
            statusBox.innerText = 'Failed to extract structures. Make sure the file isn\'t corrupted.';
            console.error(err);
        }
    };
    
    reader.readAsArrayBuffer(file);
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
