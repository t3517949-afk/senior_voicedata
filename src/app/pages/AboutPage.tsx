import { useEffect, useState } from 'react';
import { TEAM_MEMBERS } from '../data/mockData';

const ACHIEVEMENTS = [
  {
    year: '2026.03',
    type: '平台',
    title: '微信小程序“聆伴”完成初步搭建',
    venue: '形成老人端与家人端双端协同的基础功能框架',
    color: '#2C5F8A',
  },
  {
    year: '2026.03',
    type: '平台',
    title: '微信公众号“聆夕”完成初步建设',
    venue: '围绕热词解读、陪伴故事与适老资讯形成内容雏形',
    color: '#4E7D6A',
  },
  {
    year: '2026.03',
    type: '文档',
    title: '老龄化语料设计与知情同意材料完成整理',
    venue: '为后续语料采集、试点实施与规范化研究提供基础',
    color: '#C07830',
  },
  {
    year: '2026.03',
    type: '展示',
    title: '网页端综合展示页面上线',
    venue: '用于集中呈现项目目标、语音样本、分析路径与应用价值',
    color: '#7A6E9E',
  },
];

const TIMELINE = [
  { stage: '当前', time: '前置阶段', content: '网站功能与可视化展示', current: true },
  { stage: '第1-4个月', time: '2026年3月-2026年5月', content: '前期语料收集与整理工作' },
  { stage: '第5-8个月', time: '2026年6月-2026年10月', content: '开展社会调研与语音实验' },
  { stage: '第8-12个月', time: '2026年11月-2027年2月', content: '整理语音材料并开展数据分析' },
  { stage: '第13-16个月', time: '2027年3月-2027年7月', content: '进一步开发“聆伴”小程序与“聆夕”公众号' },
  { stage: '第17-20个月', time: '2027年8月-2027年10月', content: '开展小范围应用试点、线下活动与反馈收集' },
  { stage: '第21-24个月', time: '2027年11月-2028年3月', content: '完成项目总结与结题准备' },
];

const AFFILIATIONS = [
  { name: '南开大学 文学院', sub: '语料采集、任务设计与语言分析', logo: '文' },
  { name: '南开大学 统计与数据科学学院', sub: '数据处理、模型实现与可视化支持', logo: '统' },
  { name: '指导教师支持', sub: '实验语音学、语言计算与方法指导', logo: '导' },
];

type ResearchResourceItem = {
  id: string;
  type: 'file' | 'link' | 'official_account' | 'miniapp';
  title: string;
  url: string;
  description?: string | null;
  hint?: string | null;
  qr_image_url?: string | null;
  file_name?: string | null;
  file_ext?: string | null;
  size_bytes?: number | null;
  created_at: string;
};

