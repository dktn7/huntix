import { Actions } from '../engine/InputManager.js';
import { HUNTER_CONFIGS } from '../gameplay/HunterController.js';

const HUNTER_ORDER = ['dabik', 'benzu', 'sereisa', 'vesol'];

const HUNTER_META = {
  dabik: {
    title: 'Shadow Striker',
    origin: 'Caribbean-African',
    element: 'Shadow',
    status: 'Bleed',
    aura: '#7f56d9',
    story: 'Born to a family of trackers, Dabik inherited an instinct for silence. He reached S-Rank through the principle that the most dangerous thing is what you never see coming.',
    stats: { hp: 80, mana: 120, speed: 9, damage: 6, defense: 3 },
    spells: [
      { name: 'Shadow Step', desc: 'Blinks behind target, applies bleed.' },
      { name: 'Shadow Clone', desc: 'Decoy taunts enemies for 3 seconds.' },
      { name: 'Monarch\'s Domain', desc: 'Freezes time; invisible rapid-strikes.' }
    ],
    posX: '18%'
  },
  benzu: {
    title: 'Iron Breaker',
    origin: 'South American / Brazilian',
    element: 'Thunder/Earth',
    status: 'Stun',
    aura: '#d94841',
    story: 'A construction worker who rose through the ranks because he was impossible to stop. Evaluation boards simply stated: "We have no protocol for this."',
    stats: { hp: 160, mana: 70, speed: 4, damage: 10, defense: 9 },
    spells: [
      { name: 'Shield Bash', desc: 'Short range stun, interrupts attacks.' },
      { name: 'Seismic Slam', desc: 'Leaps and slams, stunning all nearby.' },
      { name: 'Titan\'s Wrath', desc: 'Ground shatter; Benzu takes zero damage.' }
    ],
    posX: '38.5%'
  },
  sereisa: {
    title: 'Storm Chaser',
    origin: 'European / British-Nordic',
    element: 'Lightning',
    status: 'Slow',
    aura: '#f1c40f',
    story: 'A national-level fencer and the fastest S-Rank in history. She treats every battle like a fencing bout: control the distance, control the fight.',
    stats: { hp: 100, mana: 100, speed: 8, damage: 7, defense: 5 },
    spells: [
      { name: 'Electric Dart', desc: 'Ranged shock slows enemy by 40%.' },
      { name: 'Chain Shock', desc: 'Lightning chains between up to 4 enemies.' },
      { name: 'Storm Surge', desc: 'Untouchable speed; every dash deals damage.' }
    ],
    posX: '61.5%'
  },
  vesol: {
    title: 'Ember Mage',
    origin: 'Asian / Japanese-Filipino',
    element: 'Flame',
    status: 'Burn',
    aura: '#2f7de1',
    story: 'A lead researcher in gate energy who maps the battlefield before she engages, burning it in the order that makes most sense.',
    stats: { hp: 90, mana: 130, speed: 6, damage: 8, defense: 4 },
    spells: [
      { name: 'Flame Bolt', desc: 'Fast projectile, applies burn damage.' },
      { name: 'Flame Wall', desc: 'Wall of fire that burns enemies.' },
      { name: 'Inferno', desc: 'Entire arena fills with fire; all enemies burn.' }
    ],
    posX: '82%'
  },
};

const STAT_MAX = { hp: 160, mana: 130, speed: 10, damage: 10, defense: 10 };

export class HunterSelectScreen {
  constructor(overlay, onConfirm, onBack) {
    this.overlay = overlay;
    this.onConfirm = onConfirm;
    this.onBack = onBack;
    this.container = null;
    this._active = false;
    this.cursorIndex = 0; 
    this.expandedIndex = -1;
  }

  setCoop(enabled) {
    this.isCoop = enabled;
  }

