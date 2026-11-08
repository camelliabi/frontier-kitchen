import Phaser from 'phaser';
import type { GameSession } from '@frontier/game-core';
import { village } from '@frontier/game-data';

export class VillageScene extends Phaser.Scene {
  constructor(private readonly session: GameSession) { super('VillageScene'); }
  create(): void {
    const g = this.add.graphics();
    g.fillStyle(0xbce2a6).fillRect(0, 0, village.width, village.height);
    // Deterministic grass and flowers, entirely drawn from original geometry.
    for (let i = 0; i < 650; i++) {
      const x = (i * 137 + 43) % village.width, y = (i * 223 + 71) % village.height;
      g.lineStyle(1, 0x8dbd8a, 0.4).lineBetween(x, y, x + 3, y - 5);
      if (i % 9 === 0) g.fillStyle(i % 2 ? 0xffe6a3 : 0xfff9e9).fillCircle(x, y, 2);
    }
    g.lineStyle(90, 0xa6ce99).beginPath().moveTo(0, 725).lineTo(580, 725).lineTo(790, 635).lineTo(1240, 680).lineTo(1600, 590).strokePath();
    g.lineStyle(72, 0xf6e8c7).beginPath().moveTo(0, 725).lineTo(580, 725).lineTo(790, 635).lineTo(1240, 680).lineTo(1600, 590).strokePath();
    g.fillStyle(0xf6e8c7).fillRoundedRect(718, 480, 110, 165, 25);
    // A small stream to the east, with a wooden crossing.
    g.lineStyle(96, 0x80c5db).lineBetween(1280, 0, 1400, 1100);
    g.lineStyle(68, 0xb7eafa).lineBetween(1280, 0, 1400, 1100);
    g.fillStyle(0xe0bc8b).fillRect(1290, 602, 126, 85);
    for (let x = 1294; x < 1414; x += 14) g.lineStyle(2, 0xb79671).lineBetween(x, 602, x, 687);
    // Vegetable garden.
    g.fillStyle(0xc4a17a).fillRoundedRect(940, 405, 180, 145, 8);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
      const x = 956 + col * 28, y = 425 + row * 33;
      g.fillStyle(0x88bc78).fillEllipse(x, y, 18, 9).fillEllipse(x, y - 3, 8, 18);
    }
    // Restaurant: timber walls, clay roof and warm windows.
    g.fillStyle(0x70a68a, 0.2).fillRoundedRect(568, 348, 330, 220, 18);
    g.fillStyle(0xfff0ce).fillRect(575, 340, 300, 190);
    g.lineStyle(7, 0xa4cbb5).strokeRect(575, 340, 300, 190);
    g.fillStyle(0x96cee6).fillTriangle(545, 350, 725, 225, 905, 350);
    g.lineStyle(9, 0x6ca8c4).lineBetween(545, 350, 725, 225).lineBetween(725, 225, 905, 350);
    for (let y = 280; y <= 330; y += 20) g.lineStyle(2, 0xc3e6f3).lineBetween(725 - (y - 225) * 1.35, y, 725 + (y - 225) * 1.35, y);
    g.fillStyle(0x90c8ae).fillRect(734, 435, 60, 95);
    g.fillStyle(0xfff1ba).fillRect(605, 399, 61, 53).fillRect(806, 399, 43, 53);
    g.lineStyle(5, 0x91bca8).strokeRect(605, 399, 61, 53).strokeRect(806, 399, 43, 53).lineBetween(635, 399, 635, 452);
    g.fillStyle(0xfff5d9).fillRoundedRect(666, 365, 125, 39, 4);
    g.fillStyle(0xe2ddc5).fillRoundedRect(720, 530, 90, 19, 4);
    const tree = (x: number, y: number, size = 1) => {
      g.fillStyle(0x6ba185, 0.18).fillEllipse(x + 12, y + 20, 95 * size, 31 * size);
      g.fillStyle(0xbf9d78).fillRect(x - 7, y - 25, 14, 51);
      g.fillStyle(0x7fbc88).fillCircle(x, y - 52 * size, 43 * size);
      g.fillStyle(0x9bd395).fillCircle(x - 23 * size, y - 43 * size, 32 * size);
      g.fillStyle(0xbee4a6).fillCircle(x + 12 * size, y - 67 * size, 29 * size);
    };
    [[300,350],[415,275],[995,260],[1160,350],[380,570],[480,910],[960,880],[1140,840],[230,830],[1500,430],[560,170],[850,150]].forEach(([x,y]) => tree(x,y));
    const player = this.add.container();
    const p = this.add.graphics();
    p.fillStyle(0x43543c, 0.24).fillEllipse(2, 16, 34, 14);
    p.fillStyle(0x4f6053).fillRoundedRect(-12, 5, 10, 17, 3).fillRoundedRect(3, 5, 10, 17, 3);
    p.fillStyle(0x87ceeb).fillRoundedRect(-16, -16, 32, 28, 8);
    p.fillStyle(0x997653).fillRect(-11, 1, 22, 5);
    p.fillStyle(0xe6ba8a).fillCircle(0, -25, 13);
    p.fillStyle(0xe8bd53).fillEllipse(0, -34, 28, 14);
    p.fillStyle(0xffdf7a).fillEllipse(-4, -36, 20, 9);
    player.add(p);
    const syncPlayer = () => {
      const state = this.session.getSnapshot();
      if (state.player.sceneId === 'kitchen') { this.scene.start('KitchenScene'); return; }
      player.setPosition(state.player.x, state.player.y);
    };
    syncPlayer();
    const unsubscribe = this.session.subscribe(syncPlayer);
    const resize = () => {
      const camera = this.cameras.main;
      camera.setBounds(0, 0, village.width, village.height);
      camera.setZoom(Math.min(this.scale.width / 1050, this.scale.height / 720));
      camera.centerOn(800, 540);
    };
    resize();
    this.scale.on('resize', resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { unsubscribe(); this.scale.off('resize', resize); });
  }
}
