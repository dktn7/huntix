import * as THREE from 'three';

const DAMAGE_POOL_SIZE = 8;
const DAMAGE_LIFE_TICKS = 40;
const WAVE_FLASH_TICKS = 90;

export class GameplayHUD {
  /** Creates Phase 2 DOM combat UI inside the existing overlay. */
  constructor(overlay) {
    this.overlay = overlay;
    this._combo = 0;
    this._waveTicks = 0;
    this._damageNumbers = [];

    this._comboEl = document.createElement('div');
    this._comboEl.className = 'combo-counter';
    this._comboEl.textContent = 'x0';
    overlay.appendChild(this._comboEl);

    this._waveEl = document.createElement('div');
    this._waveEl.className = 'wave-flash';
    this._waveEl.textContent = 'WAVE CLEAR';
    overlay.appendChild(this._waveEl);

    for (let i = 0; i < DAMAGE_POOL_SIZE; i += 1) {
      const el = document.createElement('div');
      el.className = 'damage-number';
      overlay.appendChild(el);
      this._damageNumbers.push({
        el,
        ticks: 0,
        world: new THREE.Vector3(),
        text: '',
      });
    }
  }

  /** Advances transient HUD animations for one fixed tick. */
  update(camera) {
    this._updateCombo();
    this._updateWaveFlash();
    this._updateDamageNumbers(camera);
  }

  /** Sets the currently visible combo count. */
  setCombo(count) {
    this._combo = count;
  }

  /** Shows a pooled floating damage number at a world position. */
  showDamageNumber(x, y, amount, kind = 'light') {
    const item = this._damageNumbers.find(entry => entry.ticks <= 0) || this._damageNumbers[0];
    item.ticks = DAMAGE_LIFE_TICKS;
    item.world.set(x, y + 0.6, 0);
    item.text = String(Math.round(amount));
    item.el.textContent = item.text;
    item.el.className = `damage-number ${kind}`;
    item.el.style.opacity = '1';
  }

  /** Flashes the wave-clear text. */
  showWaveClear() {
    this._waveTicks = WAVE_FLASH_TICKS;
  }

  _updateCombo() {
    if (this._combo <= 0) {
      this._comboEl.style.opacity = '0';
      return;
    }

    const t = Math.min(1, this._combo / 20);
    const scale = 1 + t * 2;
    const color = this._comboColor(t);
    this._comboEl.textContent = `x${this._combo}`;
    this._comboEl.style.opacity = '1';
    this._comboEl.style.transform = `translateX(-50%) scale(${scale.toFixed(2)})`;
    this._comboEl.style.color = color;
  }

  _updateWaveFlash() {
    if (this._waveTicks <= 0) {
      this._waveEl.style.opacity = '0';
      return;
    }

    this._waveTicks -= 1;
    const t = this._waveTicks / WAVE_FLASH_TICKS;
    this._waveEl.style.opacity = String(Math.min(1, t * 2));
    this._waveEl.style.transform = `translate(-50%, -50%) scale(${(1 + (1 - t) * 0.15).toFixed(2)})`;
  }

  _updateDamageNumbers(camera) {
    for (const item of this._damageNumbers) {
      if (item.ticks <= 0) {
        item.el.style.opacity = '0';
        continue;
      }

      item.ticks -= 1;
      item.world.y += 0.015;
      const projected = item.world.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
      const opacity = item.ticks / DAMAGE_LIFE_TICKS;

      item.el.style.left = `${x.toFixed(1)}px`;
      item.el.style.top = `${y.toFixed(1)}px`;
      item.el.style.opacity = String(opacity);
    }
  }

  _comboColor(t) {
    if (t < 0.5) {
      const k = t / 0.5;
      return this._mixColor([46, 204, 113], [243, 156, 18], k);
    }
    return this._mixColor([243, 156, 18], [231, 76, 60], (t - 0.5) / 0.5);
  }

  _mixColor(a, b, t) {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r}, ${g}, ${bl})`;
  }
}
