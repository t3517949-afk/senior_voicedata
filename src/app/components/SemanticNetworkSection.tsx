import { startTransition, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';

type SemanticNetworkNode = {
  id: string;
  label: string;
  pos: string;
  frequency: number;
  degree: number;
  weighted_degree: number;
  betweenness: number;
  closeness: number;
  eigenvector: number;
  x: number;
  y: number;
};

type SemanticNetworkEdge = {
  source: string;
  target: string;
  weight: number;
};

type SemanticNetworkKeyword = {
  token: string;
  pos: string;
  frequency: number;
  weighted_degree: number;
  betweenness: number;
};

type SemanticNetworkMetrics = {
  network_scale: number;
  network_density: number;
  network_diameter: number;
  average_shortest_path_length: number;
  global_clustering_coefficient: number;
  small_world_index: number;
  modularity: number;
  edge_count: number;
};

type SemanticNetworkResponse = {
  original_text: string;
  normalized_text: string;
  sentences: string[];
  raw_tokens: string[];
  cleaned_tokens: string[];
  removed_tokens: string[];
  missing_vectors: string[];
  nodes: SemanticNetworkNode[];
  edges: SemanticNetworkEdge[];
  metrics: SemanticNetworkMetrics;
  keywords: SemanticNetworkKeyword[];
  metadata: {
    min_frequency: number;
    similarity_threshold: number;
    max_nodes: number;
    pos_filter: string[];
    backend: string;
  };
};

type HoveredNode = {
  label: string;
  x: number;
  y: number;
};

type GraphViewModel = {
  elements: ElementDefinition[];
  connectedNodeCount: number;
  hiddenNodeCount: number;
};

type ParticipantGroupId = 'youth' | 'elderly';
type ParticipantClassId =
  | 'youth-general'
  | 'elderly-good'
  | 'elderly-medium'
  | 'elderly-challenged';
type SpontaneousTaskTypeId = 'picture' | 'process' | 'story';

type TaskScenario = {
  id: string;
  label: string;
};

type GroupOption = { id: ParticipantGroupId; label: string };
type ClassOption = { id: ParticipantClassId; label: string };
type TaskTypeOption = { id: SpontaneousTaskTypeId; label: string; scenarios: TaskScenario[] };

type SemanticCorpusConfig = {
  group_options: GroupOption[];
  group_class_options: Record<ParticipantGroupId, ClassOption[]>;
  task_type_options: TaskTypeOption[];
  scenario_text_library: Record<string, string>;
  combination_text_library: Record<string, string>;
  class_style_library: Record<ParticipantClassId, string>;
};

type SemanticCorpusConfigResponse = SemanticCorpusConfig & {
  storage_path?: string;
};

const DEFAULT_SEMANTIC_CORPUS_CONFIG: SemanticCorpusConfig = {
  group_options: [
    { id: 'youth', label: '青年组' },
    { id: 'elderly', label: '老年组' },
  ],
  group_class_options: {
    youth: [{ id: 'youth-general', label: '不区分' }],
    elderly: [
      { id: 'elderly-good', label: '发音良好' },
      { id: 'elderly-medium', label: '发音一般' },
      { id: 'elderly-challenged', label: '发音较差' },
    ],
  },
  task_type_options: [
    {
      id: 'picture',
      label: '图片描述',
      scenarios: [
        { id: 'biscuit-theft', label: '饼干失窃' },
        { id: 'outdoor-picnic', label: '户外野餐' },
      ],
    },
    {
      id: 'process',
      label: '流程讲述',
      scenarios: [
        { id: 'ham-fried-rice', label: '火腿肠蛋炒饭' },
        { id: 'making-dumplings', label: '包饺子' },
        { id: 'market-shopping', label: '去菜市场买菜' },
      ],
    },
    {
      id: 'story',
      label: '故事叙述',
      scenarios: [
        { id: 'boy-who-cried-wolf', label: '狼来了' },
        { id: 'tortoise-and-hare', label: '龟兔赛跑' },
        { id: 'crow-drinks-water', label: '乌鸦喝水' },
      ],
    },
  ],
  scenario_text_library: {
    'biscuit-theft':
      '厨房里小男孩踩在凳子上伸手去拿高处的饼干，妹妹在旁边仰着头看。妈妈在水槽前洗碗，没有注意到身后发生的事情。男孩不小心把饼干盒碰歪，几块饼干掉在地上，水槽里的水也快要溢出来了。',
    'outdoor-picnic':
      '一家人在草地上铺开野餐垫，篮子里有水果、面包和饮料。孩子在旁边追逐风筝，父母一边准备食物一边提醒注意安全。天空很亮，周围还有树荫和步道，大家准备在午后一起休息聊天。',
    'ham-fried-rice':
      '先把米饭提前打散，锅热后放少量油，加入鸡蛋炒成小块盛出。再下火腿肠丁和胡萝卜粒翻炒，倒入米饭快速翻匀，加入盐和少量生抽调味，最后把鸡蛋回锅，撒上葱花后出锅。',
    'making-dumplings':
      '先把肉馅和蔬菜搅拌均匀，加盐、酱油和香油调味。把面皮放在手心，放入适量馅料，对折后从中间向两边捏紧。锅中水开后下饺子，煮到浮起再点一次冷水，重复后即可捞出食用。',
    'market-shopping':
      '出门前先列清单，确定要买的蔬菜、肉类和调料。到菜市场先看新鲜度和价格，再按分量挑选。买完后分类装袋，回家及时清洗和冷藏，容易坏的食材优先处理，避免浪费。',
    'boy-who-cried-wolf':
      '放羊的孩子为了好玩多次大喊狼来了，村民每次都急忙上山帮忙，结果发现是恶作剧。后来真正有狼出现时，孩子再呼救却没人相信，羊群被叼走，他也因此明白了说谎会失去信任。',
    'tortoise-and-hare':
      '兔子和乌龟比赛跑步，兔子觉得自己速度快，中途在树下睡觉。乌龟虽然慢，却一直不停地往前走。等兔子醒来再追时已经来不及，乌龟先到终点，说明坚持比轻敌更重要。',
    'crow-drinks-water':
      '乌鸦口渴时发现瓶子里有水，但水位太低够不到。它不停观察后叼来小石子，一颗颗放进瓶子里，水面慢慢升高，最后成功喝到水。这个故事强调遇到问题要动脑筋想办法。',
  },
  combination_text_library: {},
  class_style_library: {
    'youth-general': '青年组语料不区分发音层级，整体表达节奏较快、语句组织较完整。',
    'elderly-good': '表达较为稳定，停顿较少，词语选择相对准确，整体连贯。',
    'elderly-medium': '表达过程中存在少量停顿和重复，需要一定时间组织语句。',
    'elderly-challenged': '表达中停顿与重复更明显，句子长度较短，信息组织相对松散。',
  },
};

const SELECTOR_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(120px, 172px))',
  gap: '6px',
  maxWidth: '546px',
};

