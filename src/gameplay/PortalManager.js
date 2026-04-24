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
    this._dualLabels = null;
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

  showNameCard(title, note = '', durationMs = 2000) {
    this._card.innerHTML = `${title}<span class="small">${note}</span>`;
    this._card.classList.add('visible');
    clearTimeout(this._cardTimer);
    this._cardTimer = setTimeout(() => {
      this._card.classList.remove('visible');
    }, durationMs);
  }

  /**
   * Show the zone-clear results overlay.
   * @param {object} opts
   * @param {string}  opts.title
   * @param {number}  opts.essence
   * @param {number}  opts.xp
   * @param {number}  opts.kills
   * @param {string}  [opts.note]
   * @param {string}  [opts.bgImage]  — optional per-zone background image path
   */
  showResultsOverlay({ title = 'Zone Clear', essence = 0, xp = 0, kills = 0, note = '', bgImage = null } = {}) {
    if (bgImage) {
      this._results.style.backgroundImage = `url('${bgImage}')`;
      this._results.style.backgroundSize = 'cover';
      this._results.style.backgroundPosition = 'center';
    } else {
      this._results.style.backgroundImage = '';
    }
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

  /**
   * Show two floating labels above the exit portals after a zone is cleared.
   * hubLabel   — text for the HQ (green) portal
   * nextLabel  — text for the next-zone portal, or null if last zone
   */
  showDualPortalLabels({ hubLabel = '← Return to HQ', nextLabel = null } = {}) {
    this.hideDualPortalLabels();

    const wrap = document.createElement('div');
    wrap.id = 'dual-portal-labels';
    wrap.style.cssText = [
      'position:fixed',
      'bottom:32%',
      'left:0',
      'right:0',
      'display:flex',
      'justify-content:center',
      `gap:${nextLabel ? '160px' : '0'}`,
      'pointer-events:none',
      'z-index:50',
      'font-family:inherit',
    ].join(';');

    // HQ label (green)
    const hubTag = document.createElement('div');
    hubTag.className = 'portal-label portal-label--hq';
    hubTag.textContent = hubLabel;
    wrap.appendChild(hubTag);

    // Next zone label (zone colour via CSS var set inline)
    if (nextLabel) {
      const nextTag = document.createElement('div');
      nextTag.className = 'portal-label portal-label--next';
      nextTag.textContent = nextLabel;
      wrap.appendChild(nextTag);
    }

    document.body.appendChild(wrap);
    this._dualLabels = wrap;
  }

  hideDualPortalLabels() {
    if (this._dualLabels) {
      this._dualLabels.remove();
      this._dualLabels = null;
    }
    // Belt-and-braces: remove by id in case reference was lost
    const el = document.getElementById('dual-portal-labels');
    if (el) el.remove();
  }

  _fadeTo(opacity, durationMs) {
    return new Promise(resolve => {
      this.fadeOverlay.style.transition = `opacity ${durationMs}ms ease`;
      this.fadeOverlay.style.opacity = String(opacity);
      setTimeout(resolve, durationMs);
    });
  }
}
