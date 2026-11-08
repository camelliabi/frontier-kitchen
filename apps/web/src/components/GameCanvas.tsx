import { useEffect, useRef, useSyncExternalStore } from 'react';
import { LanguageStore } from '../i18n';
import type { GameSession } from '@frontier/game-core';
import { VillageScene } from '../game/scenes/VillageScene';
import { KitchenScene } from '../game/scenes/KitchenScene';
import Phaser from 'phaser';

export function GameCanvas({ session, language }: { session: GameSession; language: LanguageStore }) {
  useSyncExternalStore(language.subscribe, language.getSnapshot);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const parent = container.current!;
    // Defer creation so StrictMode's first setup/cleanup never leaves a booting game.
    let game: Phaser.Game | undefined;
    const timer = window.setTimeout(() => {
      const scenes = [new KitchenScene(session), new VillageScene(session)];
      if (session.getSnapshot().player.sceneId === 'village') scenes.reverse();
      // The current geometry-only scenes use Canvas to avoid GPU framebuffer failures on resize.
      game = new Phaser.Game({ type: Phaser.CANVAS, parent, backgroundColor: '#413c32', scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight }, scene: scenes, audio: { noAudio: true } });
    }, 0);
    const observer = new ResizeObserver(() => game?.scale.resize(parent.clientWidth, parent.clientHeight));
    observer.observe(parent);
    return () => { window.clearTimeout(timer); observer.disconnect(); game?.destroy(true); };
  }, [session, language]);
  return <div ref={container} className="game-canvas" role="img" aria-label={language.t('canvas')}/>;
}