const PINNED_RESOURCES: ResearchResourceItem[] = [
  {
    id: 'fallback-exp-corpus-design-pdf',
    type: 'file',
    title: '实验语料设计说明',
    url: `${import.meta.env.BASE_URL}research-resources/experiment-design.pdf`,
    description: '实验语料设计说明文档（PDF）',
    file_name: 'experiment-design.pdf',
    file_ext: '.pdf',
    size_bytes: null,
    created_at: '2026-03-19T00:00:00+08:00',
  },
  {
    id: 'fallback-project-review-pdf',
    type: 'file',
    title: '项目研究综述',
    url: `${import.meta.env.BASE_URL}research-resources/project-review.pdf`,
    description: '项目研究综述文档（PDF）',
    file_name: 'project-review.pdf',
    file_ext: '.pdf',
    size_bytes: null,
    created_at: '2026-03-17T00:00:00+08:00',
  },
  {
    id: 'fallback-lingxi-official-account-qr',
    type: 'official_account',
    title: '公众号“聆夕”二维码',
    url: `${import.meta.env.BASE_URL}images/qrcode-official.jpg`,
    hint: '欢迎关注公众号“聆夕”',
    qr_image_url: `${import.meta.env.BASE_URL}images/qrcode-official.jpg`,
    file_name: 'qrcode-official.jpg',
    file_ext: '.jpg',
    size_bytes: null,
    created_at: '2026-03-20T00:00:00+08:00',
  },
  {
    id: 'fallback-lingban-miniapp-qr',
    type: 'miniapp',
    title: '小程序“聆伴（体验版）”二维码',
    url: `${import.meta.env.BASE_URL}images/qrcode-miniprogram.png`,
    hint: '欢迎使用小程序“聆伴（体验版）”',
    qr_image_url: `${import.meta.env.BASE_URL}images/qrcode-miniprogram.png`,
    file_name: 'qrcode-miniprogram.png',
    file_ext: '.png',
    size_bytes: null,
    created_at: '2026-03-20T00:00:00+08:00',
  },
  {
    id: 'fallback-corpus-leveling-pdf',
    type: 'file',
    title: '老年人语音评价中的语料分级说明',
    url: `${import.meta.env.BASE_URL}research-resources/grading-guide.pdf`,
    description: '老年人语音评价中的语料分级说明文档（PDF）',
    file_name: 'grading-guide.pdf',
    file_ext: '.pdf',
    size_bytes: null,
    created_at: '2026-03-22T00:00:00+08:00',
  },
];

function formatResourceSize(size: number | null | undefined) {
  if (!size || size <= 0) return '--';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatResourceDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '--';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function mergeResources(
  dynamicResources: ResearchResourceItem[],
  pinnedResources: ResearchResourceItem[],
): ResearchResourceItem[] {
  const seen = new Set<string>();
  const merged: ResearchResourceItem[] = [];

  const getResourceKey = (item: ResearchResourceItem) => {
    const normalizedFileName = item.file_name?.trim().toLowerCase();
    if (item.type === 'file' && normalizedFileName) {
      return `${item.type}::${normalizedFileName}`;
    }

    const normalizedTitle = item.title.trim().toLowerCase();
    return `${item.type}::${normalizedTitle}::${item.url}`;
  };

  const pushIfNew = (item: ResearchResourceItem) => {
    const key = getResourceKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  };

  pinnedResources.forEach(pushIfNew);
  dynamicResources.forEach(pushIfNew);

  return merged.sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

function MemberCard({ member, index }: { member: typeof TEAM_MEMBERS[0]; index: number }) {
  const initials = member.name.slice(-2);
  const colors = ['#2C5F8A', '#C07830', '#4E7D6A', '#7A6E9E', '#A07855'];
  const color = colors[index % colors.length];

  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.5)',
        border: '1px solid #EDE9DF',
        borderRadius: '4px',
        padding: '32px 28px',
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = color;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.08)`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = '#EDE9DF';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: `${color}18`,
          border: `2px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          fontFamily: "'Noto Serif SC', serif",
          fontSize: '18px',
          color: color,
          fontWeight: 400,
        }}
      >
        {initials}
      </div>

      {/* Role badge */}
      <div
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          backgroundColor: `${color}12`,
          color: color,
          fontSize: '11px',
          borderRadius: '2px',
          letterSpacing: '0.05em',
          marginBottom: '8px',
        }}
      >
        {member.role}
      </div>

      {/* Name */}
      <h3
        style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: '18px',
          color: 'var(--lx-text-primary)',
          fontWeight: 400,
          marginBottom: '4px',
        }}
      >
        {member.name}
      </h3>
      <div style={{ fontSize: '13px', color: '#7D7568', marginBottom: '12px' }}>{member.title}</div>
      <div style={{ fontSize: '12px', color: '#8A8070', marginBottom: '16px', lineHeight: 1.6 }}>
        {member.affiliation}
      </div>

      <div
        style={{
          display: 'grid',
          gap: '6px',
          marginBottom: '18px',
          padding: '12px 14px',
          backgroundColor: 'rgba(255,255,255,0.42)',
          border: '1px solid #EAE3D8',
          borderRadius: '3px',
        }}
      >
        {member.studentId && (
          <div style={{ fontSize: '12px', color: '#6A6258', lineHeight: 1.6 }}>
            <span style={{ color: '#8A8070', display: 'inline-block', minWidth: '44px' }}>学号</span>
            <span style={{ fontFamily: "'Space Mono', monospace" }}>{member.studentId}</span>
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#6A6258', lineHeight: 1.6 }}>
          <span style={{ color: '#8A8070', display: 'inline-block', minWidth: '44px' }}>电话</span>
          <span style={{ fontFamily: "'Space Mono', monospace" }}>{member.phone}</span>
        </div>
        <div style={{ fontSize: '12px', color: '#6A6258', lineHeight: 1.6, wordBreak: 'break-all' }}>
          <span style={{ color: '#8A8070', display: 'inline-block', minWidth: '44px' }}>邮箱</span>
          <span>{member.email}</span>
        </div>
      </div>
    </div>
  );
}

