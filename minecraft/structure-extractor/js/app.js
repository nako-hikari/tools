const fileInput = document.getElementById('upload');
const statusBox = document.getElementById('status');
const grid = document.getElementById('results');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusBox.style.display = 'block';
    statusBox.innerText = 'Reading file stream...';
    grid.innerHTML = '';

    const reader = new FileReader();
    reader.onload = function(evt) {
        const u8 = new Uint8Array(evt.target.result);
        let foundCount = 0;

        statusBox.innerText = 'Streaming world archive...';

        // Use streaming unzip to prevent mobile memory crashes
        const uz = new fflate.Unzip();
        
        uz.onfile = (fileEntry) => {
            const path = fileEntry.name;
            
            // Skip everything that isn't database or modern structure folders
            if (!path.includes('db/') && !path.includes('structures/')) {
                return; 
            }

            statusBox.innerText = `Scanning: ${path.split('/').pop()}...`;
            
            // Buffers to collect data chunks asynchronously
            const chunks = [];
            fileEntry.ondata = (err, chunk, final) => {
                if (err) return;
                chunks.push(chunk);
                
                if (final) {
                    // Combine chunks into a single array for scanning
                    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
                    const data = new Uint8Array(totalLength);
                    let offset = 0;
                    for (const c of chunks) {
                        data.set(c, offset);
                        offset += c.length;
                    }

                    // Scan file
                    if (path.endsWith('.mcstructure')) {
                        const name = path.split('/').pop();
                        buildCard(data, name);
                        foundCount++;
                    } else if (path.includes('db/000') || path.endsWith('.log') || path.endsWith('.ldb')) {
                        const foundInFile = parseBinaryData(data);
                        foundCount += foundInFile;
                    }
                    
                    statusBox.innerText = `Structures found so far: ${foundCount}`;
                }
            };
            fileEntry.start();
        };

        // Feed the data into the streamer and close it when done
        uz.push(u8, true);
        
        statusBox.innerText = foundCount > 0 
            ? `Finished! Extracted ${foundCount} structure layouts.` 
            : 'Scan complete. No structures found inside the database files.';
    };
    reader.readAsArrayBuffer(file);
});

function parseBinaryData(data) {
    let count = 0;
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
                count++;
                i = nbt + 1000; 
            }
        }
    }
    return count;
}

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