  show() {
    this._active = true;
    if (this.container) this.container.remove();

    this.container = document.createElement('div');
    this.container.id = 'hunter-select-root';
    this.container.innerHTML = `
      <style>
        #hunter-select-root {
          position: fixed;
          inset: 0;
          background: #000;
          z-index: 9999;
          color: white;
          font-family: 'Rajdhani', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .bg-layer {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }
        .bg-layer img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .interaction-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
        }

        .pillar-zone {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 20%;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: auto;
          transition: all 0.3s ease;
        }

        .name-label {
          position: absolute;
          bottom: 12%;
          font-size: 3.5rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: white;
          text-shadow: 0 0 10px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,1), 0 0 30px rgba(0,0,0,1);
          opacity: 0.5;
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          pointer-events: none;
        }

        .pillar-zone.active .name-label {
          opacity: 1;
          color: var(--aura);
          transform: translateY(-15px) scale(1.1);
          text-shadow: 0 0 40px var(--aura), 0 0 60px var(--aura), 0 0 10px rgba(0,0,0,1);
        }

        /* ── Return to Title: Matching Title Screen Style ── */
        .btn-return-title {
          position: absolute;
          top: 40px;
          left: 40px;
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(160,130,200,0.6);
          cursor: pointer;
          transition: all 150ms ease;
          user-select: none;
          z-index: 100;
          pointer-events: auto;
          background: none;
          border: none;
          padding: 6px 20px;
        }
        .btn-return-title:hover {
          color: #e8d8ff;
          text-shadow: 0 0 10px rgba(180,100,255,0.8), 0 0 24px rgba(120,50,200,0.5);
        }
        .btn-return-title::before {
          content: '◀';
          font-size: 0.7em;
          margin-right: 8px;
        }

        /* ── Consistency: Match Title Screen Controls Hint ── */
        .hints-footer-container {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
        }
        .hints-box {
          background: rgba(4, 2, 12, 0.7);
          backdrop-filter: blur(10px);
          padding: 8px 30px;
          border-radius: 4px;
          border: 1px solid rgba(160,130,200,0.2);
        }
        .hints-text {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: 0.8rem;
          letter-spacing: 0.15em;
          color: rgba(160,130,200,0.6);
          text-transform: uppercase;
          white-space: nowrap;
          pointer-events: none;
        }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 2, 12, 0.9);
          backdrop-filter: blur(15px);
          z-index: 10000;
          display: none;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
        }
        .modal-overlay.active { display: flex; }

        .modal-card {
          width: 92vw;
          max-width: 1250px;
          height: 85vh;
          background: #050508;
          border: 1px solid var(--aura);
          display: flex;
          box-shadow: 0 0 150px var(--aura-half);
          animation: cardSlideIn 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
          overflow: hidden;
        }
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-art {
          width: 40%;
          background-size: cover;
          background-position: center;
          position: relative;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .modal-art::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, transparent 60%, #050508 100%);
        }

        .modal-info {
          flex: 1;
          padding: 35px 55px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }

        .m-header { margin-bottom: 10px; }
        .m-name { font-size: 4.8rem; color: var(--aura); text-transform: uppercase; font-weight: 900; line-height: 0.8; margin-bottom: 5px; }
        .m-sub { font-size: 1.1rem; color: #666; letter-spacing: 0.4em; text-transform: uppercase; }

        .m-bio { font-size: 1.05rem; font-style: italic; color: #ccc; line-height: 1.6; margin-bottom: 20px; border-left: 5px solid var(--aura); padding-left: 25px; }

        .m-stats-visual { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 15px 40px;
          margin-bottom: 25px;
        }
        .stat-row { display: flex; align-items: center; gap: 15px; }
        .stat-label { width: 60px; font-size: 0.75rem; color: #777; text-transform: uppercase; letter-spacing: 0.1em; }
        .stat-bar-container { flex: 1; height: 6px; background: rgba(255,255,255,0.05); position: relative; border-radius: 3px; overflow: hidden; }
        .stat-bar-fill { height: 100%; background: var(--aura); border-radius: 3px; box-shadow: 0 0 15px var(--aura); }
        .stat-val-text { width: 35px; font-size: 0.9rem; font-weight: 800; color: #fff; text-align: right; }

        .m-skills { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
        .m-skill-card { background: rgba(255,255,255,0.03); padding: 18px; border: 1px solid rgba(160,130,200,0.1); transition: border-color 0.2s; }
        .m-skill-card:hover { border-color: var(--aura-half); }
        .m-skill-name { font-weight: 900; color: var(--aura); text-transform: uppercase; font-size: 0.9rem; margin-bottom: 5px; }
        .m-skill-desc { font-size: 0.8rem; color: #888; line-height: 1.4; }

        .m-footer { margin-top: auto; display: flex; gap: 25px; }
        .btn-modal { 
          flex: 1;
          padding: 18px 0; 
          font-family: 'Rajdhani', sans-serif; 
          font-weight: 900; 
          text-transform: uppercase; 
          letter-spacing: 0.2em; 
          cursor: pointer; 
          border: 1px solid rgba(160,130,200,0.3); 
          background: rgba(0,0,0,0.4); 
          color: rgba(160,130,200,0.7); 
          transition: all 0.2s; 
          text-align: center;
          font-size: 0.95rem;
        }
        .btn-modal.primary { 
          color: #e8d8ff;
          border-color: var(--aura); 
          box-shadow: 0 0 20px var(--aura-half); 
        }
        .btn-modal:hover { 
          background: #e8d8ff; 
          color: black; 
          border-color: white; 
          transform: translateY(-2px); 
        }

        .modal-close-btn { position: absolute; top: 20px; right: 20px; font-size: 3.5rem; cursor: pointer; color: #333; transition: 0.3s; z-index: 11000; line-height: 1; }
        .modal-close-btn:hover { color: white; }
      </style>

      <div class="bg-layer">
        <img src="./assets/ui/Characterselect-ezgif.com-video-to-gif-converter.gif" alt="Selection Background">
      </div>

      <button class="btn-return-title" id="btn-return">Return to Title</button>
      
      <div class="interaction-overlay">
        ${HUNTER_ORDER.map((id, index) => `
          <div class="pillar-zone ${index === this.cursorIndex ? 'active' : ''}" 
               data-index="${index}" 
               style="left: ${HUNTER_META[id].posX}; transform: translateX(-50%); --aura: ${HUNTER_META[id].aura}; --aura-half: ${HUNTER_META[id].aura}44">
            <div class="name-label">${HUNTER_CONFIGS[id].label}</div>
          </div>
        `).join('')}
      </div>

      <div class="hints-footer-container">
        <div class="hints-box">
          <div class="hints-text" id="instr-hint">←→ Navigate &nbsp;&nbsp; Enter / X &nbsp; Choose &nbsp;&nbsp; Esc &nbsp; Back</div>
        </div>
      </div>

      <div class="modal-overlay" id="hunter-card-modal">
        <div class="modal-card" id="modal-content-area">
          <!-- Populated dynamically -->
        </div>
      </div>
    `;

    this.overlay.appendChild(this.container);
    this._attachEvents();
  }

