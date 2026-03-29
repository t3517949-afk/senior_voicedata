import { useRef, useEffect, useState } from 'react';
import { IMPROVEMENT_RATES } from '../data/mockData';

function useFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

const FINDINGS = [
  {
    number: '01',
    title: '语音研究被转化为现实支持场景',
    content:
      '项目不再将语音研究停留在实验描述层面，而是尝试把语音记录、状态观察、反馈建议与陪伴支持放入同一使用场景中，形成更贴近日常生活的适老化平台。',
    metric: { label: '核心研究环节', value: '4 个' },
    color: '#2C5F8A',
  },
  {
    number: '02',
    title: '“公众号 + 小程序”形成双端联动',
    content:
      '微信公众号“聆夕”承担内容传播、知识引导与情感触达，小程序“聆伴”承担语音采集、评分反馈与持续记录，二者共同构成项目的服务闭环。',
    metric: { label: '联动平台', value: '2 端' },
    color: '#C07830',
  },
  {
    number: '03',
    title: '“老人端 + 家人端”强调陪伴协同',
    content:
      '项目不仅关注老年用户个人表达状态，也尝试为家庭成员提供更温和、具体的陪伴入口，让共享总结、远程留言与陪伴提醒成为家庭沟通的辅助抓手。',
    metric: { label: '主要角色', value: '2 类' },
    color: '#4E7D6A',
  },
  {
    number: '04',
    title: '评估与训练被设计为连续闭环',
    content:
      '平台希望把语音采集后的多维分析结果继续转化为更易理解的反馈语和后续训练建议，使“采集—评价—训练—再观察”的路径能够持续发生。',
    metric: { label: '核心观察维度', value: '5 项' },
    color: '#7A6E9E',
  },
  {
    number: '05',
    title: '试点应用决定平台能否真正落地',
    content:
      '项目后续将在老年大学、养老机构与社区等场景中收集真实反馈，通过试用、访谈和问卷不断校正功能设置、提示方式与适老化表达。',
    metric: { label: '重点推广场景', value: '多场景' },
    color: '#A07855',
  },
];

const APPLICATIONS = [
  {
    icon: '🎯',
    title: '认知健康观察',
    desc: '通过持续语音记录与阶段总结，为表达状态变化提供更可感知的观察路径。',
  },
  {
    icon: '🤖',
    title: '情感陪伴支持',
    desc: '把心情记录、回忆讲述和陪伴内容触达结合起来，增强日常表达与被倾听感。',
  },
  {
    icon: '📊',
    title: '家庭协同沟通',
    desc: '让家人通过共享总结、远程留言与陪伴提醒更自然地参与日常支持。',
  },
  {
    icon: '🔬',
    title: '适老化数字服务',
    desc: '在公众号与小程序的轻量形态下探索更低门槛、更可持续的老年服务方式。',
  },
];

const FUTURE_DIRECTIONS = [
  { title: '扩充语料样本', desc: '继续拓展老年大学、养老机构与社区合作，提升样本数量与覆盖范围。' },
  { title: '完善模型能力', desc: '逐步引入更适合本项目需求的深度学习模型，提升语音分析与反馈质量。' },
  { title: '加强评估验证', desc: '推动语音指标与更多实际评估标准之间的对照与解释工作。' },
  { title: '深化试点推广', desc: '围绕真实反馈持续优化功能、提示语和适老化交互表达。' },
];

