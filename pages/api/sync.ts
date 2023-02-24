import { Octokit } from "octokit";
import { githubRepoToVault } from "../../utils/hacks";
const octokit = new Octokit(process.env.GITHUB_TOKEN ?{
    auth: process.env.GITHUB_TOKEN,
} : {});

const mockGithubApi = process.env.MOCK_GITHUB_API === "true";
// fucking hack because of rate limits
if (mockGithubApi) {
    // @ts-ignore
    octokit.rest.repos.getContent = async (params: any) => {
        const { owner, repo, path } = params;
        // fake python files
        if (path === "") {
            return {
                data: [
                    {
                        type: "file",
                        path: "file1.py",
                    },
                    {
                        type: "file",
                        path: "file2.py",
                    },
                    {
                        type: "dir",
                        path: "dir1",
                    },
                ],
            };
        } else {
            const c = `
def function1():
    print("foo")
  
def function2():
    print("bar")
`;
            return {
                data: {
                    // as base64
                    content: Buffer.from(c).toString("base64"),
                }
            };
        }
    };
}


const getFunctionName = (code: string) => {
    return code.slice(4, code.indexOf("("));
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

function getFunctions(code: string) {
    const allLines = code.split("\n");
    for (let i = 0; i < allLines.length; i++) {
        const l = allLines[i];
        if (l.startsWith("def ")) {
            const code = getUntilNoSpace(allLines, i);
            const functionName = getFunctionName(code);
            // line of code also
            return { code, functionName, line: i };
        }
    }
}

const url = "https://embedbase-hosted-usx5gpslaq-uc.a.run.app";
const apiKey = process.env.EMBEDBASE_API_KEY;

const syncRepository = async (files: any[], vaultId: string) => {
    // read all files under path/* under *.py
    // for each file, read the content
    // for each function in the file, create a document with the path+function name as the id and the function code as the data
    const documents = files
        .filter((f) => f.path.endsWith(".py"))
        .flatMap((f) => {
            // console.log('f', f);
            // const functions = getFunctions(f.content);
            // if (!functions) {
            //     return [];
            // }
            // console.log('functions', functions);

            // const { code, functionName, line } = functions;
            // stupid mode, split file in chunks every 100 lines
            const code = f.content;
            const lines = code.split("\n");
            const chunks = [];
            for (let i = 0; i < lines.length; i += 100) {
                chunks.push(lines.slice(i, i + 100).join("\n"));
            }
            return chunks.map((c, i) => {
                return {
                    id: `${f.path}/${i}`,
                    data: c,
                };
            });

            // return {
            //     // id: `${f.path}/${functionName}/${line}`,
            //     id: `${f.path}`,
            //     data: code,
            // };
        });
    console.log('documents', documents);
    const fullUrl = url + "/v1/" + githubRepoToVault(vaultId);
    console.log('fullUrl', fullUrl);
    return fetch(fullUrl, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            documents: documents
        })
    }).then(response => response.json());
};

// define a function to read the contents of a directory recursively
const readDirectoryRecursive = async (files: any[], owner: string, repo: string, path: string): Promise<void> => {
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
            files.push({
                ...item,
                // @ts-ignore
                content: Buffer.from(fileResponse.data.content, "base64").toString(),
            });
        } else if (item.type === "dir") {
            // recursively read the contents of the subdirectory
            readDirectoryRecursive(files, owner, repo, item.path);
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
    console.log('sync', repositoryUrl);

    // read the repo and sync with Embedbase
    const [owner, repo] = repositoryUrl.split("/").slice(-2);
    let filesUnprocessed = [];
    const batchSize = 100;
    const files: any[] = [];
    await readDirectoryRecursive(files, owner, repo, "");
    for (const file of files) {
        filesUnprocessed.push(file);
        if (filesUnprocessed.length % batchSize === 0) {
            try {
                await syncRepository(filesUnprocessed, repositoryUrl);
                filesUnprocessed = [];
            } catch (error: any) {
                res.status(500).json({ error: error });
                return;
            }
        }
    }
    try {
        await syncRepository(files, repositoryUrl);
    } catch (error: any) {
        res.status(500).json({ error: error });
        return;
    }
    res.status(200).json({ success: true });
}