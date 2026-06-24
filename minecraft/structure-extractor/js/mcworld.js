import { ZipReader, BlobReader } from "@zip.js/zip.js";
import { extractStructureFilesFromMcworld } from "mcbe-leveldb-reader";

export async function extractStructures(file) {
    const reader = new ZipReader(new BlobReader(file));
    const entries = await reader.getEntries();

    const dbFiles = entries.filter(e => e.filename.startsWith("db/"));

    const dbBlobs = await Promise.all(
        dbFiles.map(async (e) => ({
            name: e.filename,
            blob: await e.getData(new BlobWriter())
        }))
    );

    return await extractStructureFilesFromMcworld(dbBlobs);
}
