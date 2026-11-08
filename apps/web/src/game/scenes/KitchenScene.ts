import Phaser from 'phaser';
import type { GameSession } from '@frontier/game-core';
import { kitchen } from '@frontier/game-data';

export class KitchenScene extends Phaser.Scene {
  constructor(private readonly session: GameSession) { super('KitchenScene'); }

  create(): void {
    const g = this.add.graphics();
    g.fillStyle(0xc2dfdf).fillRect(0, 0, kitchen.width, kitchen.height);
    g.fillStyle(0xf2dfbc).fillRoundedRect(100, 95, 800, 550, 12);
    for (let y = 110; y < 645; y += 42) {
      g.lineStyle(2, 0xdfcba9).lineBetween(100, y, 900, y);
      for (let x = 100 + (y % 84 ? 80 : 180); x < 900; x += 200) {
        g.lineBetween(x, y, x, Math.min(y + 42, 645));
      }
    }
    // Back wall, timber beams, and a window overlooking the garden.
    g.fillStyle(0xfff7e6).fillRect(100, 85, 800, 115);
    g.fillStyle(0x9bd1ba).fillRect(100, 85, 800, 15).fillRect(100, 185, 800, 15);
    g.fillStyle(0xc5edf6).fillRect(435, 110, 130, 67);
    g.lineStyle(7, 0x75b6aa).strokeRect(435, 110, 130, 67).lineBetween(500, 110, 500, 177);
    // Worktop and stove.
    g.fillStyle(0xa5d9bf).fillRoundedRect(160, 215, 270, 110, 7);
    g.fillStyle(0xd8e8eb).fillRoundedRect(160, 205, 270, 86, 7);
    for (const x of [225, 350]) {
      g.fillStyle(0x496c7c).fillCircle(x, 247, 27);
      g.lineStyle(3, 0x8ebaca).strokeCircle(x, 247, 19);
    }
    g.fillStyle(0x9ec9d6).fillCircle(225, 244, 20);
    g.fillStyle(0xeef8f5).fillEllipse(225, 237, 35, 14);
    // Preparation counter with board, vegetables and a sink.
    g.fillStyle(0xa5d9bf).fillRoundedRect(590, 215, 250, 110, 7);
    g.fillStyle(0xf7e5c7).fillRoundedRect(590, 205, 250, 86, 7);
    g.fillStyle(0xceeaf1).fillRoundedRect(745, 219, 76, 54, 8);
    g.lineStyle(5, 0x7db4c5).beginPath().moveTo(781, 224).lineTo(781, 208).lineTo(797, 208).strokePath();
    g.fillStyle(0xe2bb89).fillRoundedRect(608, 221, 105, 54, 5);
    g.fillStyle(0xf2b66d).fillEllipse(637, 245, 35, 14);
    g.fillStyle(0x9cca7c).fillEllipse(664, 241, 16, 26);
    // Storage shelves and a small table.
    g.fillStyle(0x85bba5).fillRoundedRect(160, 405, 150, 160, 6);
    for (const y of [435, 490, 545]) {
      g.fillStyle(0xebcfa3).fillRect(170, y, 130, 9);
      for (const x of [195, 240, 280]) g.fillStyle(0xf6edcf).fillRoundedRect(x - 11, y - 28, 23, 28, 5);
    }
    g.fillStyle(0x97c6ac).fillRoundedRect(670, 435, 150, 110, 12);
    g.fillStyle(0xefd1a2).fillRoundedRect(660, 420, 170, 100, 12);
    g.fillStyle(0xfff8e6).fillEllipse(745, 465, 46, 29);
    // Player stands between the cooking stations and the door.
    const player = this.add.graphics();
    player.fillStyle(0x493f31, 0.22).fillEllipse(2, 16, 38, 15);
    player.fillStyle(0x4f6053).fillRoundedRect(-12, 5, 10, 17, 3).fillRoundedRect(3, 5, 10, 17, 3);
    player.fillStyle(0x87ceeb).fillRoundedRect(-16, -16, 32, 28, 8);
    player.fillStyle(0x997653).fillRect(-11, 1, 22, 5);
    player.fillStyle(0xe6ba8a).fillCircle(0, -25, 13);
    player.fillStyle(0xe8bd53).fillEllipse(0, -34, 28, 14);
    player.fillStyle(0xffdf7a).fillEllipse(-4, -36, 20, 9);
    g.fillStyle(0x83b3a2).fillRect(443, 602, 114, 43);
    g.fillStyle(0xf5e4bf).fillRect(452, 610, 96, 35);
    const sync = () => {
      const { player: state } = this.session.getSnapshot();
      if (state.sceneId === 'village') { this.scene.start('VillageScene'); return; }
      player.setPosition(state.x, state.y);
    };
    sync();
    const unsubscribe = this.session.subscribe(sync);
    const resize = () => {
      this.cameras.main.setZoom(Math.min(this.scale.width / kitchen.width, this.scale.height / kitchen.height));
      this.cameras.main.centerOn(kitchen.width / 2, kitchen.height / 2);
    };
    resize();
    this.scale.on('resize', resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribe();
      this.scale.off('resize', resize);
    });
  }
}