function selectorButtonStyle(active: boolean): CSSProperties {
  return {
    width: '100%',
    minHeight: '34px',
    padding: '0 8px',
    borderRadius: '6px',
    border: active ? '1px solid #C07830' : '1px solid #D5CEC1',
    backgroundColor: active ? 'rgba(192,120,48,0.08)' : '#F8F5EF',
    color: active ? '#8A4F1C' : '#5F574E',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  };
}

function buildSelectionText({
  group,
  cls,
  taskType,
  scenarioId,
}: {
  group: ParticipantGroupId;
  cls: ParticipantClassId;
  taskType: SpontaneousTaskTypeId;
  scenarioId: string;
}, config: SemanticCorpusConfig) {
  const combinationKey = `${group}::${cls}::${taskType}::${scenarioId}`;
  const groupLabel = config.group_options.find((item) => item.id === group)?.label ?? '组别未知';
  const classLabel =
    config.group_class_options[group].find((item) => item.id === cls)?.label ??
    config.group_class_options[group][0].label;
  const taskTypeLabel = config.task_type_options.find((item) => item.id === taskType)?.label ?? '任务未知';
  const scenarioText =
    config.combination_text_library[combinationKey] ??
    config.scenario_text_library[scenarioId] ??
    '';
  const classStyle = config.class_style_library[cls] ?? '';

  return `【${groupLabel}｜${classLabel}｜${taskTypeLabel}】${classStyle}${scenarioText}`;
}