  _attachEvents() {
    this.container.querySelector('#btn-return').onclick = (e) => {
      e.stopPropagation();
      this.onBack();
    };

    this.container.querySelectorAll('.pillar-zone').forEach(zone => {
      zone.onmouseenter = () => {
        if (this.expandedIndex !== -1) return;
        this.cursorIndex = parseInt(zone.dataset.index);
        this._updatePillars();
      };
      zone.onclick = (e) => {
        e.stopPropagation();
        if (this.expandedIndex !== -1) return;
        this.cursorIndex = parseInt(zone.dataset.index);
        this._updatePillars();
        this._openSheet(this.cursorIndex);
      };
    });
  }

  _updatePillars() {
    this.container.querySelectorAll('.pillar-zone').forEach((z, i) => {
      z.classList.toggle('active', i === this.cursorIndex);
    });
  }

  _renderStatRow(label, value, max) {
    const pct = Math.min(100, (value / max) * 100);
    return `
      <div class="stat-row">
        <div class="stat-label">${label}</div>
        <div class="stat-bar-container">
          <div class="stat-bar-fill" style="width: ${pct}%"></div>
        </div>
        <div class="stat-val-text">${value}</div>
      </div>
    `;
  }

  _openSheet(index) {
    this.expandedIndex = index;
    const id = HUNTER_ORDER[index];
    const meta = HUNTER_META[id];
    const config = HUNTER_CONFIGS[id];
    const modal = this.container.querySelector('#hunter-card-modal');
    const content = this.container.querySelector('#modal-content-area');

    content.style.setProperty('--aura', meta.aura);
    content.style.setProperty('--aura-half', meta.aura + '66');

    content.innerHTML = `
      <div class="modal-close-btn" id="x-btn-close">&times;</div>
      <div class="modal-art" style="background-image: url('./assets/ui/characters/portrait-${id}.jpeg')"></div>
      <div class="modal-info">
        <div class="m-header">
          <div class="m-name">${config.label}</div>
          <div class="m-sub">${meta.title} — ${meta.element} / ${meta.status} Specialist</div>
        </div>
        
        <div class="m-bio">${meta.story}</div>

        <div class="m-stats-visual">
          ${this._renderStatRow('HP', meta.stats.hp, STAT_MAX.hp)}
          ${this._renderStatRow('Mana', meta.stats.mana, STAT_MAX.mana)}
          ${this._renderStatRow('Speed', meta.stats.speed, STAT_MAX.speed)}
          ${this._renderStatRow('Damage', meta.stats.damage, STAT_MAX.damage)}
          ${this._renderStatRow('Defense', meta.stats.defense, STAT_MAX.defense)}
        </div>

        <div style="font-size:0.75rem; color:var(--aura); text-transform:uppercase; letter-spacing:0.3em; margin-bottom:10px; opacity:0.8; font-weight:900;">Spell Masteries</div>
        <div class="m-skills">
          ${meta.spells.map(s => `
            <div class="m-skill-card">
              <div class="m-skill-name">${s.name}</div>
              <div class="m-skill-desc">${s.desc}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="m-footer">
          <button class="btn-modal primary" id="btn-accept-hunt">Enter the Gate</button>
          <button class="btn-modal" id="btn-cancel-hunt">Return to Roster</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.getElementById('instr-hint').innerHTML = 'Enter / X &nbsp; Accept Selection &nbsp;&nbsp; Esc &nbsp; Back to Roster';

    modal.querySelector('#x-btn-close').onclick = () => this._closeSheet();
    modal.querySelector('#btn-cancel-hunt').onclick = () => this._closeSheet();
    modal.querySelector('#btn-accept-hunt').onclick = () => this._onConfirm(index);
  }

