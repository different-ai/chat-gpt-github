import { merge } from 'embeddings-splitter';
import { githubRepoToVault } from '../../utils/hacks';

if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing env var from OpenAI");
}

const url = "https://embedbase-hosted-usx5gpslaq-uc.a.run.app";
const apiKey = process.env.EMBEDBASE_API_KEY;

const search = async (query: string, vaultId: string) => {
    const fullUrl = url + "/v1/" + githubRepoToVault(vaultId) + "/search";
    console.log('fullUrl', fullUrl);
    return fetch(fullUrl, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query: query
        })
    }).then(response => response.json());
};

const createContext = async (question: string, vaultId: string, maxLen = 1800) => {
    const searchResponse = await search(question, vaultId);
    console.log('searchResponse', searchResponse);
    return merge(searchResponse.similarities.map((r: any) => r.data));
}


export default async function buildPrompt(req: any, res: any) {
    const prompt = req.body.question;
    const vaultId = req.body.repositoryUrl.trim();

    const context = await createContext(prompt, vaultId);
    const newPrompt = `As an expert developper, answer the question based on the context below, and if the question can't be answered based on the context, provide me a confidence score (percentage ). If the question is about adding code and it is possible provide the code we'll need to add, including line numbers and files \n\nContext: ${context}\n\n---\n\nQuestion: ${prompt}\nAnswer:`;

    res.status(200).json({ prompt: newPrompt });
}
