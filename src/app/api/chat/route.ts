import { getVectorStore } from "@/lib/vectordb";
import { UpstashRedisCache } from "@langchain/community/caches/upstash_redis";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "@langchain/core/prompts";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Redis } from "@upstash/redis";
import { LangChainStream, Message, StreamingTextResponse } from "ai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages;

    if (!messages || messages.length === 0) {
      return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    const latestMessage = messages[messages.length - 1].content;

    // Create encoder and stream for manual streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const cache = new UpstashRedisCache({
            client: Redis.fromEnv(),
          });

          const chatModel = new ChatGoogleGenerativeAI({
            model: "gemini-2.0-flash-exp",
            streaming: true,
            cache,
            temperature: 0,
            maxOutputTokens: 2048,
            topP: 0.95,
          });

          const rephraseModel = new ChatGoogleGenerativeAI({
            model: "gemini-2.0-flash-exp",
            cache,
            temperature: 0.3,
            maxOutputTokens: 512,
            topP: 0.9,
          });

          const retriever = (await getVectorStore()).asRetriever();

          const chatHistory = messages
            .slice(0, -1)
            .map((msg: Message) =>
              msg.role === "user"
                ? new HumanMessage(msg.content)
                : new AIMessage(msg.content),
            );

          const rephrasePrompt = ChatPromptTemplate.fromMessages([
            new MessagesPlaceholder("chat_history"),
            ["user", "{input}"],
            [
              "user",
              "Given the above conversation history, generate a search query to look up information relevant to the current question. " +
                "Do not leave out any relevant keywords. " +
                "Only return the query and no other text.",
            ],
          ]);

          const historyAwareRetrievalChain = await createHistoryAwareRetriever({
            llm: rephraseModel,
            retriever,
            rephrasePrompt,
          });

          const prompt = ChatPromptTemplate.fromMessages([
            [
              "system",
              "You are Rob bot, a friendly chatbot for Robert's personal developer portfolio website. " +
                "You are trying to convince potential employers to hire Robert as a data analyst or intern. " +
                "Be concise and only answer the user's questions based on the provided context below. " +
                "Provide links to pages that contains relevant information about the topic from the given context. " +
                "Format your messages in markdown.\n\n" +
                "Context:\n{context}",
            ],
            new MessagesPlaceholder("chat_history"),
            ["user", "{input}"],
          ]);

          // Get relevant documents
          const relevantDocs = await historyAwareRetrievalChain.invoke({
            input: latestMessage,
            chat_history: chatHistory,
          });

          // Format context from documents
          const context = relevantDocs
            .map((doc) => `Page content:\n${doc.pageContent}`)
            .join("\n------\n");

          // Stream the response
          const formattedPrompt = await prompt.format({
            context,
            chat_history: chatHistory,
            input: latestMessage,
          });

          const response = await chatModel.stream(formattedPrompt);

          for await (const chunk of response) {
            const text = chunk.content;
            controller.enqueue(encoder.encode(text));
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
