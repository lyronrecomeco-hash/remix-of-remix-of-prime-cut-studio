import { useCallback, useRef, useEffect } from 'react';

// Sound URLs - usando sons gratuitos e leves
const SOUNDS = {
  // Som suave de entrada/transição
  transition: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  // Som sutil de revelação/impacto
  reveal: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  // Som de alerta/problema (suave)
  alert: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  // Som de sucesso/solução
  success: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
  // Som de notificação WhatsApp-like
  notification: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
  // Som de typing suave
  typing: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  // Som ambiente sutil
  ambient: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3'
};

type SoundType = keyof typeof SOUNDS;

interface SoundOptions {
  volume?: number;
  loop?: boolean;
}

export const useSoundEffects = () => {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isEnabled = useRef(true);

  // Preload sounds
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      audio.volume = 0.3;
      audioCache.current.set(key, audio);
    });

    return () => {
      audioCache.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioCache.current.clear();
    };
  }, []);

  const play = useCallback((sound: SoundType, options: SoundOptions = {}) => {
    if (!isEnabled.current) return;

    const { volume = 0.3, loop = false } = options;
    
    try {
      const cachedAudio = audioCache.current.get(sound);
      if (cachedAudio) {
        const audio = cachedAudio.cloneNode() as HTMLAudioElement;
        audio.volume = volume;
        audio.loop = loop;
        audio.play().catch(() => {
          // Silently fail if autoplay is blocked
        });
        return audio;
      }
    } catch {
      // Silently fail
    }
    return null;
  }, []);

  const stop = useCallback((audio: HTMLAudioElement | null) => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    isEnabled.current = enabled;
  }, []);

  // Métodos de conveniência para momentos específicos
  const playPhaseTransition = useCallback(() => {
    play('transition', { volume: 0.2 });
  }, [play]);

  const playReveal = useCallback(() => {
    play('reveal', { volume: 0.25 });
  }, [play]);

  const playAlert = useCallback(() => {
    play('alert', { volume: 0.15 });
  }, [play]);

  const playSuccess = useCallback(() => {
    play('success', { volume: 0.25 });
  }, [play]);

  const playNotification = useCallback(() => {
    play('notification', { volume: 0.2 });
  }, [play]);

  const playTyping = useCallback(() => {
    return play('typing', { volume: 0.1, loop: true });
  }, [play]);

  return {
    play,
    stop,
    setEnabled,
    playPhaseTransition,
    playReveal,
    playAlert,
    playSuccess,
    playNotification,
    playTyping
  };
};

export default useSoundEffects;
