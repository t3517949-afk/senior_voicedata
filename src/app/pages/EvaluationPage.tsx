import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Cell,
} from 'recharts';
import { SemanticNetworkSection } from '../components/SemanticNetworkSection';
import {
  WEEKLY_TRENDS, HSK2_TRENDS, HSK4_TRENDS,
  TASK_SCORES, LEVEL_RADAR, IMPROVEMENT_RATES,
} from '../data/mockData';

const DIMENSION_COLORS = {
  fluency: '#2C5F8A',
  tonal: '#C07830',
  rate: '#4E7D6A',
  naturalness: '#7A6E9E',
  pause: '#A07855',
};

const DIMENSION_LABELS: Record<string, string> = {
  fluency: '流畅度',
  tonal: '连贯度',
  rate: '清晰度',
  naturalness: '丰富度',
  pause: '组织度',
};

const GROUP_LABELS = {
  HSK2: '60-64岁',
  HSK3: '65-70岁',
  HSK4: '71-75岁',
} as const;

const CHART_TABS = [
  { id: 'age-group', label: '年龄分组' },
  { id: 'task-compare', label: '任务对比' },
  { id: 'ability-radar', label: '能力雷达' },
  { id: 'semantic-network', label: '语义网络' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: 'var(--lx-bg-dark)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '4px',
        padding: '10px 14px',
        fontSize: '12px',
      }}
    >
      <div style={{ color: '#9A9488', marginBottom: '6px', fontFamily: "'Space Mono', monospace" }}>
        {label}
      </div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ color: entry.color, marginBottom: '2px' }}>
          {DIMENSION_LABELS[entry.dataKey] || entry.name}：{' '}
          <span style={{ fontFamily: "'Space Mono', monospace" }}>
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

function SectionLabel({ number, en, zh }: { number: string; en: string; zh: string }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span
          style={{
            fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
            fontSize: '10px',
            fontWeight: 700,
            color: '#C07830',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {number} · {en}
        </span>
        <div style={{ height: '1px', flex: 1, backgroundColor: '#DED8CC' }} />
      </div>
      <h2
        style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: 'clamp(20px, 2.5vw, 28px)',
          color: 'var(--lx-text-primary)',
          fontWeight: 400,
        }}
      >
        {zh}
      </h2>
    </div>
  );
}

// Level comparison
function LevelChart() {
  const data = WEEKLY_TRENDS.map((w, i) => ({
    ...w,
    HSK2_fluency: HSK2_TRENDS[i]?.fluency,
    HSK3_fluency: w.fluency,
    HSK4_fluency: HSK4_TRENDS[i]?.fluency,
  }));

  return (
    <div>
      <SectionLabel number="01" en="Age Grouping" zh="不同年龄组流畅度对比" />

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#8A8070', fontFamily: 'Space Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[1, 5]}
            tick={{ fontSize: 10, fill: '#8A8070', fontFamily: 'Space Mono' }}
            axisLine={false}
            tickLine={false}
            ticks={[1, 2, 3, 4, 5]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="HSK2_fluency" name={GROUP_LABELS.HSK2} stroke="#C07830" strokeWidth={2} dot={{ r: 3, fill: '#C07830', stroke: '#F4F0E8', strokeWidth: 2 }} animationDuration={800} />
          <Line type="monotone" dataKey="HSK3_fluency" name={GROUP_LABELS.HSK3} stroke="#2C5F8A" strokeWidth={2} dot={{ r: 3, fill: '#2C5F8A', stroke: '#F4F0E8', strokeWidth: 2 }} animationDuration={800} />
          <Line type="monotone" dataKey="HSK4_fluency" name={GROUP_LABELS.HSK4} stroke="#4E7D6A" strokeWidth={2} dot={{ r: 3, fill: '#4E7D6A', stroke: '#F4F0E8', strokeWidth: 2 }} animationDuration={800} />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
        {[
          { level: GROUP_LABELS.HSK2, color: '#C07830', from: 2.8, to: 3.8 },
          { level: GROUP_LABELS.HSK3, color: '#2C5F8A', from: 2.4, to: 3.8 },
          { level: GROUP_LABELS.HSK4, color: '#4E7D6A', from: 2.1, to: 3.3 },
        ].map((l) => (
          <div key={l.level} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '2px', backgroundColor: l.color }} />
            <span style={{ fontSize: '12px', color: '#6A6258' }}>
              {l.level}：
              <span style={{ fontFamily: "'Space Mono', monospace", color: l.color }}>
                {l.from}→{l.to}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Key insight */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px 20px',
          backgroundColor: 'rgba(44,95,138,0.06)',
          borderLeft: '2px solid rgba(44,95,138,0.4)',
          borderRadius: '2px',
          fontSize: '13px',
          color: '#4A4440',
          lineHeight: 1.8,
        }}
      >
        <strong style={{ color: '#2C5F8A' }}>发现：</strong>
        三个年龄组都呈现出阶段性提升趋势，其中60-64岁组的整体起点较高，71-75岁组在持续记录与反馈支持下也能保持稳定改善，说明平台设计需要兼顾差异化表达与低门槛使用。
      </div>
    </div>
  );
}

