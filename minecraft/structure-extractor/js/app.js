const fileInput = document.getElementById('upload');
const statusBox = document.getElementById('status');
const grid = document.getElementById('results');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusBox.style.display = 'block';
    statusBox.innerText = 'Reading file...';
    grid.innerHTML = '';

    const reader = new FileReader();
    reader.onload = async function(evt) {
        const u8 = new Uint8Array(evt.target.result);
        statusBox.innerText = 'Unzipping world archive...';

        fflate.unzip(u8, (err, unzipped) => {
            if (err) {
                statusBox.innerText = 'Failed to parse zip. Ensure it is a valid .mcworld archive.';
                return;
            }

            statusBox.innerText = 'Searching database logs for structures...';
            let foundCount = 0;

            for (const path in unzipped) {
                if (path.includes('db/')) {
                    const data = unzipped[path];
                    
                    if (path.includes('structures/') && path.endsWith('.mcstructure')) {
                        const name = path.split('/').pop();
                        buildCard(data, name);
                        foundCount++;
                        continue;
                    }

                    const magic = new TextEncoder().encode("structure:");
                    for (let i = 0; i < data.length - magic.length; i++) {
                        let match = true;
                        for (let j = 0; j < magic.length; j++) {
                            if (data[i + j] !== magic[j]) {
                                match = false;
                                break;
                            }
                        }

                        if (match) {
                            let end = i + 10;
                            while (data[end] >= 32 && data[end] <= 126 && end < data.length) {
                                end++;
                            }
                            const sName = new TextDecoder().decode(data.subarray(i + 10, end)).replace(/[^a-zA-Z0-9_\-]/g, "");
                            
                            if (sName.length > 0) {
                                let nbt = end;
                                while (data[nbt] !== 0x0A && nbt < data.length) {
                                    nbt++;
                                }
                                const chunk = data.subarray(nbt, nbt + 500000);
                                buildCard(chunk, `${sName}.mcstructure`);
                                foundCount++;
                                i = nbt + 1000; 
                            }
                        }
                    }
                }
            }

            statusBox.innerText = foundCount > 0 
                ? `Finished! Successfully extracted ${foundCount} structure layouts.` 
                : 'No structures detected in this save database. Check your in-game Structure Block settings.';
        });
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