export function AboutPage() {
  const [resources, setResources] = useState<ResearchResourceItem[]>([]);
  const [resourceLoading, setResourceLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setResourceLoading(true);
    fetch('/api/research-resources', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `HTTP ${response.status}`);
        }
        return response.json() as Promise<ResearchResourceItem[]>;
      })
      .then((data) => {
        const dynamicResources = Array.isArray(data) ? data : [];
        setResources(mergeResources(dynamicResources, PINNED_RESOURCES));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setResources(PINNED_RESOURCES);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setResourceLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--lx-bg-page)', minHeight: '100vh' }}>
      {/* ─── Page Header ─── */}
      <div
        style={{
          backgroundColor: 'var(--lx-bg-dark)',
          padding: 'clamp(48px, 8vw, 80px) 32px 64px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '40px', right: '10%', display: 'flex', gap: '3px', opacity: 0.15, pointerEvents: 'none' }}>
          {[12, 20, 32, 44, 56, 44, 32, 20, 36, 52, 40, 28, 44, 36, 24].map((h, i) => (
            <div key={i} style={{ width: '4px', height: `${h}px`, backgroundColor: '#C07830', borderRadius: '2px' }} />
          ))}
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '32px', backgroundColor: '#C07830' }} />
            <span style={{ fontFamily: "'Manrope', 'Inter', sans-serif", fontSize: '11px', letterSpacing: '0.2em', color: '#C07830', textTransform: 'uppercase' }}>
              About Us
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
            关于我们
          </h1>

          {/* Affiliation logos */}
          <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
            {AFFILIATIONS.map((aff) => (
              <div
                key={aff.name}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(192,120,48,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    color: '#C07830',
                    fontFamily: "'Manrope', 'Inter', sans-serif",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {aff.logo}
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#C8C2B8' }}>{aff.name}</div>
                  <div style={{ fontSize: '11px', color: '#5A5248' }}>{aff.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          Team Members
          ══════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '32px', backgroundColor: '#C07830' }} />
            <span style={{ fontFamily: "'Manrope', 'Inter', sans-serif", fontSize: '11px', letterSpacing: '0.2em', color: '#C07830', textTransform: 'uppercase' }}>
              Project Staff
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(20px, 3vw, 32px)',
              color: 'var(--lx-text-primary)',
              fontWeight: 400,
              marginBottom: '40px',
            }}
          >
            项目人员
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '16px', alignItems: 'stretch' }}>
            {TEAM_MEMBERS.map((member, i) => (
              <MemberCard key={member.name} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Project Achievements
          ══════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: 'var(--lx-bg-dark)',
          padding: 'clamp(48px, 8vw, 80px) 32px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '32px', backgroundColor: '#4E7D6A' }} />
            <span style={{ fontFamily: "'Manrope', 'Inter', sans-serif", fontSize: '11px', letterSpacing: '0.2em', color: '#4E7D6A', textTransform: 'uppercase' }}>
              Achievements
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(20px, 3vw, 32px)',
              color: 'var(--lx-text-on-dark)',
              fontWeight: 400,
              marginBottom: '40px',
            }}
          >
            项目成果
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {ACHIEVEMENTS.map((ach) => (
              <div
                key={ach.title}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 56px 1fr',
                  gap: '20px',
                  padding: '20px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Manrope', 'Inter', sans-serif",
                    fontSize: '11px',
                    color: '#5A5248',
                    paddingTop: '2px',
                  }}
                >
                  {ach.year}
                </div>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      backgroundColor: `${ach.color}18`,
                      color: ach.color,
                      fontSize: '10px',
                      borderRadius: '2px',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {ach.type}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#C8C2B8', marginBottom: '4px', lineHeight: 1.6 }}>
                    {ach.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#5A5248' }}>{ach.venue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Project Timeline
          ══════════════════════════════════════ */}
      <section id="about-timeline" style={{ scrollMarginTop: '92px', padding: 'clamp(48px, 8vw, 80px) 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '32px', backgroundColor: '#2C5F8A' }} />
            <span style={{ fontFamily: "'Manrope', 'Inter', sans-serif", fontSize: '11px', letterSpacing: '0.2em', color: '#2C5F8A', textTransform: 'uppercase' }}>
              Project Timeline
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(20px, 3vw, 32px)',
              color: 'var(--lx-text-primary)',
              fontWeight: 400,
              marginBottom: '40px',
            }}
          >
            研究时间线
          </h2>

          <div style={{ position: 'relative', paddingLeft: '32px' }}>
            {/* Vertical line */}
            <div
              style={{
                position: 'absolute',
                left: '7px',
                top: '8px',
                bottom: '8px',
                width: '1px',
                backgroundColor: '#DED8CC',
              }}
            />

            {TIMELINE.map((event, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '124px minmax(220px, 280px) 1fr',
                  gap: '20px',
                  marginBottom: '24px',
                  position: 'relative',
                  alignItems: 'flex-start',
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-28px',
                    top: '4px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: event.current ? '#C07830' : '#DED8CC',
                    border: event.current ? '2px solid #C07830' : '2px solid #DED8CC',
                    boxShadow: event.current ? '0 0 0 3px rgba(192,120,48,0.2)' : 'none',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '11px',
                    color: '#8A8070',
                    paddingTop: '3px',
                    flexShrink: 0,
                    textAlign: 'left',
                  }}
                >
                  {event.stage}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '14px',
                    color: event.current ? '#C07830' : '#4A4440',
                    lineHeight: 1.55,
                    textAlign: 'left',
                  }}
                >
                  {event.time}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: event.current ? '#C07830' : '#4A4440',
                    fontWeight: event.current ? 500 : 400,
                    lineHeight: 1.6,
                    textAlign: 'left',
                  }}
                >
                  {event.content}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════
          Research Resources
          ══════════════════════════════════════ */}
      <section
        id="about-resources"
        style={{
          scrollMarginTop: '92px',
          backgroundColor: 'var(--lx-bg-dark)',
          padding: 'clamp(48px, 8vw, 80px) 32px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '32px', backgroundColor: '#C07830' }} />
            <span style={{ fontFamily: "'Manrope', 'Inter', sans-serif", fontSize: '11px', letterSpacing: '0.2em', color: '#C07830', textTransform: 'uppercase' }}>
              Research Resources
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(20px, 3vw, 32px)',
              color: 'var(--lx-text-on-dark)',
              fontWeight: 400,
              marginBottom: '40px',
            }}
          >
            研究资源
          </h2>

          {resourceLoading && (
            <div style={{ fontSize: '13px', color: '#8A8070' }}>正在加载研究资源...</div>
          )}

          {!resourceLoading && resources.length === 0 && (
            <div style={{ fontSize: '13px', color: '#8A8070' }}>暂无研究资源。</div>
          )}

          {!resourceLoading && resources.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {resources.map((item) => {
                const isQrResource = item.type === 'official_account' || item.type === 'miniapp';
                const rowMinHeight = isQrResource ? '128px' : '72px';
                const rowPadding = isQrResource ? '14px 0' : '6px 0';
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '104px 56px 1fr',
                      gap: '20px',
                      minHeight: rowMinHeight,
                      padding: rowPadding,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Manrope', 'Inter', sans-serif",
                        fontSize: '11px',
                        color: '#7D7568',
                        lineHeight: 1.4,
                      }}
                    >
                      {formatResourceDate(item.created_at)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          backgroundColor:
                            item.type === 'file'
                              ? 'rgba(192,120,48,0.16)'
                              : item.type === 'official_account'
                                ? 'rgba(44,95,138,0.18)'
                                : 'rgba(78,125,106,0.18)',
                          color:
                            item.type === 'file'
                              ? '#C07830'
                              : item.type === 'official_account'
                                ? '#2C5F8A'
                                : '#4E7D6A',
                          fontSize: '10px',
                          borderRadius: '2px',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {item.type === 'file' ? '文档' : item.type === 'official_account' ? '公众号' : item.type === 'miniapp' ? '小程序' : '链接'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {isQrResource ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'grid',
                            gridTemplateColumns: '96px minmax(220px, 1fr)',
                            alignItems: 'center',
                            gap: '14px',
                            width: '100%',
                          }}
                        >
                          <img
                            src={item.qr_image_url || item.url}
                            alt={item.title}
                            style={{
                              width: '96px',
                              height: '96px',
                              objectFit: 'cover',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '2px',
                              backgroundColor: '#fff',
                            }}
                          />
                          <div style={{ fontSize: '14px', color: '#C8C2B8', lineHeight: 1.65 }}>
                            {item.hint || item.title}
                          </div>
                        </a>
                      ) : (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          download={item.type === 'file' ? (item.file_name || item.title) : undefined}
                          style={{
                            color: '#2F59D9',
                            textDecoration: 'underline',
                            fontSize: '14px',
                            lineHeight: 1.5,
                            wordBreak: 'break-all',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {item.type === 'file' ? `📄 ${item.file_name || item.title}` : `🔗 ${item.title}`}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═════════════════════════════════════��
          Contact
          ══════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: 'var(--lx-bg-dark)',
          padding: '48px 32px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '40px',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: '#5A5248', letterSpacing: '0.15em', marginBottom: '12px', textTransform: 'uppercase' }}>项目定位</div>
            <div style={{ fontSize: '14px', color: '#C8C2B8', marginBottom: '6px' }}>老年人认知健康与情感陪伴平台</div>
            <div style={{ fontSize: '12px', color: '#5A5248' }}>以语音记录、状态观察与反馈支持为核心</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#5A5248', letterSpacing: '0.15em', marginBottom: '12px', textTransform: 'uppercase' }}>平台组成</div>
            <div style={{ fontSize: '14px', color: '#C8C2B8', marginBottom: '6px' }}>公众号“聆夕” + 小程序“聆伴”</div>
            <div style={{ fontSize: '12px', color: '#5A5248' }}>形成内容传播与功能承接的联动结构</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#5A5248', letterSpacing: '0.15em', marginBottom: '12px', textTransform: 'uppercase' }}>试点场景</div>
            <div style={{ fontSize: '14px', color: '#C8C2B8', marginBottom: '4px' }}>老年大学、养老机构与居家场景</div>
            <div style={{ fontSize: '12px', color: '#5A5248' }}>重点关注真实使用环境中的适配性与接受度</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#5A5248', letterSpacing: '0.15em', marginBottom: '12px', textTransform: 'uppercase' }}>成果说明</div>
            <div style={{ fontSize: '12px', color: '#7D7568', lineHeight: 1.7 }}>
              当前页面为项目展示版本，集中呈现研究目标、阶段性语音样本、平台结构与后续优化方向。
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