// Task comparison chart
function TaskChart() {
  const taskScoreRows = [TASK_SCORES.slice(0, 3), TASK_SCORES.slice(3)];

  return (
    <div>
      <SectionLabel number="02" en="Task Comparison" zh="不同任务类型多维表现对比" />

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={TASK_SCORES} margin={{ top: 8, right: 16, bottom: 8, left: -20 }} barSize={14}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="task"
            tick={{ fontSize: 11, fill: '#6A6258' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[2, 5]}
            tick={{ fontSize: 10, fill: '#8A8070', fontFamily: 'Space Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconSize={8}
            iconType="circle"
            formatter={(value) => (
              <span style={{ fontSize: '12px', color: '#6A6258' }}>
                {DIMENSION_LABELS[value] || value}
              </span>
            )}
          />
          {Object.entries(DIMENSION_COLORS).map(([key, color]) => (
            <Bar key={key} dataKey={key} fill={color} radius={[2, 2, 0, 0]} animationDuration={800} />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: '24px', display: 'grid', gap: '12px' }}>
        {taskScoreRows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            {row.map((t) => {
              const avg = (Object.values(t).filter((v) => typeof v === 'number') as number[]).reduce((a, b) => a + b, 0) / 5;
              return (
                <div
                  key={t.task}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: 'rgba(255,255,255,0.6)',
                    border: '1px solid #EDE9DF',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontSize: '13px', color: 'var(--lx-text-primary)', marginBottom: '4px' }}>{t.task}</div>
                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '20px',
                      color: '#2C5F8A',
                    }}
                  >
                    {avg.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8A8070' }}>综合均分</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Radar chart
function RadarChartSection() {
  const radarData = ['fluency', 'tonal', 'rate', 'naturalness', 'pause'].map((key) => ({
    dimension: DIMENSION_LABELS[key],
    HSK2: LEVEL_RADAR.HSK2[key as keyof typeof LEVEL_RADAR.HSK2],
    HSK3: LEVEL_RADAR.HSK3[key as keyof typeof LEVEL_RADAR.HSK3],
    HSK4: LEVEL_RADAR.HSK4[key as keyof typeof LEVEL_RADAR.HSK4],
  }));

  return (
    <div>
      <SectionLabel number="03" en="Competency Radar" zh="各年龄组五维能力雷达图" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          alignItems: 'center',
        }}
      >
        <ResponsiveContainer width="100%" height={380}>
          <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="rgba(0,0,0,0.08)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 12, fill: '#6A6258', fontFamily: "'Noto Sans SC', sans-serif" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 5]}
              tick={{ fontSize: 9, fill: '#8A8070', fontFamily: 'Space Mono' }}
              axisLine={false}
            />
            <Radar name={GROUP_LABELS.HSK2} dataKey="HSK2" stroke="#C07830" fill="#C07830" fillOpacity={0.15} strokeWidth={2} />
            <Radar name={GROUP_LABELS.HSK3} dataKey="HSK3" stroke="#2C5F8A" fill="#2C5F8A" fillOpacity={0.15} strokeWidth={2} />
            <Radar name={GROUP_LABELS.HSK4} dataKey="HSK4" stroke="#4E7D6A" fill="#4E7D6A" fillOpacity={0.15} strokeWidth={2} />
            <Legend
              iconSize={8}
              iconType="circle"
              formatter={(value) => <span style={{ fontSize: '12px', color: '#6A6258' }}>{value}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {['fluency', 'tonal', 'rate', 'naturalness', 'pause'].map((key) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#4A4440' }}>{DIMENSION_LABELS[key]}</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {(['HSK2', 'HSK3', 'HSK4'] as const).map((level) => (
                    <span
                      key={level}
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '11px',
                        color: level === 'HSK2' ? '#C07830' : level === 'HSK3' ? '#2C5F8A' : '#4E7D6A',
                      }}
                    >
                      {GROUP_LABELS[level]}{' '}
                      {LEVEL_RADAR[level][key as keyof typeof LEVEL_RADAR.HSK2].toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '3px' }}>
                {(['HSK2', 'HSK3', 'HSK4'] as const).map((level) => {
                  const score = LEVEL_RADAR[level][key as keyof typeof LEVEL_RADAR.HSK2];
                  const color = level === 'HSK2' ? '#C07830' : level === 'HSK3' ? '#2C5F8A' : '#4E7D6A';
                  return (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        height: '6px',
                        backgroundColor: '#EDE9DF',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${(score / 5) * 100}%`,
                          backgroundColor: color,
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Improvement analysis
function ImprovementChart() {
  return (
    <div>
      <SectionLabel number="04" en="Improvement Analysis" zh="各维度阶段变化幅度" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {IMPROVEMENT_RATES.map((item, i) => (
          <div
            key={item.metric}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 100px',
              gap: '24px',
              alignItems: 'center',
              padding: '20px 0',
              borderTop: i > 0 ? '1px solid #EDE9DF' : undefined,
            }}
          >
            <div>
              <div style={{ fontSize: '14px', color: 'var(--lx-text-primary)', marginBottom: '3px' }}>{item.metric}</div>
              <div style={{ fontSize: '11px', color: '#8A8070', fontFamily: "'Space Mono', monospace" }}>
                {item.from.toFixed(1)} → {item.to.toFixed(1)}
              </div>
            </div>
            <div>
              <div
                style={{
                  height: '8px',
                  backgroundColor: '#EDE9DF',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Before bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${(item.from / 5) * 100}%`,
                    backgroundColor: '#DED8CC',
                    borderRadius: '4px',
                  }}
                />
                {/* After bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${(item.to / 5) * 100}%`,
                    backgroundColor: item.rate > 75 ? '#4E7D6A' : '#2C5F8A',
                    borderRadius: '4px',
                    opacity: 0.8,
                  }}
                />
                {/* Improvement segment */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${(item.from / 5) * 100}%`,
                    top: 0,
                    height: '100%',
                    width: `${((item.to - item.from) / 5) * 100}%`,
                    backgroundColor: item.rate > 75 ? '#4E7D6A' : '#C07830',
                    borderRadius: '0 4px 4px 0',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                }}
              >
                <span style={{ fontSize: '10px', color: '#8A8070', fontFamily: "'Space Mono', monospace" }}>1.0</span>
                <span style={{ fontSize: '10px', color: '#8A8070', fontFamily: "'Space Mono', monospace" }}>5.0</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '22px',
                  color: item.rate > 75 ? '#4E7D6A' : '#C07830',
                  lineHeight: 1,
                }}
              >
                +{item.rate.toFixed(1)}%
              </div>
              <div style={{ fontSize: '10px', color: '#8A8070' }}>提升幅度</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall summary */}
      <div
        style={{
          marginTop: '32px',
          padding: '24px',
          backgroundColor: 'var(--lx-bg-dark)',
          borderRadius: '4px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '24px',
        }}
      >
        {[
          { label: '突出改善维度', value: '流畅度', sub: '+58.3%', color: '#4E7D6A' },
          { label: '补充观察维度', value: '组织度', sub: '+45.8%', color: '#2C5F8A' },
          { label: '平均变化幅度', value: '50%左右', sub: '跨五个维度', color: '#C07830' },
          { label: '当前分析重点', value: '持续优化', sub: '结合试点反馈迭代', color: '#7A6E9E' },
        ].map((stat) => (
          <div key={stat.label}>
            <div style={{ fontSize: '10px', color: '#5A5248', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase' }}>
              {stat.label}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '18px', color: stat.color, marginBottom: '3px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '11px', color: '#5A5248' }}>{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EvaluationPage() {
  const [activeTab, setActiveTab] = useState('age-group');
  const [activeDimensions, setActiveDimensions] = useState(['fluency', 'tonal', 'naturalness']);
  const location = useLocation();

  useEffect(() => {
    const hash = decodeURIComponent(location.hash || '').replace('#', '');
    const validIds = CHART_TABS.map((tab) => tab.id);
    if (validIds.includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  useEffect(() => {
    const hash = decodeURIComponent(location.hash || '').replace('#', '');
    if (!hash) return;
    window.requestAnimationFrame(() => {
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, [location.hash, activeTab]);

  return (
    <div style={{ backgroundColor: 'var(--lx-bg-page)', minHeight: '100vh' }}>
      {/* ─── Page Header ─── */}
      <div
        style={{
          backgroundColor: 'var(--lx-bg-dark)',
          padding: 'clamp(48px, 8vw, 80px) 32px 0',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '32px', backgroundColor: '#C07830' }} />
            <span
              style={{
                fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: '#C07830',
                textTransform: 'uppercase',
              }}
            >
              Evaluation Results
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(28px, 4vw, 48px)',
              color: 'var(--lx-text-on-dark)',
              fontWeight: 700,
              marginBottom: '34px',
            }}
          >
            评价结果
          </h1>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {CHART_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    window.history.replaceState(null, '', `#${tab.id}`);
                    const target = document.getElementById(tab.id);
                    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '14px 20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #C07830' : '2px solid transparent',
                    color: isActive ? '#C07830' : '#6A6258',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'color 0.2s, border-color 0.2s',
                    letterSpacing: '0.03em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Chart Content ─── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 32px 80px' }}>
        {activeTab === 'age-group' && (
          <div id="age-group" style={{ scrollMarginTop: '92px' }}>
            <LevelChart />
          </div>
        )}
        {activeTab === 'task-compare' && (
          <div id="task-compare" style={{ scrollMarginTop: '92px' }}>
            <TaskChart />
          </div>
        )}
        {activeTab === 'ability-radar' && (
          <div id="ability-radar" style={{ scrollMarginTop: '92px' }}>
            <RadarChartSection />
          </div>
        )}
        {activeTab === 'semantic-network' && (
          <div id="semantic-network" style={{ scrollMarginTop: '92px' }}>
            <SemanticNetworkSection />
          </div>
        )}

        {/* Navigation between charts */}
        <div
          style={{
            marginTop: '56px',
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #DED8CC',
            paddingTop: '24px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {CHART_TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.history.replaceState(null, '', `#${tab.id}`);
                  const target = document.getElementById(tab.id);
                  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? '#C07830' : '#DED8CC',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(() => {
              const currentIdx = CHART_TABS.findIndex((t) => t.id === activeTab);
              return (
                <>
                  {currentIdx > 0 && (
                    <button
                      onClick={() => {
                        const id = CHART_TABS[currentIdx - 1].id;
                        setActiveTab(id);
                        window.history.replaceState(null, '', `#${id}`);
                        const target = document.getElementById(id);
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #DED8CC',
                        borderRadius: '2px',
                        backgroundColor: 'transparent',
                        color: '#6A6258',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      ← 上一个
                    </button>
                  )}
                  {currentIdx < CHART_TABS.length - 1 && (
                    <button
                      onClick={() => {
                        const id = CHART_TABS[currentIdx + 1].id;
                        setActiveTab(id);
                        window.history.replaceState(null, '', `#${id}`);
                        const target = document.getElementById(id);
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #2C5F8A',
                        borderRadius: '2px',
                        backgroundColor: 'transparent',
                        color: '#2C5F8A',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      下一个 →
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
