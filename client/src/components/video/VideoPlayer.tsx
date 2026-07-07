import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize,
  FiChevronLeft, FiChevronRight, FiSettings,
} from 'react-icons/fi';

interface VideoPlayerProps {
  src: string;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  theatreMode?: boolean;
  autoplay?: boolean;
}

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
const qualities = ['Auto', '1080p', '720p', '480p', '360p'];

export default function VideoPlayer({ src, onNext, onPrev, hasNext, hasPrev, theatreMode, autoplay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const seekingRef = useRef(false);
  const draggingRef = useRef(false);
  const centerBtnTimer = useRef<ReturnType<typeof setTimeout>>();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSpeed, setShowSpeed] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCenterBtn, setShowCenterBtn] = useState(false);
  const [key, setKey] = useState(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState(0);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const [shortcutHint, setShortcutHint] = useState<string | null>(null);
  const [volChanging, setVolChanging] = useState(false);

  const showHint = (text: string) => {
    setShortcutHint(text);
    clearTimeout((window as any).__hintTimer);
    (window as any).__hintTimer = setTimeout(() => setShortcutHint(null), 1200);
  };

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const showCenterTemporarily = () => {
    setShowCenterBtn(true);
    clearTimeout(centerBtnTimer.current);
    centerBtnTimer.current = setTimeout(() => setShowCenterBtn(false), 1500);
  };

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    setShowSpeed(false);
    setShowQuality(false);
    clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, [playing]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => { if (!seekingRef.current && !draggingRef.current) setCurrentTime(v.currentTime); };
    const onMeta = () => setDuration(v.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onProgress = () => {
      if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onEnded = () => { setPlaying(false); if (hasNext && onNext) onNext(); };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('progress', onProgress);
    v.addEventListener('ended', onEnded);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('progress', onProgress);
      v.removeEventListener('ended', onEnded);
    };
  }, [hasNext, onNext]);

  useEffect(() => { setKey((k) => k + 1); }, [src]);

  useEffect(() => {
    if (autoplay && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [autoplay, key]);

  const togglePlay = (e?: React.MouseEvent) => {
    const v = videoRef.current;
    if (!v) return;
    if (e) {
      showCenterTemporarily();
      const rect = e.currentTarget.getBoundingClientRect();
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTimeout(() => setRipple(null), 600);
    }
    if (v.paused) { v.play(); showHint('▶ Play'); }
    else { v.pause(); showHint('⏸ Pause'); }
  };

  const seekTo = (clientX: number) => {
    const v = videoRef.current;
    const p = progressRef.current;
    if (!v || !p || !duration) return;
    const rect = p.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    v.currentTime = pos * duration;
    setCurrentTime(v.currentTime);
  };

  const handleSeekStart = (e: React.MouseEvent) => {
    e.preventDefault();
    seekingRef.current = true;
    draggingRef.current = true;
    seekTo(e.clientX);

    const onMove = (ev: MouseEvent) => seekTo(ev.clientX);
    const onUp = () => {
      seekingRef.current = false;
      draggingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleProgressHover = (e: React.MouseEvent) => {
    const p = progressRef.current;
    if (!p || !duration || draggingRef.current) return;
    const rect = p.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPos(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    setVolume(val);
    setMuted(val === 0);
    setVolChanging(true);
    clearTimeout((window as any).__volTimer);
    (window as any).__volTimer = setTimeout(() => setVolChanging(false), 1000);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted) {
      v.muted = false;
      setMuted(false);
      v.volume = prevVolume;
      setVolume(prevVolume);
      showHint(`🔊 ${Math.round(prevVolume * 100)}%`);
    } else {
      setPrevVolume(v.volume);
      v.muted = true;
      setMuted(true);
      showHint('🔇 Muted');
    }
  };

  const changeSpeed = (s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSpeed(false);
    showHint(`⏱ ${s}x`);
  };

  const changeQuality = (q: string) => {
    setQuality(q);
    setShowQuality(false);
    showHint(`📺 ${q}`);
  };

  const toggleFullscreen = async () => {
    const c = containerRef.current;
    if (!c) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
      showHint('⛶ Exit fullscreen');
    } else {
      await c.requestFullscreen();
      setIsFullscreen(true);
      showHint('⛶ Fullscreen');
    }
  };

  const skip = (sec: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.currentTime + sec, duration));
    setCurrentTime(v.currentTime);
    showHint(`${sec > 0 ? '⏩' : '⏪'} ${Math.abs(sec)}s`);
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': skip(5); break;
        case 'ArrowLeft': skip(-5); break;
        case 'ArrowUp': e.preventDefault(); {
          const v = videoRef.current; if (v) {
            const vol = Math.min(v.volume + 0.1, 1); v.volume = vol; setVolume(vol); setMuted(false); showHint(`🔊 ${Math.round(vol * 100)}%`);
          } break;
        }
        case 'ArrowDown': e.preventDefault(); {
          const v = videoRef.current; if (v) {
            const vol = Math.max(v.volume - 0.1, 0); v.volume = vol; setVolume(vol); if (vol === 0) setMuted(true); showHint(`🔉 ${Math.round(vol * 100)}%`);
          } break;
        }
        case 'f': toggleFullscreen(); break;
        case 'm': toggleMute(); break;
        case '0': changeSpeed(1); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      className={`video-player-wrapper ${showControls ? 'show-controls' : ''} ${theatreMode ? 'theatre-mode' : ''} ${draggingRef.current ? 'dragging' : ''}`}
      ref={containerRef}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => { if (!draggingRef.current) { playing && setShowControls(false); setHoverTime(null); } }}
      onClick={(e) => togglePlay(e)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        src={src}
        className="video-player-element"
        key={key}
        playsInline
        preload="metadata"
      />

      {ripple && <div className="player-ripple" style={{ left: ripple.x, top: ripple.y }} />}

      <div className={`player-center-btn ${showCenterBtn ? 'visible' : ''}`} onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
        {!playing ? (
          <div className="play-button-glow">
            <FiPlay size={48} />
          </div>
        ) : (
          <FiPause size={48} />
        )}
      </div>

      <div className="player-mini-progress" style={{ width: `${progress}%` }} />

      {shortcutHint && (
        <div className="shortcut-hint" key={shortcutHint}>
          {shortcutHint}
        </div>
      )}

      <div className="player-controls" onClick={(e) => e.stopPropagation()}>
        <div
          className={`player-progress ${draggingRef.current ? 'dragging' : ''}`}
          ref={progressRef}
          onMouseDown={handleSeekStart}
          onMouseMove={handleProgressHover}
          onMouseEnter={() => setHoverTime(0)}
          onMouseLeave={() => { if (!draggingRef.current) setHoverTime(null); }}
        >
          <div className="progress-buffered" style={{ width: `${bufferedPct}%` }} />
          <div className="progress-played" style={{ width: `${progress}%` }} />
          <div className={`progress-thumb ${draggingRef.current ? 'dragging' : ''}`} style={{ left: `${progress}%` }} />
          {hoverTime !== null && !draggingRef.current && (
            <div className="seek-preview" style={{ left: `${hoverPos}%` }}>
              <span>{formatTime(hoverTime)}</span>
            </div>
          )}
        </div>

        <div className="player-controls-bottom">
          <div className="controls-left">
            <button className="player-btn" onClick={(e) => { e.stopPropagation(); showCenterTemporarily(); togglePlay(); }} title={playing ? 'Pause (space)' : 'Play (space)'}>
              <div className="btn-icon-wrap">
                {playing ? <FiPause size={18} /> : <FiPlay size={18} />}
              </div>
            </button>
            {hasPrev && (
              <button className="player-btn" onClick={(e) => { e.stopPropagation(); onPrev?.(); }} title="Previous">
                <FiChevronLeft size={20} />
              </button>
            )}
            {hasNext && (
              <button className="player-btn" onClick={(e) => { e.stopPropagation(); onNext?.(); }} title="Next">
                <FiChevronRight size={20} />
              </button>
            )}
            <span className="player-time">{formatTime(currentTime)}</span>
            <span className="player-time-sep">/</span>
            <span className="player-time player-time-total">{formatTime(duration)}</span>
          </div>

          <div className="controls-right">
            <div className="player-volume">
              <button className="player-btn" onClick={toggleMute} title={muted ? 'Unmute (m)' : 'Mute (m)'}>
                {muted || volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
              </button>
              <div className={`volume-slider-wrap ${volChanging ? 'active' : ''}`}>
                <div className="volume-fill" style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>
              <span className="volume-pct">{Math.round((muted ? 0 : volume) * 100)}%</span>
            </div>

            <div className="player-speed">
              <button className="player-btn btn-speed" onClick={() => { setShowSpeed(!showSpeed); setShowQuality(false); }} title="Speed">
                {speed}x
              </button>
              {showSpeed && (
                <div className="player-menu">
                  {speeds.map((s) => (
                    <button key={s} className={`menu-option ${s === speed ? 'active' : ''}`} onClick={() => changeSpeed(s)}>
                      <span className="speed-val">{s}x</span>
                      {s === 1 && <span className="speed-label">Normal</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="player-quality">
              <button className="player-btn" onClick={() => { setShowQuality(!showQuality); setShowSpeed(false); }} title="Quality">
                <FiSettings size={16} />
              </button>
              {showQuality && (
                <div className="player-menu quality-menu">
                  {qualities.map((q) => (
                    <button key={q} className={`menu-option ${q === quality ? 'active' : ''}`} onClick={() => changeQuality(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="player-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen (f)' : 'Fullscreen (f)'}>
              {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
