import { AnimatePresence, motion } from "framer-motion";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import Footer from "../components/Footer";
import Github from "../components/GitHub";
import Header from "../components/Header";
import LoadingDots from "../components/LoadingDots";
import ResizablePanel from "../components/ResizablePanel";
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const Home: NextPage = () => {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [lastKeyStrokeOnRepositoryUrl, setLastKeyStrokeOnRepositoryUrl] =
    useState(0);
  const [isLoadingRepositoryUrl, setIsLoadingRepositoryUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    setLastKeyStrokeOnRepositoryUrl(Date.now());
    // skip if the last key stroke was less than 1 second ago
    if (Date.now() - lastKeyStrokeOnRepositoryUrl < 1000) {
      return;
    }
    // when repository url looks like a github url (using regex)
    // query /api/sync with the repository url
    const regex = /https:\/\/github.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+/;
    if (regex.test(repositoryUrl)) {
      setIsLoadingRepositoryUrl(true);
      fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryUrl: repositoryUrl,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          toast.success("Synced repository!");
        })
        .catch((err) => {
          console.log("Error syncing repository: ", err);
          toast.error("Error syncing repository.");
        })
        .finally(() => setIsLoadingRepositoryUrl(false));
    }
  }, [repositoryUrl]);

  const getAnswer = async (e: any) => {
    e.preventDefault();
    setAnswer("");
    setIsLoading(true);
    const promptResponse = await fetch("/api/prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: question,
        repositoryUrl: repositoryUrl,
      }),
    });
    const promptData = await promptResponse.json();
    const response = await fetch("/api/qa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: promptData.prompt,
      }),
    });
    console.log("Edge function returned.");
    setIsLoading(false);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setAnswer((prev) => prev + chunkValue);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex max-w-5xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Head>
        <title>Repository GPT</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-12 sm:mt-20">
        <a
          className="flex max-w-fit items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 shadow-md transition-colors hover:bg-gray-100 mb-5"
          href="https://github.com/another-ai/embedbase-github-semantic-search"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github />
          <p>Star on GitHub</p>
        </a>
        <h1 className="sm:text-6xl text-4xl max-w-2xl font-bold text-slate-900">
          Ask your repository questions
        </h1>
        <p className="text-slate-500 mt-5">47,118 questions asked so far.</p>
        <div className="max-w-xl w-full">
          <div className="flex mt-10 items-center space-x-3">
            <Image
              src="/1-black.png"
              width={30}
              height={30}
              alt="1 icon"
              className="mb-5 sm:mb-0"
            />
            <p className="text-left font-medium">
              Insert the GitHub repository URL.
            </p>
          </div>
          {/* horizontal list of items */}
          <div className="flex flex-row space-x-3 mb-5">
            <input
              type="text"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black my-5"
              // popular github
              placeholder="https://github.com/facebook/react"
            />
            {/* small icon showing whether it is a correct github repository using check or cross */}
            {/* hovering the icon shows a tooltip with a message */}
            <div className="flex items-center">
              {
                // if is loading, show a spinner
                isLoadingRepositoryUrl ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 animate-spin text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                ) :
                  // if the repository url is valid
                  // show a check icon
                  // else show a cross icon
                  /https:\/\/github.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+/.test(
                    repositoryUrl
                  ) ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )
              }
            </div>
          </div>
          <div className="flex mb-5 items-center space-x-3">
            <Image src="/2-black.png" width={30} height={30} alt="1 icon" />
            <p className="text-left font-medium">Ask your question.</p>
          </div>
          <div className="block">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black my-5"
              placeholder="How do I change my variable state?"
            />
          </div>

          {!isLoading && (
            <button
              className={
                "bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full" +
                (!repositoryUrl || !question ? " opacity-50 cursor-not-allowed" : "")
              }
              onClick={(e) => getAnswer(e)}
              disabled={!repositoryUrl || !question}
              aria-label={
                !repositoryUrl ? "Please enter a valid repository URL" :
                  !question ? "Please enter a question" : ""
              }
              aria-disabled={!repositoryUrl || !question}
            >
              Ask &rarr;
            </button>
          )}
          {isLoading && (
            <button
              className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
              disabled
            >
              <LoadingDots color="white" style="large" />
            </button>
          )}
        </div>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{ duration: 2000 }}
        />
        <hr className="h-px bg-gray-700 border-1 dark:bg-gray-700" />
        <ResizablePanel>
          <AnimatePresence mode="wait">
            <motion.div className="space-y-10 my-10">
              {answer && (
                <>
                  <div>
                    <h2 className="sm:text-4xl text-3xl font-bold text-slate-900 mx-auto">
                      Answer
                    </h2>
                  </div>
                  <div className="flex flex-col items-start justify-start text-left px-4 mt-12 sm:mt-20">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <SyntaxHighlighter
                              children={String(children).replace(/\n$/, '')}
                              // @ts-ignore
                              style={dark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            />
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          )
                        }

                      }}
                      remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </ResizablePanel>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