export function ConclusionPage() {
  const heroFade = useFadeIn();

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
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            right: '-60px',
            bottom: '-60px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            border: '1px solid rgba(192,120,48,0.08)',
            pointerEvents: 'none',
          }}
        />

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
              Conclusions & Value
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
            结论与价值
          </h1>

          {/* Key numbers row */}
          <div
            style={{
              display: 'flex',
              gap: '48px',
              marginTop: '40px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { v: '5', unit: '项', label: '核心发现' },
              { v: '4', unit: '个', label: '应用方向' },
              { v: '4', unit: '项', label: '后续优化计划' },
            ].map((s) => (
              <div key={s.label} style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '14px', minWidth: '100px' }}>
                <div
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '32px',
                    fontWeight: 700,
                    letterSpacing: '-0.012em',
                    fontVariantNumeric: 'lining-nums tabular-nums',
                    color: '#C07830',
                    lineHeight: 0.95,
                    display: 'inline-flex',
                    alignItems: 'flex-end',
                    marginBottom: '8px',
                  }}
                >
                  {s.v}
                  <span
                    style={{
                      fontFamily: "'PingFang SC', 'Noto Sans SC', sans-serif",
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: 1,
                      letterSpacing: '-0.01em',
                      color: '#6A6258',
                      marginLeft: '4px',
                      alignSelf: 'flex-end',
                    }}
                  >
                    {s.unit}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'PingFang SC', 'Noto Sans SC', sans-serif",
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#5A5248',
                    lineHeight: 1.25,
                    letterSpacing: '0.01em',
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          核心发现 FINDINGS
          ══════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <div style={{ height: '1px', width: '32px', backgroundColor: '#C07830' }} />
            <span style={{ fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', color: '#C07830', textTransform: 'uppercase' }}>
              Key Findings
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(20px, 3vw, 32px)',
              color: 'var(--lx-text-primary)',
              fontWeight: 400,
              marginBottom: '48px',
            }}
            >
            五项核心内容提炼
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {FINDINGS.map((finding, i) => (
              <FindingCard key={finding.number} finding={finding} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          应用价值
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
            <span style={{ fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', color: '#4E7D6A', textTransform: 'uppercase' }}>
              Application Value
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(20px, 3vw, 32px)',
              color: 'var(--lx-text-on-dark)',
              fontWeight: 400,
              marginBottom: '48px',
            }}
          >
            应用意义
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '2px',
              backgroundColor: 'rgba(255,255,255,0.04)',
            }}
          >
            {APPLICATIONS.map((app) => (
              <div
                key={app.title}
                style={{
                  backgroundColor: 'var(--lx-bg-dark)',
                  padding: '32px 28px',
                  transition: 'background-color 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#121A28'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#0E1421'; }}
              >
                <div style={{ fontSize: '28px', marginBottom: '16px' }}>{app.icon}</div>
                <h3
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: '16px',
                    color: 'var(--lx-text-on-dark)',
                    fontWeight: 400,
                    marginBottom: '12px',
                  }}
                >
                  {app.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#7D7568', lineHeight: 1.8 }}>{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          后续优化方向
          ══════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '32px', backgroundColor: '#2C5F8A' }} />
            <span style={{ fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', color: '#2C5F8A', textTransform: 'uppercase' }}>
              Future Directions
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 'clamp(20px, 3vw, 32px)',
              color: 'var(--lx-text-primary)',
              fontWeight: 400,
              marginBottom: '48px',
            }}
          >
            后续优化方向
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {FUTURE_DIRECTIONS.map((dir, i) => (
              <div
                key={dir.title}
                style={{
                  padding: '28px 24px',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  border: '1px solid #EDE9DF',
                  borderRadius: '4px',
                  transition: 'border-color 0.2s, transform 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#2C5F8A';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#EDE9DF';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#2C5F8A',
                    marginBottom: '12px',
                  }}
                >
                  0{i + 1}
                </div>
                <h3
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: '16px',
                    color: 'var(--lx-text-primary)',
                    fontWeight: 400,
                    marginBottom: '10px',
                  }}
                >
                  {dir.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#6A6058', lineHeight: 1.8 }}>{dir.desc}</p>
              </div>
            ))}
          </div>

          {/* Closing statement */}
          <div
            style={{
              marginTop: '64px',
              padding: '40px',
              backgroundColor: 'var(--lx-bg-dark)',
              borderRadius: '4px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(192,120,48,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 'clamp(16px, 2.5vw, 22px)',
                color: 'var(--lx-text-on-dark)',
                lineHeight: 1.8,
                maxWidth: '700px',
                margin: '0 auto',
                position: 'relative',
              }}
            >
              "表达，是陪伴的重要入口。让它被认真记录，
              <br />
              让表达被记录，让变化被看见，让陪伴真正发生。"
            </div>
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#5A5248', fontFamily: "'Space Mono', monospace", position: 'relative' }}>
              — 聆夕 / 聆伴项目组
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FindingCard({ finding, index }: { finding: typeof FINDINGS[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { ref, visible } = useFadeIn(index * 0.1);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`,
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'grid',
          gridTemplateColumns: '56px 1fr auto',
          gap: '24px',
          alignItems: 'center',
          padding: '24px 20px',
          backgroundColor: expanded ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
          borderBottom: '1px solid #EDE9DF',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => { if (!expanded) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.65)'; }}
        onMouseLeave={(e) => { if (!expanded) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.45)'; }}
      >
        {/* Number */}
        <div
          style={{
            fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            fontFeatureSettings: '"tnum" 1, "lnum" 1',
            color: finding.color,
            opacity: 0.7,
            lineHeight: 1,
          }}
        >
          {finding.number}
        </div>

        {/* Title + metric */}
        <div>
          <h3
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: '17px',
              color: 'var(--lx-text-primary)',
              fontWeight: 400,
              marginBottom: expanded ? '12px' : '4px',
            }}
          >
            {finding.title}
          </h3>
          {expanded && (
            <p style={{ fontSize: '14px', color: '#5A5048', lineHeight: 1.9, maxWidth: '640px' }}>
              {finding.content}
            </p>
          )}
          <div style={{ fontSize: '11px', color: '#8A8070' }}>
            {finding.metric.label}：
            <span
              style={{
                fontFamily: "'Manrope', 'Inter', 'Noto Sans SC', sans-serif",
                fontWeight: 700,
                letterSpacing: '-0.005em',
                fontFeatureSettings: '"tnum" 1, "lnum" 1',
                color: finding.color,
              }}
            >
              {finding.metric.value}
            </span>
          </div>
        </div>

        {/* Expand icon */}
        <div
          style={{
            fontSize: '20px',
            color: '#8A8070',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
            flexShrink: 0,
          }}
        >
          ↓
        </div>
      </div>
    </div>
  );
}
