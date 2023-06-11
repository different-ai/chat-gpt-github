# ChatGPT Github

This is a template for creating a **ChatGPT-powered QA Github Repository** thanks to [Embedbase](https://embedbase.xyz) and [OpenAI](https://openai.com).


## How it works

* we index `Python, JS, TS, MD` files with [Embedbase](https://github.com/another-ai/embedbase)
* when you search, we use semantic search with [Embedbase](https://github.com/another-ai/embedbase) to find the most relevant snippets
* we then ask GPT-3 to give a summary of the snippets

![ezgif com-crop (1)](https://user-images.githubusercontent.com/25003283/221257024-782d29c8-7168-401d-8f1e-a3461107cdae.gif)

![ezgif com-video-to-gif (3)](https://user-images.githubusercontent.com/25003283/221257924-845c0edc-7702-4784-9e0a-7e9764050be0.gif)

![ezgif com-video-to-gif (2)](https://user-images.githubusercontent.com/25003283/221257938-66b8c909-60be-4d13-8487-10f285adfdf9.gif)


## Quick Start

Click the button to clone this repository and deploy it on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fanother-ai%2Fchat-gpt-github&env=EMBEDBASE_API_KEY,OPENAI_API_KEY&envDescription=Get%20your%20API%20key%20on%20Embedbase%20website%20at%20https%3A%2F%2Fapp.embedbase.xyz%20and%20your%20OpenAI%20key%20at%20https%3A%2F%2Fplatform.openai.com%2Faccount%2Fapi-keys)

Remember to add `EMBEDBASE_API_KEY` to your [repository secrets](https://docs.github.com/en/rest/actions/secrets) to automatically sync your documentation to [Embedbase](https://embedbase.xyz) on push.

## Local Deployment Using Docker Compose
To get started with local deployment, you'll need Docker Compose. If you don't already have it installed, you can download it from the official Docker website.

After installing Docker Compose, you can initiate the local deployment process.

### Environment Configuration
To set up your environment, you need to create a .env file. You can do this by copying the .env.example file included in this repository. Run the following command:

```sh
cp .env.example .env
```

This command will create a new file named .env that's an exact copy of .env.example. Open this .env file and fill in the respective values.

The variables you'll need to fill include:

```
OPENAI_API_KEY=
EMBEDBASE_API_KEY=
GITHUB_TOKEN=
```

Save your changes and exit the file.

### Start the Project
With your environment variables set, you can now launch the application locally. Run the following command:
```sh
docker-compose up
```

This command will start all services defined in the docker-compose.yml file. Once all services are up, you should be able to access the application by navigating to localhost:3000 in your web browser.

## License

This project is licensed under the MIT License.
