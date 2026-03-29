import { useState, useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';
import { useLocation } from 'react-router';
import WaveSurfer from 'wavesurfer.js';
import {
  CORPUS,
  type CorpusItem,
} from '../data/mockData';

function buildAudioUrl(fileCode: string) {
  return `${import.meta.env.BASE_URL}audio/${encodeURIComponent(fileCode)}`;
}

type SyllableGroupItem = {
  audioSrc?: string;
  imageSrc?: string;
  pitchHz?: string;
  formants?: [string, string, string, string];
  vot?: string;
  note?: string;
};

type SyllableComparisonRow = {
  id: string;
  syllable: string;
  utteranceText: string;
  boldChar: string;
  youth: SyllableGroupItem;
  elderly: SyllableGroupItem;
};

const SYLLABLE_COMPARISON_ROWS: SyllableComparisonRow[] = [
  {
    id: 'syllable-0011',
    syllable: '/an/',
    utteranceText: '绿水青山',
    boldChar: '山',
    youth: {
      audioSrc: `syllable-compare/young0011.wav`,
      imageSrc: `syllable-compare/young0011.png`,
      pitchHz: '280.80Hz',
      formants: ['F1=738Hz', 'F2=1792Hz', 'F3=3332Hz', 'F4=4094Hz'],
    },
    elderly: {
      audioSrc: `syllable-compare/Elderly0011.wav`,
      imageSrc: `syllable-compare/elderly0011.png`,
      pitchHz: '273.72Hz',
      formants: ['F1=804Hz', 'F2=1686Hz', 'F3=2312Hz', 'F4=3536Hz'],
    },
  },
  {
    id: 'syllable-0014',
    syllable: '/ᴀ/',
    utteranceText: '新加坡',
    boldChar: '加',
    youth: {
      audioSrc: `syllable-compare/young0014.wav`,
      imageSrc: `syllable-compare/young0014.png`,
      pitchHz: '275.57Hz',
      formants: ['F1=597Hz', 'F2=1898Hz', 'F3=3134Hz', 'F4=3979Hz'],
    },
    elderly: {
      audioSrc: `syllable-compare/Elderly0014.wav`,
      imageSrc: `syllable-compare/elderly0014.png`,
      pitchHz: '236.52Hz',
      formants: ['F1=687Hz', 'F2=2173Hz', 'F3=3055Hz', 'F4=4060Hz'],
    },
  },
  {
    id: 'syllable-0015',
    syllable: '/ɑŋ/',
    utteranceText: '给他增加营养',
    boldChar: '养',
    youth: {
      audioSrc: `syllable-compare/young0015.wav`,
      imageSrc: `syllable-compare/young0015.png`,
      pitchHz: '215.16Hz',
      formants: ['F1=805.78Hz', 'F2=1187.75Hz', 'F3=3203.06Hz', 'F4=3647.03Hz'],
    },
    elderly: {
      audioSrc: `syllable-compare/Elderly0015.wav`,
      imageSrc: `syllable-compare/elderly0015.png`,
      pitchHz: '132.07Hz',
      formants: ['F1=742.60Hz', 'F2=1939.76Hz', 'F3=2954.83Hz', 'F4=4450.29Hz'],
    },
  },
  {
    id: 'syllable-0013',
    syllable: '/o/',
    utteranceText: '新加坡',
    boldChar: '坡',
    youth: {
      audioSrc: `syllable-compare/young0013.wav`,
      imageSrc: `syllable-compare/young0013.png`,
      pitchHz: '274.19Hz',
      formants: ['F1=397Hz', 'F2=899Hz', 'F3=3120Hz', 'F4=4206Hz'],
    },
    elderly: {
      audioSrc: `syllable-compare/Elderly0013.wav`,
      imageSrc: `syllable-compare/elderly0013.png`,
      pitchHz: '217.28Hz',
      formants: ['F1=500Hz', 'F2=822Hz', 'F3=2764Hz', 'F4=3833Hz'],
    },
  },
  {
    id: 'syllable-0012',
    syllable: '/p’/',
    utteranceText: '新加坡',
    boldChar: '坡',
    youth: {
      audioSrc: `syllable-compare/young0012.wav`,
      imageSrc: `syllable-compare/young0012.png`,
      vot: '0.064 s',
    },
    elderly: {
      audioSrc: `syllable-compare/Elderly0012.wav`,
      imageSrc: `syllable-compare/elderly0012.png`,
      vot: '0.016 s',
    },
  },
  {
    id: 'syllable-0016',
    syllable: '/p/',
    utteranceText: '不就三天吗',
    boldChar: '不',
    youth: {
      audioSrc: `syllable-compare/young0016.wav`,
      imageSrc: `syllable-compare/young0016.png`,
      vot: '0.028 s',
    },
    elderly: {
      audioSrc: `syllable-compare/Elderly0016.wav`,
      imageSrc: `syllable-compare/elderly0016.png`,
      vot: '0.032 s',
    },
  },
];

type MachineScoreIndicators = {
  category: string;
  language: string;
  content: string;
  duration_sec: number;
  total_score: number;
  official_scores: Record<string, number>;
};

type MachineScoreResponse = {
  code: string;
  source: string;
  total_score: number;
  indicators: MachineScoreIndicators;
};

const MACHINE_SCORE_CACHE_KEY = 'lingxi_machine_score_cache_v1';

function hashForCache(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function buildMachineScoreCacheId(code: string, text: string): string {
  return `${code}::${hashForCache(text)}`;
}

function readMachineScoreCache(): Record<string, MachineScoreResponse> {
  try {
    const raw = window.localStorage.getItem(MACHINE_SCORE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MachineScoreResponse>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function readMachineScoreFromCache(cacheId: string): MachineScoreResponse | null {
  const all = readMachineScoreCache();
  const found = all[cacheId];
  return found ?? null;
}

function writeMachineScoreToCache(cacheId: string, score: MachineScoreResponse) {
  try {
    const all = readMachineScoreCache();
    all[cacheId] = score;
    window.localStorage.setItem(MACHINE_SCORE_CACHE_KEY, JSON.stringify(all));
  } catch {
    // Ignore cache write errors to avoid blocking UI.
  }
}

// Real audio player with waveform
function AudioPlayer({ item, onClose }: { item: CorpusItem; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [totalSec, setTotalSec] = useState(item.durationSec);
  const [waveformReady, setWaveformReady] = useState(false);
  const [waveformError, setWaveformError] = useState<string | null>(null);
  const [machineScore, setMachineScore] = useState<MachineScoreResponse | null>(null);
  const [machineScoreLoading, setMachineScoreLoading] = useState(false);
  const [machineScoreError, setMachineScoreError] = useState<string | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!waveformContainerRef.current) return;

    setPlaying(false);
    setCurrentSec(0);
    setTotalSec(item.durationSec);
    setWaveformReady(false);
    setWaveformError(null);

    const waveSurfer = WaveSurfer.create({
      container: waveformContainerRef.current,
      url: buildAudioUrl(item.code),
      waveColor: 'rgba(200, 194, 184, 0.45)',
      progressColor: '#C07830',
      cursorColor: 'rgba(255, 255, 255, 0.75)',
      cursorWidth: 2,
      height: 46,
      normalize: true,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      dragToSeek: true,
      hideScrollbar: true,
    });
    waveSurferRef.current = waveSurfer;

    const unsubs = [
      waveSurfer.on('ready', (duration) => {
        setWaveformReady(true);
        setWaveformError(null);
        setTotalSec(duration > 0 ? duration : item.durationSec);
      }),
      waveSurfer.on('play', () => {
        setPlaying(true);
      }),
      waveSurfer.on('pause', () => {
        setPlaying(false);
      }),
      waveSurfer.on('finish', () => {
        const duration = waveSurfer.getDuration();
        setPlaying(false);
        setCurrentSec(duration || item.durationSec);
      }),
      waveSurfer.on('timeupdate', (time) => {
        setCurrentSec(time);
      }),
      waveSurfer.on('seeking', (time) => {
        setCurrentSec(time);
      }),
      waveSurfer.on('error', () => {
        setWaveformReady(false);
        setWaveformError(`音频加载失败：${item.code}`);
      }),
    ];

    return () => {
      unsubs.forEach((off) => off());
      waveSurfer.destroy();
      waveSurferRef.current = null;
    };
  }, [item.code, item.durationSec]);

  useEffect(() => {
    if (!waveSurferRef.current) return;
    waveSurferRef.current.setOptions({ progressColor: playing ? '#4E7D6A' : '#C07830' });
  }, [playing]);

  useEffect(() => {
    const cacheId = buildMachineScoreCacheId(item.code, item.text || '');
    const cachedScore = readMachineScoreFromCache(cacheId);
    const controller = new AbortController();
    let loadingTimer: ReturnType<typeof setTimeout> | null = null;
    setMachineScoreError(null);
    if (cachedScore) {
      setMachineScore(cachedScore);
      setMachineScoreLoading(false);
      return () => {
        controller.abort();
      };
    }

    setMachineScore(null);
    setMachineScoreLoading(false);
    loadingTimer = setTimeout(() => {
      setMachineScoreLoading(true);
    }, 350);

    fetch('/api/audio/machine-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: item.code,
        reference_text: item.text || undefined,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `HTTP ${response.status}`);
        }
        return response.json() as Promise<MachineScoreResponse>;
      })
      .then((data) => {
        setMachineScore(data);
        writeMachineScoreToCache(cacheId, data);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setMachineScoreError('机器评分暂不可用');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          if (loadingTimer) {
            clearTimeout(loadingTimer);
            loadingTimer = null;
          }
          setMachineScoreLoading(false);
        }
      });

    return () => {
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
      controller.abort();
    };
  }, [item.code, item.text]);

  const togglePlay = () => {
    const waveSurfer = waveSurferRef.current;
    if (!waveSurfer || waveformError) return;

    if (waveSurfer.isPlaying()) {
      waveSurfer.pause();
      return;
    }

    const duration = waveSurfer.getDuration();
    if (duration > 0 && waveSurfer.getCurrentTime() >= duration - 0.05) {
      waveSurfer.setTime(0);
    }
    void waveSurfer.play();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const shownTotalSec = totalSec > 0 ? totalSec : item.durationSec;
  const progress = shownTotalSec > 0 ? Math.min(100, (currentSec / shownTotalSec) * 100) : 0;

  const scoreColors: Record<string, string> = {
    fluency: '#2C5F8A',
    tonal: '#C07830',
    rate: '#4E7D6A',
    naturalness: '#7A6E9E',
    pause: '#A07855',
  };
  const scoreDimensions = [
    { key: 'fluency', label: '流畅度' },
    { key: 'tonal', label: '连贯度' },
    { key: 'rate', label: '清晰度' },
    { key: 'naturalness', label: '丰富度' },
    { key: 'pause', label: '组织度' },
  ];
  const visibleOfficialScores = Object.entries(machineScore?.indicators.official_scores || {}).filter(([key, value]) => {
    const normalizedKey = key.toLowerCase();
    if ((normalizedKey.includes('accuracy') || normalizedKey.includes('emotion')) && value <= 0) return false;
    return value >= 0;
  });

  return (
    <div
      style={{
        backgroundColor: 'var(--lx-bg-dark)',
        borderRadius: '4px',
        padding: '28px',
        marginTop: '2px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '12px',
                color: '#C07830',
                backgroundColor: 'rgba(192,120,48,0.1)',
                padding: '3px 10px',
                borderRadius: '2px',
              }}
            >
              {item.id}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#4E7D6A',
                border: '1px solid rgba(78,125,106,0.3)',
                padding: '3px 8px',
                borderRadius: '2px',
              }}
            >
              {item.level}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#8A8070' }}>
            参与者 <span style={{ color: '#C8C2B8', fontFamily: "'Space Mono', monospace" }}>{item.participant}</span>
            &ensp;·&ensp;性别 <span style={{ color: '#C8C2B8' }}>{formatGender(item.gender)}</span>
            &ensp;·&ensp;任务 <span style={{ color: '#C8C2B8' }}>{item.task}</span>
            &ensp;·&ensp;<span style={{ color: '#5A8070', fontFamily: "'Space Mono', monospace" }}>{item.date}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#5A5248',
            fontSize: '18px',
            cursor: 'pointer',
            lineHeight: 1,
            padding: '4px',
          }}
        >
          ×
        </button>
      </div>

      {/* Transcript */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderLeft: '2px solid rgba(192,120,48,0.4)',
          borderRadius: '2px',
          marginBottom: '24px',
        }}
      >
        <div style={{ fontSize: '10px', color: '#5A5248', letterSpacing: '0.12em', marginBottom: '6px', textTransform: 'uppercase' }}>
          语料文本
        </div>
        <div style={{ fontSize: '14px', color: '#C8C2B8', lineHeight: 1.8, fontFamily: "'Noto Serif SC', serif" }}>
          {item.text || '暂无对应txt转写文本。'}
        </div>
      </div>

      {/* Waveform + Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Play button */}
        <button
          onClick={togglePlay}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: playing ? '#4E7D6A' : '#C07830',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background-color 0.2s, transform 0.15s',
            color: '#fff',
            fontSize: '16px',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          {playing ? <Pause size={18} strokeWidth={3} /> : <Play size={18} strokeWidth={3} fill="currentColor" style={{ marginLeft: '2px' }} />}
        </button>

        {/* Waveform */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div
            ref={waveformContainerRef}
            aria-label="音频波形进度条"
            style={{
              height: '48px',
              width: '100%',
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              opacity: waveformError ? 0.5 : 1,
            }}
          />
          {!waveformReady && !waveformError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                color: '#8A8070',
                letterSpacing: '0.06em',
              }}
            >
              正在解析声纹图…
            </div>
          )}
          {waveformError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                color: '#C07830',
              }}
            >
              {waveformError}
            </div>
          )}
        </div>

        {/* Time */}
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '12px',
            color: '#6A6258',
            flexShrink: 0,
            textAlign: 'right',
            lineHeight: 1.4,
          }}
        >
          <div style={{ color: '#C8C2B8' }}>{formatTime(Math.round(currentSec))}</div>
          <div>{formatTime(Math.round(shownTotalSec))}</div>
          <div style={{ marginTop: '2px', color: playing ? '#4E7D6A' : '#C07830' }}>
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      {/* Score grid */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
        <div style={{ fontSize: '10px', color: '#5A5248', letterSpacing: '0.12em', marginBottom: '14px', textTransform: 'uppercase' }}>
          评价得分 (1–5分)
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {scoreDimensions.map(({ key, label }) => {
            const score = item.scores[key as keyof typeof item.scores];
            return (
              <div key={key} style={{ flex: '1', minWidth: '80px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#6A6258' }}>{label}</span>
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '12px',
                      color: scoreColors[key],
                    }}
                  >
                    {score.toFixed(1)}
                  </span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'var(--lx-score-track-bg)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(score / 5) * 100}%`,
                      backgroundColor: scoreColors[key],
                      borderRadius: '2px',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Machine score */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', marginTop: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', color: '#5A8070', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            机器评分
          </div>
          {machineScore && (
            <div style={{ fontSize: '12px', color: '#9AB7A8', fontFamily: "'Space Mono', monospace" }}>
              总分 {machineScore.total_score.toFixed(1)}
            </div>
          )}
        </div>

        {machineScoreLoading && (
          <div style={{ fontSize: '12px', color: '#8A8070' }}>
            正在分析音频并计算机器评分...
          </div>
        )}

        {!machineScoreLoading && machineScoreError && (
          <div style={{ fontSize: '12px', color: '#C07830' }}>
            {machineScoreError}
          </div>
        )}

        {!machineScoreLoading && !machineScoreError && machineScore && (
          <div style={{ display: 'grid', gap: '10px' }}>
            <div
              style={{
                height: '6px',
                backgroundColor: 'var(--lx-score-track-bg)',
                borderRadius: '3px',
                overflow: 'hidden',
                border: '1px solid rgba(29, 40, 52, 0.08)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, machineScore.total_score))}%`,
                  backgroundColor: '#5B8DFF',
                  borderRadius: '3px',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {visibleOfficialScores.map(([key, value]) => {
                const labelMap: Record<string, string> = {
                  total_score: '总分',
                  accuracy_score: '准确度',
                  emotion_score: '情感维度',
                  fluency_score: '流畅度',
                  integrity_score: '完整度',
                  phone_score: '音节维度',
                  tone_score: '声调维度',
                };
                const label = labelMap[key] || key;
                const normalized = Math.max(0, Math.min(100, value));
                return (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 56px', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#7A837C' }}>{label}</span>
                    <div
                      style={{
                        height: '4px',
                        backgroundColor: 'var(--lx-score-track-bg)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        border: '1px solid var(--lx-border-soft)',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${normalized}%`,
                          backgroundColor: '#4DAF84',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#9AB7A8', textAlign: 'right' }}>
                        {value.toFixed(1)}
                    </span>
                  </div>
                );
              })}
              {visibleOfficialScores.length === 0 && (
                <div style={{ fontSize: '11px', color: '#8A8070' }}>
                  官方本次未返回可展示的分项维度。
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

const LEVEL_FILTER_OPTIONS = ['全部', '60-64岁', '65-70岁', '71-75岁'];
const READING_TASK_OPTIONS = ['词语朗读', '语句朗读', '篇章朗读'] as const;
const SPONTANEOUS_TASK_OPTIONS = ['图片描述', '过程叙述', '故事讲述'] as const;
const TASK_CATEGORY_OPTIONS = ['全部', '音节对照', '朗读任务', '自发言语任务'] as const;
const TASK_FILTER_LEAF_OPTIONS = ['音节对照', ...READING_TASK_OPTIONS, ...SPONTANEOUS_TASK_OPTIONS] as const;

function getLevelColor(level: string) {
  if (level === '60-64岁') return { bg: 'rgba(192,120,48,0.12)', text: '#C07830' };
  if (level === '65-70岁') return { bg: 'rgba(44,95,138,0.12)', text: '#2C5F8A' };
  return { bg: 'rgba(78,125,106,0.12)', text: '#4E7D6A' };
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatGender(gender: CorpusItem['gender']) {
  return gender === 'M' ? '男' : '女';
}

function renderUtteranceText(text: string, boldChar: string) {
  const idx = text.indexOf(boldChar);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong>{boldChar}</strong>
      {text.slice(idx + boldChar.length)}
    </>
  );
}

function renderAcousticMetrics(item: SyllableGroupItem) {
  if (!item.pitchHz && !item.formants && !item.vot) return null;

  return (
    <div
      style={{
        fontSize: '15px',
        color: '#3F3933',
        lineHeight: 1.75,
        border: '1px solid #E4DED2',
        backgroundColor: 'rgba(255,255,255,0.64)',
        borderRadius: '2px',
        padding: '10px 12px',
        display: 'grid',
        gap: '6px',
      }}
    >
      {item.pitchHz && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '92px minmax(0, 1fr)',
            alignItems: 'baseline',
            columnGap: '6px',
          }}
        >
          {renderAcousticLabel('最大音高')}
          <span>{item.pitchHz}</span>
        </div>
      )}
      {item.formants && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '92px minmax(0, 1fr)',
            alignItems: 'start',
            columnGap: '6px',
          }}
        >
          {renderAcousticLabel('共振峰')}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))',
              gap: '2px 14px',
            }}
          >
            {item.formants.map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>
        </div>
      )}
      {item.vot && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '92px minmax(0, 1fr)',
            alignItems: 'baseline',
            columnGap: '6px',
          }}
        >
          <span style={{ fontWeight: 600 }}>VOT</span>
          <span>{item.vot}</span>
        </div>
      )}
    </div>
  );
}

