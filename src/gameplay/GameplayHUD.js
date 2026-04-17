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
    this._zoneTicks = 0;
    this._bossVisible = false;
    this._bossPhaseFlash = 0;
    this._bossName = '';
    this._bossHp = 0;
    this._bossHpMax = 0;
    this._damageNumbers = [];

    this._comboEl = document.createElement('div');
    this._comboEl.className = 'combo-counter';
    this._comboEl.textContent = 'x0';
    overlay.appendChild(this._comboEl);

    this._waveEl = document.createElement('div');
    this._waveEl.className = 'wave-flash';
    this._waveEl.textContent = 'WAVE CLEAR';
    overlay.appendChild(this._waveEl);

    this._zoneEl = document.createElement('div');
    this._zoneEl.className = 'zone-title';
    this._zoneEl.textContent = 'CITY BREACH';
    this._zoneEl.style.opacity = '0';
    overlay.appendChild(this._zoneEl);

    this._bossWrapEl = document.createElement('div');
    this._bossWrapEl.className = 'boss-hud';
    this._bossWrapEl.style.opacity = '0';
    overlay.appendChild(this._bossWrapEl);

    this._bossNameEl = document.createElement('div');
    this._bossNameEl.className = 'boss-name';
    this._bossNameEl.textContent = 'BOSS';
    this._bossWrapEl.appendChild(this._bossNameEl);

    this._bossBarEl = document.createElement('div');
    this._bossBarEl.className = 'boss-bar';
    this._bossWrapEl.appendChild(this._bossBarEl);

    this._bossFillEl = document.createElement('div');
    this._bossFillEl.className = 'boss-fill';
    this._bossBarEl.appendChild(this._bossFillEl);

    this._bossMarksEl = document.createElement('div');
    this._bossMarksEl.className = 'boss-marks';
    this._bossBarEl.appendChild(this._bossMarksEl);

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
    this._updateZoneTitle();
    this._updateBossBar();
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

  /** Shows the zone title flash for the current zone entry. */
  showZoneTitle(zoneLabel, zoneNumber = 0) {
    const prefix = zoneNumber > 0 ? `ZONE ${zoneNumber} - ` : '';
    this._zoneEl.textContent = `${prefix}${zoneLabel}`.toUpperCase();
    this._zoneEl.style.opacity = '1';
    this._zoneTicks = 120;
  }

  /** Shows the boss bar for the active encounter. */
  setBossBar({ name, hp, hpMax, phaseThresholds = [] } = {}) {
    this._bossVisible = true;
    this._bossName = name || 'BOSS';
    this._bossHp = Math.max(0, hp || 0);
    this._bossHpMax = Math.max(1, hpMax || 1);
    this._bossNameEl.textContent = this._bossName.toUpperCase();
    this._bossMarksEl.innerHTML = '';

    const widths = phaseThresholds
      .filter(value => value > 0 && value < 1)
      .map(value => `${(value * 100).toFixed(1)}%`);
    for (const width of widths) {
      const mark = document.createElement('span');
      mark.style.left = width;
      this._bossMarksEl.appendChild(mark);
    }

    this._bossWrapEl.style.opacity = '1';
  }

  /** Updates the boss bar from live boss state. */
  updateBossBar(hp, hpMax, phase = 0) {
    if (!this._bossVisible) return;
    this._bossHp = Math.max(0, hp || 0);
    this._bossHpMax = Math.max(1, hpMax || 1);
    if (phase > 0) this._bossPhaseFlash = 14;
  }

  /** Hides the boss bar. */
  clearBossBar() {
    this._bossVisible = false;
    this._bossHp = 0;
    this._bossHpMax = 0;
    this._bossName = '';
    this._bossWrapEl.style.opacity = '0';
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

  _updateZoneTitle() {
    if (this._zoneTicks <= 0) {
      this._zoneEl.style.opacity = '0';
      return;
    }

    this._zoneTicks -= 1;
    const t = this._zoneTicks / 120;
    this._zoneEl.style.opacity = String(Math.min(1, t * 2));
    this._zoneEl.style.transform = `translate(-50%, -50%) scale(${(1 + (1 - t) * 0.08).toFixed(2)})`;
  }

  _updateBossBar() {
    if (!this._bossVisible) {
      this._bossWrapEl.style.opacity = '0';
      return;
    }

    const pct = this._bossHpMax > 0 ? this._bossHp / this._bossHpMax : 0;
    this._bossFillEl.style.width = `${Math.max(0, Math.min(1, pct)) * 100}%`;
    this._bossWrapEl.style.opacity = '1';

    if (this._bossPhaseFlash > 0) {
      this._bossPhaseFlash -= 1;
      this._bossBarEl.style.filter = 'brightness(1.45)';
    } else {
      this._bossBarEl.style.filter = '';
    }
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
