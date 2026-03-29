export const IGRAPH_SOURCE_ALIAS = '@igraph-source';
export const IGRAPH_SOURCE_PATH = '/Users/imt/Documents/igraph-main 2';

export const IGRAPH_REFERENCE_FILES = {
  readme: '@igraph-source/README.md',
  cmake: '@igraph-source/CMakeLists.txt',
  functions: '@igraph-source/interfaces/functions.yaml',
  types: '@igraph-source/interfaces/types.yaml',
} as const;

export type GraphNode = {
  id: string;
  label?: string;
  group?: string;
  attributes?: Record<string, unknown>;
};

export type GraphEdge = {
  source: string;
  target: string;
  weight?: number;
  attributes?: Record<string, unknown>;
};

export type GraphPayload = {
  directed?: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type IgraphIntegrationStatus = {
  sourceLinked: true;
  runtimeReady: false;
  sourceAlias: typeof IGRAPH_SOURCE_ALIAS;
  sourcePath: typeof IGRAPH_SOURCE_PATH;
  nextStep: string;
};

export function getIgraphIntegrationStatus(): IgraphIntegrationStatus {
  return {
    sourceLinked: true,
    runtimeReady: false,
    sourceAlias: IGRAPH_SOURCE_ALIAS,
    sourcePath: IGRAPH_SOURCE_PATH,
    nextStep:
      'igraph source is linked into this project, but browser runtime support still needs a wasm build or a backend bridge.',
  };
}

export function createGraphPayload(nodes: GraphNode[], edges: GraphEdge[], directed = false): GraphPayload {
  return { directed, nodes, edges };
}

export function createAdjacencyMap(payload: GraphPayload): Record<string, string[]> {
  const adjacency = Object.fromEntries(payload.nodes.map((node) => [node.id, [] as string[]]));

  for (const edge of payload.edges) {
    adjacency[edge.source] ??= [];
    adjacency[edge.target] ??= [];
    adjacency[edge.source].push(edge.target);

    if (!payload.directed) {
      adjacency[edge.target].push(edge.source);
    }
  }

  return adjacency;
}
