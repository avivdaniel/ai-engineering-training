import { initializeVectorStore } from "@/server/semantic-search/buildVectorStore";

export async function POST(req: Request) {
    try {
        const store = await initializeVectorStore();
        const { query } = await req.json() as { query?: string };
        if (!query) {
            return new Response("No query provided", { status: 400 });
        }

        const searchResults = await store.similaritySearch(query);
        const stream = new ReadableStream({
            start(controller) {
                searchResults.forEach((result) => {
                    controller.enqueue(`data: ${JSON.stringify(result)}\n\n`);
                });
                controller.close();
            }
        })

        return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
          
    } catch (error) {
        console.error("Error in POST request:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}