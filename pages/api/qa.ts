import { OpenAIStream, OpenAIStreamPayload } from "../../utils/OpenAIStream";

if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing env var from OpenAI");
}

export const config = {
    runtime: "experimental-edge",
};


const handler = async (req: Request, res: Response): Promise<Response> => {
    const {
        prompt,
        temperature = 0.7,
        top_p = 1,
        frequency_penalty = 0,
        presence_penalty = 0,
        max_tokens = 200,
        n = 1,
    } = (await req.json()) as OpenAIStreamPayload;
    if (!prompt) {
        return new Response("No prompt in the request", { status: 400 });
    }

    const payload: OpenAIStreamPayload = {
        model: "text-davinci-003",
        prompt: prompt,
        temperature,
        top_p,
        frequency_penalty,
        presence_penalty,
        max_tokens,
        stream: true,
        n,
    };

    const stream = await OpenAIStream(payload);
    return new Response(stream);
};

export default handler;