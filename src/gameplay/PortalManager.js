const DEFAULT_FADE_IN_MS = 120;
const DEFAULT_FADE_OUT_MS = 240;

function ensureOverlayElement(id, className, parent) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    parent.appendChild(el);
  }
  if (className) el.className = className;
  return el;
}

export class PortalManager {
  constructor(overlay) {
    this.overlay = overlay;
    this.fadeOverlay = ensureOverlayElement('fade-overlay', '', document.body);
    this.fadeOverlay.style.position = 'fixed';
    this.fadeOverlay.style.inset = '0';
    this.fadeOverlay.style.background = '#000';
    this.fadeOverlay.style.opacity = '0';
    this.fadeOverlay.style.pointerEvents = 'none';
    this.fadeOverlay.style.zIndex = '100';

    this._card = ensureOverlayElement('portal-card', 'portal-card', overlay);
    this._results = ensureOverlayElement('results-card', 'results-card', overlay);
    this._portalHoldTimer = 0;
  }

  async playTransition(type = 'enter', durationMs = DEFAULT_FADE_IN_MS) {
    const target = type === 'wipe' ? '#600' : '#000';
    this.fadeOverlay.style.background = target;
    await this._fadeTo(1, durationMs);
    await this._fadeTo(0, durationMs);
  }

  async playEnterTransition(zoneLabel, zoneNumber) {
    this.showZoneTitleCard(zoneLabel, zoneNumber);
    await this.playTransition('enter', DEFAULT_FADE_IN_MS);
  }

  async playExitTransition(summary = null) {
    if (summary) this.showResultsOverlay(summary);
    await this.playTransition('exit', DEFAULT_FADE_OUT_MS);
  }

  async playWipeTransition(summary = null) {
    if (summary) this.showResultsOverlay(summary);
    await this.playTransition('wipe', DEFAULT_FADE_OUT_MS);
  }

  showZoneTitleCard(zoneLabel, zoneNumber = 0) {
    const prefix = zoneNumber > 0 ? `Zone ${zoneNumber} - ` : '';
    this._card.innerHTML = `${prefix}${zoneLabel}<span class="small">Portal engaged</span>`;
    this._card.classList.add('visible');
    clearTimeout(this._cardTimer);
    this._cardTimer = setTimeout(() => {
      this._card.classList.remove('visible');
    }, 1100);
  }

  showResultsOverlay({ title = 'Zone Clear', essence = 0, xp = 0, kills = 0, note = '' } = {}) {
    this._results.innerHTML = `${title}<span class="small">Essence +${essence} | XP +${xp} | Kills ${kills}${note ? ` | ${note}` : ''}</span>`;
    this._results.classList.add('visible');
    clearTimeout(this._resultsTimer);
    this._resultsTimer = setTimeout(() => {
      this._results.classList.remove('visible');
    }, 1800);
  }

  hideResultsOverlay() {
    this._results.classList.remove('visible');
  }

  clearZoneCard() {
    this._card.classList.remove('visible');
  }

  _fadeTo(opacity, durationMs) {
    return new Promise(resolve => {
      this.fadeOverlay.style.transition = `opacity ${durationMs}ms ease`;
      this.fadeOverlay.style.opacity = String(opacity);
      setTimeout(resolve, durationMs);
    });
  }
}