function renderAcousticLabel(label: string) {
  const isChinese = /^[\u4e00-\u9fff]+$/.test(label);
  if (!isChinese) return <span style={{ fontWeight: 600 }}>{label}</span>;

  const fontSize = 15;
  let letterSpacing = 0;

  if (typeof document !== 'undefined' && label.length > 1) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `600 ${fontSize}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
      const targetWidth = ctx.measureText('最大音高').width;
      const currentWidth = ctx.measureText(label).width;
      letterSpacing = (targetWidth - currentWidth) / (label.length - 1);
    }
  }

  return (
    <span
      style={{
        fontWeight: 600,
        whiteSpace: 'nowrap',
        letterSpacing: `${letterSpacing.toFixed(2)}px`,
      }}
    >
      {label}
    </span>
  );
}

export function SpeechDataPage() {
  const [activeFilters, setActiveFilters] = useState({ level: '全部', task: '全部' });
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const location = useLocation();
  const taskCount = TASK_FILTER_LEAF_OPTIONS.length;
  const tableGridTemplate = '74px 74px 46px 108px minmax(220px, 1fr) 72px 72px';
  const tableColumnGap = '12px';
  const isSyllableCompareMode = activeFilters.task === '音节对照';
  const activeTaskCategory = (() => {
    if (
      activeFilters.task === '朗读任务'
      || READING_TASK_OPTIONS.includes(activeFilters.task as (typeof READING_TASK_OPTIONS)[number])
    ) return '朗读任务';
    if (
      activeFilters.task === '自发言语任务'
      || SPONTANEOUS_TASK_OPTIONS.includes(activeFilters.task as (typeof SPONTANEOUS_TASK_OPTIONS)[number])
    ) return '自发言语任务';
    if (activeFilters.task === '音节对照') return '音节对照';
    return '全部';
  })();
  const visibleTaskSubOptions =
    activeTaskCategory === '朗读任务'
      ? ['全部朗读', ...READING_TASK_OPTIONS]
      : activeTaskCategory === '自发言语任务'
        ? ['全部自发', ...SPONTANEOUS_TASK_OPTIONS]
        : [];

  const filtered = CORPUS.filter((item) => {
    if (isSyllableCompareMode) return false;
    const levelOk = activeFilters.level === '全部' || item.level === activeFilters.level;
    const taskOk =
      activeFilters.task === '全部'
      || (activeFilters.task === '朗读任务' && READING_TASK_OPTIONS.includes(item.task as (typeof READING_TASK_OPTIONS)[number]))
      || (activeFilters.task === '自发言语任务' && SPONTANEOUS_TASK_OPTIONS.includes(item.task as (typeof SPONTANEOUS_TASK_OPTIONS)[number]))
      || item.task === activeFilters.task;
    return levelOk && taskOk;
  });

  const totalDurationSec = CORPUS.reduce((sum, c) => sum + c.durationSec, 0);
  const hours = Math.floor(totalDurationSec / 3600);
  const mins = Math.floor((totalDurationSec % 3600) / 60);

  const renderManropeDigits = (value: string) => (
    <span
      style={{
        display: 'inline-block',
        fontVariantNumeric: 'lining-nums tabular-nums',
        fontFeatureSettings: '"tnum" 1, "lnum" 1, "kern" 1',
        fontKerning: 'normal',
        letterSpacing: 'inherit',
      }}
    >
      {value}
    </span>
  );

  useEffect(() => {
    const hash = decodeURIComponent(location.hash || '');
    if (hash === '#syllable-compare') {
      setActiveFilters((prev) => ({ ...prev, task: '音节对照' }));
      setExpandedIds([]);
    }
    if (hash === '#sample-browser') {
      setActiveFilters((prev) => ({ ...prev, task: '全部' }));
      setExpandedIds([]);
    }
  }, [location.hash]);

  useEffect(() => {
    const hash = decodeURIComponent(location.hash || '');
    const targetId =
      hash === '#syllable-compare'
        ? 'speech-syllable-compare'
        : hash === '#sample-browser'
          ? 'speech-sample-browser'
          : '';
    if (!targetId) return;
    window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, [location.hash, isSyllableCompareMode]);

  return (
    <div style={{ backgroundColor: 'var(--lx-bg-page)', minHeight: '100vh' }}>
      {/* ─── Page Header ─── */}
      <div
        style={{
          backgroundColor: 'var(--lx-bg-dark)',
          padding: 'clamp(48px, 8vw, 80px) 32px 56px',
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
              Speech Corpus
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
            语音数据
          </h1>

          {/* Summary stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1px',
              marginTop: '40px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              maxWidth: '680px',
            }}
          >
            {[
              { label: '展示样本', v: String(CORPUS.length), u: '条', color: '#C07830' },
              { label: '音频时长', v: `${hours}`, u: '', color: '#2C5F8A' },
              { label: '年龄分组', v: '3', u: '组', color: '#4E7D6A' },
              { label: '任务类型', v: String(taskCount), u: '类', color: '#9A7A5A' },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'var(--lx-bg-dark)',
                  padding: i === 0 ? '20px 24px 20px 0' : '20px 24px',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '32px',
                    fontWeight: 700,
                    letterSpacing: '-0.012em',
                    fontVariantNumeric: 'lining-nums tabular-nums',
                    color: s.color,
                    lineHeight: 0.95,
                    marginBottom: '8px',
                    display: 'inline-flex',
                    alignItems: 'flex-end',
                  }}
                >
                  {s.label === '音频时长' ? (
                    <>
                      {renderManropeDigits(String(hours))}
                      <span
                        style={{
                          fontFamily: "'PingFang SC', 'Noto Sans SC', sans-serif",
                          fontSize: '16px',
                          fontWeight: 600,
                          lineHeight: 1,
                          letterSpacing: '-0.01em',
                          color: '#6A6258',
                          marginLeft: '4px',
                          marginRight: '2px',
                          alignSelf: 'flex-end',
                        }}
                      >
                        时
                      </span>
                      {renderManropeDigits(String(mins))}
                      <span
                        style={{
                          fontFamily: "'PingFang SC', 'Noto Sans SC', sans-serif",
                          fontSize: '16px',
                          fontWeight: 600,
                          lineHeight: 1,
                          letterSpacing: '-0.01em',
                          color: '#6A6258',
                          marginLeft: '4px',
                          alignSelf: 'flex-end',
                        }}
                      >
                        分
                      </span>
                    </>
                  ) : (
                    <>
                      {renderManropeDigits(s.v)}
                      {s.u && (
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
                          {s.u}
                        </span>
                      )}
                    </>
                  )}
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

      {/* ─── Filters ─── */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 32px 0',
        }}
      >
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#8A8070', letterSpacing: '0.08em', marginRight: '6px' }}>
              年龄组：
            </span>
            {LEVEL_FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilters.level === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setActiveFilters((prev) => ({ ...prev, level: opt }))}
                  style={{
                    padding: '4px 12px',
                    border: `1px solid ${isActive ? '#2C5F8A' : '#DED8CC'}`,
                    borderRadius: '2px',
                    backgroundColor: isActive ? '#2C5F8A' : 'transparent',
                    color: isActive ? '#F4F0E8' : '#7A7068',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: /^\d/.test(opt) ? "'Inter', 'Noto Sans SC', sans-serif" : 'inherit',
                    fontWeight: /^\d/.test(opt) ? 800 : 400,
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gap: '8px', minWidth: '520px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#8A8070', letterSpacing: '0.08em', marginRight: '6px' }}>
                任务归类：
              </span>
              {TASK_CATEGORY_OPTIONS.map((category) => {
                const isActive = activeTaskCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveFilters((prev) => ({ ...prev, task: category }))}
                    style={{
                      padding: '4px 12px',
                      border: `1px solid ${isActive ? '#2C5F8A' : '#DED8CC'}`,
                      borderRadius: '2px',
                      backgroundColor: isActive ? '#2C5F8A' : 'transparent',
                      color: isActive ? '#F4F0E8' : '#7A7068',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {visibleTaskSubOptions.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#8A8070', letterSpacing: '0.08em', marginRight: '6px' }}>
                  具体任务：
                </span>
                {visibleTaskSubOptions.map((task) => {
                  const isAllChild = task === '全部朗读' || task === '全部自发';
                  const isActive = isAllChild ? activeFilters.task === activeTaskCategory : activeFilters.task === task;
                  return (
                    <button
                      key={task}
                      onClick={() =>
                        setActiveFilters((prev) => ({
                          ...prev,
                          task: isAllChild ? activeTaskCategory : task,
                        }))
                      }
                      style={{
                        padding: '4px 12px',
                        border: `1px solid ${isActive ? '#2C5F8A' : '#DED8CC'}`,
                        borderRadius: '2px',
                        backgroundColor: isActive ? '#2C5F8A' : 'transparent',
                        color: isActive ? '#F4F0E8' : '#7A7068',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {task}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              marginLeft: 'auto',
              fontSize: '12px',
              color: '#8A8070',
              fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.01em',
              fontFeatureSettings: '"tnum" 1, "lnum" 1',
            }}
          >
            {isSyllableCompareMode ? `${SYLLABLE_COMPARISON_ROWS.length} 组对照` : `${filtered.length} / ${CORPUS.length} 条`}
          </div>
        </div>
      </div>

      {/* ─── Corpus List ─── */}
      <div
        id="speech-sample-browser"
        style={{
          scrollMarginTop: '92px',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px 32px 80px',
        }}
      >
        {isSyllableCompareMode ? (
          <div
            id="speech-syllable-compare"
            style={{
              scrollMarginTop: '92px',
              border: '1px solid #DED8CC',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.56)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr 1fr',
                borderBottom: '1px solid #DED8CC',
                backgroundColor: 'rgba(255,255,255,0.82)',
              }}
            >
              <div
                style={{
                  minHeight: '58px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#5F574E',
                  letterSpacing: '0.06em',
                }}
              >
                音标
              </div>
              <div
                style={{
                  minHeight: '58px',
                  padding: '0 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2C5F8A',
                  letterSpacing: '0.06em',
                  borderLeft: '1px solid #E7E0D6',
                }}
              >
                青年样本
              </div>
              <div
                style={{
                  minHeight: '58px',
                  padding: '0 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#C07830',
                  letterSpacing: '0.06em',
                  borderLeft: '1px solid #E7E0D6',
                }}
              >
                老年样本
              </div>
            </div>

            {SYLLABLE_COMPARISON_ROWS.map((row, index) => (
              <div
                key={row.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr 1fr',
                  borderBottom: index === SYLLABLE_COMPARISON_ROWS.length - 1 ? 'none' : '1px solid #EDE9DF',
                  backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.36)' : 'rgba(255,255,255,0.52)',
                }}
              >
                <div
                  style={{
                    padding: '14px 8px',
                    fontFamily: "'Space Mono', monospace",
                    color: '#5F574E',
                    fontSize: '33px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {row.syllable}
                </div>
                <div style={{ padding: '12px 16px', borderLeft: '1px solid #E7E0D6' }}>
                  {row.youth.audioSrc ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {row.youth.imageSrc && (
                        <a href={row.youth.imageSrc} target="_blank" rel="noreferrer">
                          <img
                            src={row.youth.imageSrc}
                            alt={`${row.syllable} 青年人频谱图`}
                            style={{
                              width: '100%',
                              height: '380px',
                              objectFit: 'contain',
                              border: '1px solid #DED8CC',
                              borderRadius: '2px',
                              backgroundColor: '#fff',
                              transform: row.id === 'syllable-0015' ? 'scaleX(-1)' : 'none',
                            }}
                          />
                        </a>
                      )}
                      {renderAcousticMetrics(row.youth)}
                      <div
                        style={{
                          fontSize: '18px',
                          color: '#4A4440',
                          lineHeight: 1.6,
                          padding: '2px 2px 4px',
                          fontFamily: "'Noto Serif SC', serif",
                          textAlign: 'center',
                        }}
                      >
                        {renderUtteranceText(row.utteranceText, row.boldChar)}
                      </div>
                      <audio controls preload="none" src={row.youth.audioSrc} style={{ width: '100%' }} />
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#8A8070' }}>{row.youth.note || '暂无青年组音频'}</div>
                  )}
                </div>
                <div style={{ padding: '12px 16px', borderLeft: '1px solid #E7E0D6' }}>
                  {row.elderly.audioSrc ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {row.elderly.imageSrc && (
                        <a href={row.elderly.imageSrc} target="_blank" rel="noreferrer">
                          <img
                            src={row.elderly.imageSrc}
                            alt={`${row.syllable} 老年人频谱图`}
                            style={{
                              width: '100%',
                              height: '380px',
                              objectFit: 'contain',
                              border: '1px solid #DED8CC',
                              borderRadius: '2px',
                              backgroundColor: '#fff',
                            }}
                          />
                        </a>
                      )}
                      {renderAcousticMetrics(row.elderly)}
                      <div
                        style={{
                          fontSize: '18px',
                          color: '#4A4440',
                          lineHeight: 1.6,
                          padding: '2px 2px 4px',
                          fontFamily: "'Noto Serif SC', serif",
                          textAlign: 'center',
                        }}
                      >
                        {renderUtteranceText(row.utteranceText, row.boldChar)}
                      </div>
                      <audio controls preload="none" src={row.elderly.audioSrc} style={{ width: '100%' }} />
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#8A8070' }}>{row.elderly.note || '暂无老年组音频'}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: tableGridTemplate,
                gap: tableColumnGap,
                padding: '10px 16px',
                borderBottom: '1px solid #DED8CC',
                marginBottom: '4px',
              }}
            >
              {['编号', '参与者', '性别', '年龄组', '任务', '时长', '操作'].map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: '10px',
                    color: '#8A8070',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filtered.map((item) => {
                const levelColor = getLevelColor(item.level);
                const isExpanded = expandedIds.includes(item.id);

                return (
                  <div key={item.id}>
                    <div
                      onClick={() =>
                        setExpandedIds((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((id) => id !== item.id)
                            : [...prev, item.id],
                        )
                      }
                      style={{
                        display: 'grid',
                        gridTemplateColumns: tableGridTemplate,
                        gap: tableColumnGap,
                        padding: '14px 16px',
                        backgroundColor: isExpanded ? '#0E1421' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        borderBottom: '1px solid #EDE9DF',
                        transition: 'background-color 0.2s',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.8)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.5)';
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: '12px',
                          color: isExpanded ? '#C07830' : '#6A6258',
                        }}
                      >
                        {item.id}
                      </div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: isExpanded ? '#C8C2B8' : '#4A4440' }}>
                        {item.participant}
                      </div>
                      <div style={{ fontSize: '12px', color: isExpanded ? '#C8C2B8' : '#4A4440' }}>
                        {formatGender(item.gender)}
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: '11px',
                            backgroundColor: isExpanded ? 'rgba(78,125,106,0.2)' : levelColor.bg,
                            color: isExpanded ? '#4E7D6A' : levelColor.text,
                            padding: '2px 8px',
                            borderRadius: '2px',
                            fontFamily: "'Space Mono', monospace",
                          }}
                        >
                          {item.level}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: isExpanded ? '#C8C2B8' : '#0E1421' }}>
                        {item.task}
                      </div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: isExpanded ? '#7D7568' : '#8A8070' }}>
                        {formatDuration(item.durationSec)}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: isExpanded ? '#C07830' : '#2C5F8A',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isExpanded ? (
                          <span>收起 ↑</span>
                        ) : (
                          <span>展开 ↓</span>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <AudioPlayer
                        item={item}
                        onClose={() => setExpandedIds((prev) => prev.filter((id) => id !== item.id))}
                      />
                    )}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '64px',
                    color: '#8A8070',
                    fontSize: '14px',
                  }}
                >
                  无符合条件的语料记录
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
