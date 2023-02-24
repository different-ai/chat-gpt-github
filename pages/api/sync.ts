import { Octokit } from "octokit";

const getFunctionName = (code: string) => {
    return code.slice(5, code.indexOf("("));
}

const getUntilNoSpace = (allLines: string[], i: number) => {
    const ret = [allLines[i]];
    for (let j = i + 1; j < i + 10000; j++) {
        if (j < allLines.length) {
            if (allLines[j].length === 0 || allLines[j][0] in [" ", "\t", ")"]) {
                ret.push(allLines[j]);
            } else {
                break;
            }
        }
    }
    return ret.join("\n");
}

function* getFunctions(code: string) {
    const allLines = code.split("\n");
    for (let i = 0; i < allLines.length; i++) {
        const l = allLines[i];
        if (l.startsWith("def ")) {
            const code = getUntilNoSpace(allLines, i);
            const functionName = getFunctionName(code);
            yield { code, functionName };
        }
    }
}

const url = "https://embedbase-hosted-usx5gpslaq-uc.a.run.app";
const vaultId = "github";
const apiKey = process.env.EMBEDBASE_API_KEY;

const syncRepository = async (files: any[]) => {
    // read all files under path/* under *.py
    // for each file, read the content
    // for each function in the file, create a document with the path+function name as the id and the function code as the data
    const documents = files.flatMap((f) => {
        console.log('f', f);
        return Array.from(getFunctions(f.content)).map((func) => ({
            id: f.path + func.functionName,
            data: func.code,
        }));
    });
    console.log('documents', documents);
    // return fetch(url + "/v1/" + vaultId, {
    //     method: "POST",
    //     headers: {
    //         Authorization: "Bearer " + apiKey,
    //         "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({
    //         documents: documents
    //     })
    // }).then(response => response.json());
};

// define a function to read the contents of a directory recursively
async function* readDirectoryRecursive(owner: string, repo: string, path: string): AsyncGenerator<any> {
    const octokit = new Octokit();
    // fetch the contents of the repository
    const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
    });

    const contents = response.data;

    // loop through the files and directories in the directory
    // @ts-ignore
    for (const item of contents) {
        if (item.type === "file") {
            // get file content
            const fileResponse = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: item.path,
            });
            yield {
                ...item,
                // @ts-ignore
                content: Buffer.from(fileResponse.data.content, "base64").toString(),
            }
        } else if (item.type === "dir") {
            // recursively read the contents of the subdirectory
            readDirectoryRecursive(owner, repo, item.path);
        }
    }
}

export default async function sync(req: any, res: any) {
    const repositoryUrl = req.body.repositoryUrl?.trim() || "";

    // check that the repo is valid using a regex
    const regex = /https:\/\/github.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+/;
    if (!regex.test(repositoryUrl)) {
        res.status(400).json({ error: "Invalid repository URL" });
        return;
    }

    // read the repo and sync with Embedbase
    const [owner, repo] = repositoryUrl.split("/").slice(-2);
    let files = [];
    const batchSize = 100;
    for await (const file of readDirectoryRecursive(owner, repo, "")) {
        files.push(file);
        if (files.length % batchSize === 0) {
            try {
                await syncRepository(files);
                files = [];
            } catch (error: any) {
                res.status(500).json({ error: error });
                return;
            }
        }
    }
    res.status(200).json({ success: true });
}