const metricCards = [
  { key: 'network_scale', label: '网络规模', hint: '节点数' },
  { key: 'network_density', label: '网络密度', hint: '边连接紧密度' },
  { key: 'network_diameter', label: '网络直径', hint: '最远最短路径' },
  { key: 'average_shortest_path_length', label: '平均最短路径长度', hint: '平均信息距离' },
  { key: 'global_clustering_coefficient', label: '全局聚类系数', hint: '整体聚集水平' },
  { key: 'small_world_index', label: '小世界指数', hint: 'small world index' },
] as const;

const GRAPH_THEME = {
  background: '#0A1320',
  border: 'rgba(160, 180, 205, 0.16)',
  title: '#F6F8FC',
  muted: '#8A96A8',
  text: '#DDE6F1',
  edge: '#6E96C8',
  node: '#9BAEC2',
  nodeSecondary: '#C4D2E1',
  nodeBorder: '#E7EEF8',
  core: '#E39A3A',
  coreBorder: '#FFD18C',
  coreGlow: 'rgba(227, 154, 58, 0.26)',
} as const;

function formatMetric(value: number) {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) >= 100 || Number.isInteger(value)) return value.toString();
  return value.toFixed(3);
}

function buildGraphView(result: SemanticNetworkResponse): GraphViewModel {
  const coreIds = new Set(result.keywords.slice(0, 4).map((item) => item.token));
  const secondaryIds = new Set(result.keywords.slice(4, 10).map((item) => item.token));
  const connectedIds = new Set(result.edges.flatMap((edge) => [edge.source, edge.target]));

  if (connectedIds.size === 0) {
    return {
      elements: [],
      connectedNodeCount: 0,
      hiddenNodeCount: result.nodes.length,
    };
  }

  const visibleNodes = result.nodes.filter((node) => connectedIds.has(node.id));

  const nodeElements: ElementDefinition[] = visibleNodes.map((node) => ({
    ...(coreIds.has(node.id)
      ? {
          data: {
            id: node.id,
            label: node.label,
            frequency: node.frequency,
            weightedDegree: node.weighted_degree,
            betweenness: node.betweenness,
            tier: 'core',
            size: 32,
            color: GRAPH_THEME.core,
            borderColor: GRAPH_THEME.coreBorder,
            glowColor: GRAPH_THEME.coreGlow,
          },
        }
      : secondaryIds.has(node.id)
        ? {
            data: {
              id: node.id,
              label: node.label,
              frequency: node.frequency,
              weightedDegree: node.weighted_degree,
              betweenness: node.betweenness,
              tier: 'secondary',
              size: 20,
              color: GRAPH_THEME.nodeSecondary,
              borderColor: GRAPH_THEME.nodeBorder,
              glowColor: 'rgba(196, 210, 225, 0.16)',
            },
          }
        : {
            data: {
              id: node.id,
              label: node.label,
              frequency: node.frequency,
              weightedDegree: node.weighted_degree,
              betweenness: node.betweenness,
              tier: 'base',
              size: 12,
              color: GRAPH_THEME.node,
              borderColor: 'rgba(231, 238, 248, 0.78)',
              glowColor: 'rgba(155, 174, 194, 0.12)',
            },
          }),
    position: { x: node.x * 78, y: node.y * 78 },
  }));

  const edgeElements: ElementDefinition[] = result.edges.map((edge) => ({
    data: {
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
    },
  }));

  return {
    elements: [...nodeElements, ...edgeElements],
    connectedNodeCount: visibleNodes.length,
    hiddenNodeCount: result.nodes.length - visibleNodes.length,
  };
}