  _closeSheet() {
    this.container.querySelector('#hunter-card-modal').classList.remove('active');
    this.expandedIndex = -1;
    document.getElementById('instr-hint').innerHTML = '←→ Navigate &nbsp;&nbsp; Enter / X &nbsp; Choose &nbsp;&nbsp; Esc &nbsp; Back';
  }

  _onConfirm(index) {
    this.onConfirm([{ hunterId: HUNTER_ORDER[index], playerIndex: 0, isAI: false }]);
  }

  hide() {
    this._active = false;
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  update(input) {
    if (!this._active) return;
    
    if (this.expandedIndex !== -1) {
      if (input.justPressedKey('Escape')) this._closeSheet();
      if (input.justPressed(Actions.INTERACT) || input.justPressed(Actions.LIGHT) || input.justPressedKey('Enter')) {
        this._onConfirm(this.expandedIndex);
      }
      return;
    }

    if (input.justPressed(Actions.MOVE_LEFT)) {
      this.cursorIndex = (this.cursorIndex - 1 + 4) % 4;
      this._updatePillars();
    }
    if (input.justPressed(Actions.MOVE_RIGHT)) {
      this.cursorIndex = (this.cursorIndex + 1) % 4;
      this._updatePillars();
    }
    if (input.justPressed(Actions.INTERACT) || input.justPressed(Actions.LIGHT) || input.justPressedKey('Enter')) {
      this._openSheet(this.cursorIndex);
    }
    if (input.justPressedKey('Escape')) {
      this.onBack();
    }
  }
}
