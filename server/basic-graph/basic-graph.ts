import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

// Define the state using LangGraph's Annotation system
const state = Annotation.Root({
  graphState: Annotation<string>(),
});

// Type for the state
type StateType = typeof state.State;

// Basic node that adds text to state
function node_1(state: StateType): StateType {
  return { graphState: state.graphState + " I am" };
}

// Happy path node
function node_2(state: StateType): StateType {
  return { graphState: state.graphState + " happy!" };
}

// Sad path node
function node_3(state: StateType): StateType {
  return { graphState: state.graphState + " sad!" };
}

function decideMood(state: StateType): "node_2" | "node_3" {
  console.log("User input:", state.graphState);

  // Random decision for demonstration
  if (Math.random() < 0.5) {
    return "node_2";
  }
  return "node_3";
}

const graph = new StateGraph(state)
  // Add Nodes
  .addNode("node_1", node_1)
  .addNode("node_2", node_2)
  .addNode("node_3", node_3)

  // Add Edges
  .addEdge(START, "node_1")
  .addConditionalEdges("node_1", decideMood)
  .addEdge("node_2", END)
  .addEdge("node_3", END)

  // Compile the graph
  .compile();

  export async function runSimpleGraph(initialMessage: string = "Hello") {
    // Initialize state
    const initialState = {
      graphState: initialMessage
    };
  
    // Create stream
    const stream = await graph.stream(initialState, {
      streamMode: 'updates'
    });
  
    // Return readable stream
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            console.log('**chunk**', chunk);
  
            if (chunk.node_1) {
              controller.enqueue(`🔍 Node 1 processed: "${chunk.node_1.graphState}"\n\n`);
            }
  
            if (chunk.node_2) {
              controller.enqueue(`😀 Node 2 (Happy Path): "${chunk.node_2.graphState}"\n\n`);
            }
  
            if (chunk.node_3) {
              controller.enqueue(`😢 Node 3 (Sad Path): "${chunk.node_3.graphState}"\n\n`);
            }
          }
  
          controller.enqueue("✅ Graph execution complete\n");
          controller.close();
        } catch (error) {
          console.error("Error in graph stream:", error);
          controller.error(error);
        }
      },
    });
  }