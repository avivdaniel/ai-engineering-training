import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import * as fs from "node:fs";
import path from "node:path";
import { Document } from "langchain/document";

// Configuration constants
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const EMBEDDING_MODEL = "text-embedding-3-large";
const PDF_DIRECTORY = path.join(process.cwd(), "public/cv");

async function loadPdfDocuments(): Promise<Document[]> {
  try {
    const files = fs.readdirSync(PDF_DIRECTORY);
    const pdfFiles = files.filter((file) => file.endsWith(".pdf"));

    if (pdfFiles.length === 0) {
      console.warn("No PDF files found in the directory");
      return [];
    }

    const loaders = pdfFiles.map(
      (file) => new PDFLoader(path.join(PDF_DIRECTORY, file))
    );
    const docs = await Promise.all(loaders.map((loader) => loader.load()));
    return docs.flat();
  } catch (error) {
    console.error("Error loading PDF documents:", error);
    throw new Error("Failed to load PDF documents");
  }
}

async function splitDocuments(docs: Document[]): Promise<Document[]> {
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    const splitDocs = await textSplitter.splitDocuments(docs);
    return splitDocs;
  } catch (error) {
    console.error("Error splitting documents:", error);
    throw new Error("Failed to split documents");
  }
}

// Singleton pattern for vector store
let vectorStore: MemoryVectorStore | null = null;

// Creates and initializes the vector store with document embeddings
async function createVectorStore(docs: Document[]): Promise<MemoryVectorStore> {
  const embeddings = new OpenAIEmbeddings({
    model: EMBEDDING_MODEL,
  });
  const store = new MemoryVectorStore(embeddings);
  await store.addDocuments(docs);
  return store;
}

// Initializes the vector store singleton
export async function initializeVectorStore(): Promise<MemoryVectorStore> {
  if (vectorStore) {
    return vectorStore;
  }
  try {
    const docs = await loadPdfDocuments(); // Loads and returns all PDF documents
    const splitDocs = await splitDocuments(docs); // Splits the documents into chunks
    vectorStore = await createVectorStore(splitDocs); // Creates and initializes the vector store with document embeddings
    return vectorStore;
  } catch (error) {
    console.error("Error initializing vector store:", error);
    throw new Error("Failed to initialize vector store");
  }
}
