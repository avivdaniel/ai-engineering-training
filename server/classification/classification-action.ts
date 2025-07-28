"use server";

import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const classificationSchema = z.object({
  sentiment: z.string().describe("The sentiment of the text"),
  aggressivness: z
    .number()
    .int()
    .describe("How aggressive the text is on a scale from 1 to 10"),
  language: z.string().describe("The language the text is written in"),
  category: z
    .string()
    .describe(
      "General category of the text: Business, Technology, Health, Education, Entertainment, or Other"
    ),
  intent: z
    .string()
    .describe(
      "The intent behind the text: Inform, Complain, Request, Praise, etc."
    ),
});

const taggingPrompt = ChatPromptTemplate.fromTemplate(
  `Extract the desired information from the following passage.
  
    Only extract the properties mentioned in the 'Classification' function.
    
    Passage:
    {input}
    `
);

const llmWihStructuredOutput = llm.withStructuredOutput(classificationSchema, {
  name: "extractor",
});

export async function streamClassification(text: string) {
  const prompt = await taggingPrompt.invoke({ input: text });

  const messages = [
    new SystemMessage(
      "You are a content classifier. Analyze the text and determine its main topic. " +
        "Create a suitable category name (one to three words) that best represents the content. " +
        "Be concise and specific — for example: 'Food Complaint', 'Religious Services', 'Online Shopping', etc. " +
        "Avoid generic terms like 'Other' unless absolutely necessary. " +
        "First, provide the category name. " +
        "Then, on a new line, briefly explain why you chose that category."
    ),
    new HumanMessage(prompt.toString()),
  ];

  const stream = await llmWihStructuredOutput.stream(messages);

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          controller.enqueue(JSON.stringify(chunk, null, 2));
        }
        controller.close();
      } catch (error) {
        console.error("Error in classification stream:", error);
        controller.error(error);
      }
    },
  });
}