export function SemanticNetworkSection() {
  const [corpusConfig, setCorpusConfig] = useState<SemanticCorpusConfig>(DEFAULT_SEMANTIC_CORPUS_CONFIG);
  const [corpusStoragePath, setCorpusStoragePath] = useState<string>('backend/cache/semantic_corpus.json');
  const [selectedGroup, setSelectedGroup] = useState<ParticipantGroupId>('elderly');
  const [selectedClass, setSelectedClass] = useState<ParticipantClassId>('elderly-good');
  const [selectedTaskType, setSelectedTaskType] = useState<SpontaneousTaskTypeId>('picture');
  const [selectedScenario, setSelectedScenario] = useState<string>('biscuit-theft');
  const [text, setText] = useState(() =>
    buildSelectionText({
      group: 'elderly',
      cls: 'elderly-good',
      taskType: 'picture',
      scenarioId: 'biscuit-theft',
    }, DEFAULT_SEMANTIC_CORPUS_CONFIG)
  );
  const [minFrequency, setMinFrequency] = useState(1);
  const [threshold, setThreshold] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SemanticNetworkResponse | null>(null);
  const [hoveredNode, setHoveredNode] = useState<HoveredNode | null>(null);

  const graphRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const graphView = useMemo(
    () => (result ? buildGraphView(result) : { elements: [], connectedNodeCount: 0, hiddenNodeCount: 0 }),
    [result]
  );
  const elements = graphView.elements;
  const groupOptions = corpusConfig.group_options;
  const taskTypeOptions = corpusConfig.task_type_options;
  const classOptions = useMemo(
    () =>
      corpusConfig.group_class_options[selectedGroup] ??
      DEFAULT_SEMANTIC_CORPUS_CONFIG.group_class_options[selectedGroup],
    [corpusConfig, selectedGroup]
  );
  const showPronunciationSelector = selectedGroup === 'elderly';
  const selectedTaskTypeOption = useMemo(
    () => taskTypeOptions.find((item) => item.id === selectedTaskType) ?? taskTypeOptions[0],
    [selectedTaskType, taskTypeOptions]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetch('/api/semantic-network/corpus');
        if (!response.ok) return;
        const payload = (await response.json()) as Partial<SemanticCorpusConfigResponse>;
        if (!mounted) return;
        setCorpusConfig((prev) => ({
          group_options:
            Array.isArray(payload.group_options) && payload.group_options.length > 0
              ? (payload.group_options as GroupOption[])
              : prev.group_options,
          group_class_options:
            payload.group_class_options && typeof payload.group_class_options === 'object'
              ? (payload.group_class_options as Record<ParticipantGroupId, ClassOption[]>)
              : prev.group_class_options,
          task_type_options:
            Array.isArray(payload.task_type_options) && payload.task_type_options.length > 0
            ? (payload.task_type_options as TaskTypeOption[])
            : prev.task_type_options,
          scenario_text_library:
            payload.scenario_text_library && typeof payload.scenario_text_library === 'object'
              ? (payload.scenario_text_library as Record<string, string>)
              : prev.scenario_text_library,
          combination_text_library:
            payload.combination_text_library && typeof payload.combination_text_library === 'object'
              ? (payload.combination_text_library as Record<string, string>)
              : prev.combination_text_library,
          class_style_library:
            payload.class_style_library && typeof payload.class_style_library === 'object'
              ? (payload.class_style_library as Record<ParticipantClassId, string>)
              : prev.class_style_library,
        }));
        if (typeof payload.storage_path === 'string' && payload.storage_path.trim().length > 0) {
          setCorpusStoragePath(payload.storage_path);
        }
      } catch {
        // keep local defaults
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!graphRef.current || !result) return;

    cyRef.current?.destroy();
    const cy = cytoscape({
      container: graphRef.current,
      elements,
      layout: {
        name: 'cose',
        fit: true,
        padding: 80,
        animate: false,
        componentSpacing: 0,
        nodeOverlap: 8,
        nodeRepulsion: 140000,
        idealEdgeLength: 48,
        edgeElasticity: 90,
        nestingFactor: 0.7,
        gravity: 1.8,
        numIter: 1200,
        initialTemp: 90,
        coolingFactor: 0.97,
        minTemp: 1,
      },
      minZoom: 0.4,
      maxZoom: 2.2,
      wheelSensitivity: 0.12,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'border-width': 1.8,
            'border-color': 'data(borderColor)',
            label: '',
            color: GRAPH_THEME.title,
            'font-size': 12,
            'font-family': 'Noto Sans SC',
            'text-valign': 'center',
            'text-halign': 'center',
            width: 'data(size)',
            height: 'data(size)',
            'overlay-opacity': 0,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.8,
            'line-color': GRAPH_THEME.edge,
            opacity: 0.64,
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'node[tier = "core"]',
          style: {
            'shadow-blur': 18,
            'shadow-color': 'data(glowColor)',
            'shadow-opacity': 1,
            'shadow-offset-x': 0,
            'shadow-offset-y': 0,
          },
        },
        {
          selector: 'node[tier = "secondary"]',
          style: {
            'shadow-blur': 10,
            'shadow-color': 'data(glowColor)',
            'shadow-opacity': 0.9,
            'shadow-offset-x': 0,
            'shadow-offset-y': 0,
          },
        },
        {
          selector: '.hovered',
          style: {
            width: 'mapData(size, 14, 36, 18, 42)',
            height: 'mapData(size, 14, 36, 18, 42)',
            'border-width': 2.4,
            'z-index': 999,
          },
        },
        {
          selector: ':selected',
          style: {
            'overlay-color': GRAPH_THEME.core,
            'overlay-opacity': 0.12,
          },
        },
      ],
    });

    cy.on('tap', 'node', (event) => {
      const node = event.target;
      cy.elements().removeClass('dimmed');
      cy.elements().difference(node.closedNeighborhood()).addClass('dimmed');
      node.closedNeighborhood().removeClass('dimmed');
    });

    const updateHoveredNode = (event: any) => {
      const container = graphRef.current;
      if (!container) return;
      const renderedPosition = event.renderedPosition ?? event.target.renderedPosition?.();
      if (!renderedPosition) return;
      setHoveredNode({
        label: event.target.data('label'),
        x: renderedPosition.x,
        y: renderedPosition.y,
      });
    };

    cy.on('mouseover', 'node', (event) => {
      event.target.addClass('hovered');
      updateHoveredNode(event);
    });

    cy.on('mousemove', 'node', (event) => {
      updateHoveredNode(event);
    });

    cy.on('mouseout', 'node', (event) => {
      event.target.removeClass('hovered');
      setHoveredNode(null);
    });

    cy.on('tap', (event) => {
      if (event.target === cy) {
        cy.elements().removeClass('dimmed');
        setHoveredNode(null);
      }
    });

    cy.style()
      .selector('.dimmed')
      .style({
        opacity: 0.16,
      })
      .update();

    cyRef.current = cy;

    return () => {
      setHoveredNode(null);
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, result]);

  async function buildNetwork(sourceText: string = text) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/semantic-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          min_frequency: minFrequency,
          similarity_threshold: threshold,
          max_nodes: 40,
          split_sentences: true,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail || '语义网络构建失败');
      }

      startTransition(() => {
        setResult(payload as SemanticNetworkResponse);
      });
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : '语义网络构建失败';
      const message = rawMessage.includes('Failed to fetch')
        ? '未连接到语义网络后端，请先启动“一键启动.command”后再试。'
        : rawMessage;
      startTransition(() => {
        setResult(null);
        setError(message);
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!groupOptions.length) return;
    if (!groupOptions.some((item) => item.id === selectedGroup)) {
      setSelectedGroup(groupOptions[0].id);
    }
  }, [groupOptions, selectedGroup]);

  useEffect(() => {
    if (!classOptions.length) return;
    if (!classOptions.some((item) => item.id === selectedClass)) {
      setSelectedClass(classOptions[0].id);
    }
  }, [classOptions, selectedClass]);

  useEffect(() => {
    if (!taskTypeOptions.length) return;
    if (!taskTypeOptions.some((item) => item.id === selectedTaskType)) {
      setSelectedTaskType(taskTypeOptions[0].id);
    }
  }, [selectedTaskType, taskTypeOptions]);

  useEffect(() => {
    if (!selectedTaskTypeOption?.scenarios?.length) return;
    if (!selectedTaskTypeOption.scenarios.some((item) => item.id === selectedScenario)) {
      setSelectedScenario(selectedTaskTypeOption.scenarios[0].id);
    }
  }, [selectedTaskTypeOption, selectedScenario]);

  useEffect(() => {
    const nextText = buildSelectionText({
      group: selectedGroup,
      cls: selectedClass,
      taskType: selectedTaskType,
      scenarioId: selectedScenario,
    }, corpusConfig);
    setText((prev) => (prev === nextText ? prev : nextText));
    void buildNetwork(nextText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, selectedClass, selectedTaskType, selectedScenario, minFrequency, threshold, corpusConfig]);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '10px',
              color: '#C07830',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            05 · Semantic Network
          </span>
          <div style={{ height: '1px', flex: 1, backgroundColor: '#DED8CC' }} />
        </div>
        <h2
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 'clamp(20px, 2.5vw, 28px)',
            color: 'var(--lx-text-primary)',
            fontWeight: 400,
            marginBottom: '10px',
          }}
        >
          文本语义网络分析
        </h2>
      </div>

      <div
        style={{
          padding: '14px',
          border: '1px solid #DED8CC',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.56)',
          marginBottom: '28px',
        }}
      >
        <div style={{ fontSize: '11px', color: '#8A8070', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Type Selector
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr)', gap: '8px', alignItems: 'start' }}>
            <div style={{ fontSize: '12px', color: '#6A6258', lineHeight: '34px' }}>组别</div>
            <div style={SELECTOR_GRID_STYLE}>
              {groupOptions.map((option) => {
                const active = selectedGroup === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedGroup(option.id)}
                    style={selectorButtonStyle(active)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {showPronunciationSelector && (
            <div style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr)', gap: '8px', alignItems: 'start' }}>
              <div style={{ fontSize: '12px', color: '#6A6258', lineHeight: '34px' }}>发音情况</div>
              <div style={SELECTOR_GRID_STYLE}>
                {classOptions.map((option) => {
                  const active = selectedClass === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedClass(option.id)}
                      style={selectorButtonStyle(active)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr)', gap: '8px', alignItems: 'start' }}>
            <div style={{ fontSize: '12px', color: '#6A6258', lineHeight: '34px' }}>任务类型</div>
            <div style={SELECTOR_GRID_STYLE}>
              {taskTypeOptions.map((option) => {
                const active = selectedTaskType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedTaskType(option.id)}
                    style={selectorButtonStyle(active)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr)', gap: '8px', alignItems: 'start' }}>
            <div style={{ fontSize: '12px', color: '#6A6258', lineHeight: '34px' }}>具体任务</div>
            <div style={SELECTOR_GRID_STYLE}>
              {selectedTaskTypeOption.scenarios.map((scenario) => {
                const active = selectedScenario === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setSelectedScenario(scenario.id)}
                    style={selectorButtonStyle(active)}
                  >
                    {scenario.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: '#6A6258' }}>
            最低词频
            <input
              type="number"
              min={1}
              max={10}
              value={minFrequency}
              onChange={(event) => setMinFrequency(Number(event.target.value) || 1)}
              style={{
                marginLeft: '8px',
                width: '64px',
                padding: '6px 8px',
                border: '1px solid #DED8CC',
                borderRadius: '2px',
                backgroundColor: '#F8F5EF',
              }}
            />
          </label>
          <label style={{ fontSize: '12px', color: '#6A6258' }}>
            相似度阈值
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value) || 0.5)}
              style={{
                marginLeft: '8px',
                width: '72px',
                padding: '6px 8px',
                border: '1px solid #DED8CC',
                borderRadius: '2px',
                backgroundColor: '#F8F5EF',
              }}
            />
          </label>
          <button
            onClick={() => void buildNetwork(text)}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#C07830',
              color: 'var(--lx-text-primary)',
              border: 'none',
              borderRadius: '2px',
              fontSize: '12px',
              letterSpacing: '0.08em',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? '构建中...' : '刷新当前语义网络'}
          </button>
          <div style={{ fontSize: '12px', color: '#8A8070' }}>
            点击任意层级后自动更新结果；可通过阈值和词频参数调节网络疏密度。
          </div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#8A8070', lineHeight: 1.7 }}>
          后端语料文件：<code style={{ fontFamily: "'Space Mono', monospace" }}>{corpusStoragePath}</code>
        </div>
        {error && (
          <div
            style={{
              marginTop: '14px',
              padding: '12px 14px',
              backgroundColor: 'rgba(192,120,48,0.08)',
              border: '1px solid rgba(192,120,48,0.22)',
              color: '#7A4E1E',
              fontSize: '12px',
              lineHeight: 1.7,
              borderRadius: '4px',
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.85fr) minmax(320px, 0.95fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            minHeight: '680px',
            border: `1px solid ${GRAPH_THEME.border}`,
            borderRadius: '4px',
            backgroundColor: GRAPH_THEME.background,
            padding: '18px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '10px', color: GRAPH_THEME.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Network View
              </div>
              <div style={{ fontSize: '18px', color: GRAPH_THEME.title, marginTop: '6px', fontWeight: 600 }}>
                核心高频词及其语义关联网络
              </div>
              <div style={{ fontSize: '12px', color: '#AAB5C4', marginTop: '6px', lineHeight: 1.7 }}>
                悬停节点显示词语，节点大小表示重要程度。
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, auto)',
                gap: '10px 16px',
                padding: '12px 14px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: `1px solid ${GRAPH_THEME.border}`,
                fontSize: '11px',
                color: '#C6D1DD',
                flexShrink: 0,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: GRAPH_THEME.core, boxShadow: `0 0 12px ${GRAPH_THEME.coreGlow}` }} />
                核心节点
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: GRAPH_THEME.nodeSecondary, border: `1px solid ${GRAPH_THEME.nodeBorder}` }} />
                次核心节点
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: GRAPH_THEME.node, border: '1px solid rgba(231, 238, 248, 0.7)' }} />
                普通节点
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '2px', borderRadius: '999px', backgroundColor: GRAPH_THEME.edge }} />
                连线 = 语义关联
              </span>
            </div>
          </div>

          {!result && !loading && !error && (
            <div style={{ color: '#A7B3C2', fontSize: '13px', lineHeight: 1.8, padding: '24px 4px' }}>
              输入文本后即可生成语义网络。
            </div>
          )}

          <div ref={graphRef} style={{ width: '100%', height: '610px' }} />

          {hoveredNode && (
            <div
              style={{
                position: 'absolute',
                left: `clamp(20px, ${hoveredNode.x + 30}px, calc(100% - 160px))`,
                top: `clamp(84px, ${hoveredNode.y - 8}px, calc(100% - 72px))`,
                transform: 'translateY(-50%)',
                padding: '8px 12px',
                borderRadius: '999px',
                backgroundColor: 'rgba(218, 227, 239, 0.14)',
                border: '1px solid rgba(218, 227, 239, 0.22)',
                backdropFilter: 'blur(6px)',
                color: '#F5F8FC',
                fontSize: '12px',
                lineHeight: 1,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
              }}
            >
              {hoveredNode.label}
            </div>
          )}

          {result && graphView.connectedNodeCount > 0 && graphView.hiddenNodeCount > 0 && (
            <div
              style={{
                position: 'absolute',
                left: '18px',
                bottom: '18px',
                padding: '10px 12px',
                borderRadius: '4px',
                backgroundColor: 'rgba(10, 19, 32, 0.9)',
                border: '1px solid rgba(160, 180, 205, 0.16)',
                color: '#BBC7D6',
                fontSize: '11px',
                lineHeight: 1.6,
                pointerEvents: 'none',
              }}
            >
              网络区仅显示已形成语义连接的节点，另有 {graphView.hiddenNodeCount} 个孤立词未纳入图中展示。
            </div>
          )}

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              border: '1px solid #DED8CC',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.56)',
              padding: '18px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#8A8070', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Metrics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
              {metricCards.map((item) => (
                <div
                  key={item.key}
                  style={{
                    padding: '14px 12px',
                    border: '1px solid #E6DFD4',
                    borderRadius: '4px',
                    backgroundColor: '#FBF8F2',
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#8A8070', marginBottom: '6px', letterSpacing: '0.06em' }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '18px', color: '#2C5F8A', marginBottom: '3px' }}>
                    {result ? formatMetric(result.metrics[item.key]) : '--'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9B9386' }}>{item.hint}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6A6258' }}>
              <span>边数：<strong style={{ color: 'var(--lx-text-primary)' }}>{result?.metrics.edge_count ?? '--'}</strong></span>
              <span>模块度：<strong style={{ color: 'var(--lx-text-primary)' }}>{result ? formatMetric(result.metrics.modularity) : '--'}</strong></span>
            </div>
          </div>

          <div
            style={{
              border: '1px solid #DED8CC',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.56)',
              padding: '18px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#8A8070', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Core Keywords
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result?.keywords.length ? (
                result.keywords.map((item, index) => (
                  <div
                    key={item.token}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 1fr auto',
                      gap: '12px',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: '4px',
                      backgroundColor: index < 6 ? 'rgba(192,120,48,0.1)' : '#FBF8F2',
                      border: index < 6 ? '1px solid rgba(192,120,48,0.2)' : '1px solid #EAE2D6',
                    }}
                  >
                    <div style={{ fontFamily: "'Space Mono', monospace", color: index < 6 ? '#C07830' : '#8A8070', fontSize: '12px' }}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--lx-text-primary)', marginBottom: '3px' }}>{item.token}</div>
                      <div style={{ fontSize: '11px', color: '#8A8070' }}>
                        词性 {item.pos} · 词频 {item.frequency}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '13px', color: '#2C5F8A' }}>
                        {item.weighted_degree.toFixed(3)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#8A8070' }}>连接强度</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '12px', color: '#8A8070', lineHeight: 1.7 }}>
                  当前还没有核心词列表。
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              border: '1px solid #DED8CC',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.56)',
              padding: '18px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#8A8070', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Preprocess Summary
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#6A6258', marginBottom: '10px' }}>
              <span>句子数：<strong style={{ color: 'var(--lx-text-primary)' }}>{result?.sentences.length ?? '--'}</strong></span>
              <span>原始词数：<strong style={{ color: 'var(--lx-text-primary)' }}>{result?.raw_tokens.length ?? '--'}</strong></span>
              <span>建模词数：<strong style={{ color: 'var(--lx-text-primary)' }}>{result?.cleaned_tokens.length ?? '--'}</strong></span>
            </div>
            <div style={{ fontSize: '12px', color: '#8A8070', lineHeight: 1.8 }}>
              已过滤词：{result?.removed_tokens.slice(0, 16).join('、') || '无'}
            </div>
            <div style={{ fontSize: '12px', color: '#8A8070', lineHeight: 1.8, marginTop: '8px' }}>
              无词向量词：{result?.missing_vectors.join('、') || '无'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
