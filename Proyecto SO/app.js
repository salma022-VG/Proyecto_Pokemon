/* =====================================================
   POKÉDEX CRUD — app.js
   React app via CDN + Babel Standalone
   Uses PokeAPI for real data, local state for CRUD
   ===================================================== */

const { useState, useEffect, useCallback, useRef } = React;

/* ── Constants ── */
const API_BASE   = 'https://pokeapi.co/api/v2';
const PAGE_SIZE  = 24;
const POKEMON_TYPES = [
  'fire','water','grass','electric','psychic','ice',
  'dragon','dark','fighting','poison','ground','flying',
  'bug','rock','ghost','steel','normal','fairy'
];

const TYPE_GRADIENTS = {
  fire:'#ff6400,#ff4500', water:'#3b82f6,#1d4ed8', grass:'#22c55e,#15803d',
  electric:'#fbbf24,#d97706', psychic:'#ec4899,#9d174d', ice:'#67e8f9,#0891b2',
  dragon:'#7c3aed,#4c1d95', dark:'#374151,#111827', fighting:'#b95f32,#78350f',
  poison:'#a855f7,#6b21a8', ground:'#d4a017,#92400e', flying:'#93c5fd,#3b82f6',
  bug:'#84cc16,#4d7c0f', rock:'#a8956e,#78350f', ghost:'#6366f1,#312e81',
  steel:'#94a3b8,#475569', normal:'#9ca3af,#4b5563', fairy:'#f9a8d4,#be185d',
};

/* ── SVG Icons ── */
const Icon = {
  Pokeball: () => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" stroke="#fbbf24" strokeWidth="2" fill="none"/>
      <path d="M2 20 Q2 2 20 2" stroke="#fbbf24" strokeWidth="2" fill="rgba(251,191,36,0.15)"/>
      <path d="M38 20 Q38 2 20 2" stroke="#fbbf24" strokeWidth="2" fill="rgba(251,191,36,0.15)"/>
      <line x1="2" y1="20" x2="38" y2="20" stroke="#fbbf24" strokeWidth="2"/>
      <circle cx="20" cy="20" r="5" stroke="#fbbf24" strokeWidth="2" fill="#080c14"/>
      <circle cx="20" cy="20" r="2.5" fill="#fbbf24"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  Grid: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Chevron: ({ dir = 'right' }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: dir === 'left' ? 'rotate(180deg)' : dir === 'up' ? 'rotate(-90deg)' : dir === 'down' ? 'rotate(90deg)' : '' }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Success: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Error: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
};

/* ── Stat bar color ── */
function statColor(value) {
  if (value >= 100) return '#22c55e';
  if (value >= 70)  return '#fbbf24';
  if (value >= 40)  return '#3b82f6';
  return '#ef4444';
}

/* ── Pokemon sprite URL ── */
function getSpriteUrl(id) {
  if (typeof id === 'string' && id.startsWith('custom-')) {
    return null;
  }
  const numId = parseInt(id, 10);
  if (!isNaN(numId) && numId > 0) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${numId}.png`;
  }
  return null;
}

/* ── Toast Component ── */
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' ? <Icon.Success /> : <Icon.Error />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line" style={{ width: '50%', height: 12 }}/>
      <div className="skeleton-circle"/>
      <div className="skeleton-line" style={{ width: '75%', height: 14, margin: '0 auto 10px' }}/>
      <div className="skeleton-line" style={{ width: '60%', height: 10, margin: '0 auto 10px' }}/>
      <div className="skeleton-line" style={{ width: '100%', height: 8 }}/>
      <div className="skeleton-line" style={{ width: '100%', height: 8 }}/>
      <div className="skeleton-line" style={{ width: '100%', height: 8, marginBottom: 0 }}/>
    </div>
  );
}

/* ── Pokemon Card (Grid) ── */
function PokemonCard({ pokemon, onEdit, onDelete }) {
  const spriteUrl = pokemon.sprite || getSpriteUrl(pokemon.id);
  const mainType  = pokemon.types?.[0] || 'normal';
  const gradient  = TYPE_GRADIENTS[mainType] || '#3b82f6,#1d4ed8';
  const cardStyle = { '--card-color': `rgba(${gradient.split(',')[0].replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')}, 0.12)` };

  const stats = pokemon.stats || {};

  return (
    <div
      className={`pokemon-card ${pokemon.isCustom ? 'custom' : ''}`}
      style={cardStyle}
    >
      <div className="card-number">
        #{String(pokemon.id).padStart(3, '0')}
        {pokemon.isCustom && <span className="custom-badge">CUSTOM</span>}
      </div>

      <div className="card-image-wrapper">
        {spriteUrl ? (
          <img
            className="card-image"
            src={spriteUrl}
            alt={pokemon.name}
            loading="lazy"
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
          />
        ) : null}
        <div
          className="card-image-placeholder"
          style={{ display: spriteUrl ? 'none' : 'flex' }}
        >
          {pokemon.emoji || '❓'}
        </div>
      </div>

      <div className="card-name">{pokemon.name}</div>

      <div className="card-types">
        {pokemon.types?.map(t => (
          <span key={t} className={`type-pill type-${t}`}>{t}</span>
        ))}
      </div>

      <div className="card-stats">
        {[['HP', stats.hp||0], ['ATK', stats.attack||0], ['DEF', stats.defense||0]].map(([label, val]) => (
          <div key={label} className="stat-row">
            <span className="stat-label">{label}</span>
            <div className="stat-bar-bg">
              <div
                className="stat-bar-fill"
                style={{ width: `${Math.min(val/255*100, 100)}%`, background: statColor(val) }}
              />
            </div>
            <span className="stat-value">{val}</span>
          </div>
        ))}
      </div>

      <div className="card-actions">
        <button className="btn-icon btn-edit" onClick={() => onEdit(pokemon)} title="Editar">
          <Icon.Edit /> EDIT
        </button>
        <button className="btn-icon btn-delete" onClick={() => onDelete(pokemon)} title="Eliminar">
          <Icon.Trash /> DEL
        </button>
      </div>
    </div>
  );
}

/* ── Pokemon Card (List) ── */
function PokemonListCard({ pokemon, onEdit, onDelete }) {
  const spriteUrl = pokemon.sprite || getSpriteUrl(pokemon.id);
  const stats = pokemon.stats || {};

  return (
    <div className={`list-card ${pokemon.isCustom ? 'custom' : ''}`}>
      {spriteUrl ? (
        <img className="list-image" src={spriteUrl} alt={pokemon.name} loading="lazy"
          onError={e => { e.target.style.display='none'; }}/>
      ) : (
        <div style={{width:56,height:56,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',flexShrink:0}}>
          {pokemon.emoji || '❓'}
        </div>
      )}

      <div className="list-info">
        <div className="list-number">#{String(pokemon.id).padStart(3,'0')} {pokemon.isCustom && '· CUSTOM'}</div>
        <div className="list-name">{pokemon.name}</div>
        <div className="list-stats">
          <span className="list-stat"><span>HP</span>{stats.hp||0}</span>
          <span className="list-stat"><span>ATK</span>{stats.attack||0}</span>
          <span className="list-stat"><span>DEF</span>{stats.defense||0}</span>
          <span className="list-stat"><span>SPD</span>{stats.speed||0}</span>
        </div>
      </div>

      <div className="list-types">
        {pokemon.types?.map(t => (
          <span key={t} className={`type-pill type-${t}`}>{t}</span>
        ))}
      </div>

      <div className="list-actions">
        <button className="btn-icon btn-edit" onClick={() => onEdit(pokemon)} title="Editar">
          <Icon.Edit />
        </button>
        <button className="btn-icon btn-delete" onClick={() => onDelete(pokemon)} title="Eliminar">
          <Icon.Trash />
        </button>
      </div>
    </div>
  );
}

/* ── Pokemon Form Modal ── */
function PokemonModal({ mode, pokemon, onSave, onClose }) {
  const isEdit = mode === 'edit';
  const nextId = 'custom-' + Date.now();

  const [form, setForm] = useState({
    id:      isEdit ? pokemon.id       : nextId,
    name:    isEdit ? pokemon.name     : '',
    types:   isEdit ? (pokemon.types || ['normal']) : ['normal'],
    emoji:   isEdit ? (pokemon.emoji  || '⭐') : '⭐',
    sprite:  isEdit ? (pokemon.sprite || '') : '',
    stats: {
      hp:              isEdit ? (pokemon.stats?.hp              || 45) : 45,
      attack:          isEdit ? (pokemon.stats?.attack          || 49) : 49,
      defense:         isEdit ? (pokemon.stats?.defense         || 49) : 49,
      'special-attack':isEdit ? (pokemon.stats?.['special-attack'] || 65) : 65,
      'special-defense':isEdit? (pokemon.stats?.['special-defense'] || 65): 65,
      speed:           isEdit ? (pokemon.stats?.speed           || 45) : 45,
    },
    isCustom: true,
  });

  const [errors, setErrors] = useState({});
  const [previewSrc, setPreviewSrc] = useState(form.sprite);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const setStat = (stat, val) => {
    setForm(f => ({ ...f, stats: { ...f.stats, [stat]: Number(val) } }));
  };

  const toggleType = (type) => {
    setForm(f => {
      const curr = f.types;
      if (curr.includes(type)) {
        return { ...f, types: curr.length > 1 ? curr.filter(t => t !== type) : curr };
      }
      return { ...f, types: curr.length < 2 ? [...curr, type] : [curr[1], type] };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio';
    if (form.types.length === 0) e.types = 'Selecciona al menos un tipo';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ ...form, name: form.name.trim().toLowerCase() });
  };

  const STAT_LABELS = {
    'hp': 'HP', 'attack': 'ATK', 'defense': 'DEF',
    'special-attack': 'SP.ATK', 'special-defense': 'SP.DEF', 'speed': 'SPD'
  };

  return (
    <div className="modal-overlay" onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {isEdit ? '✏️ EDITAR POKÉMON' : '➕ NUEVO POKÉMON'}
            </div>
            <div className="modal-subtitle">
              {isEdit ? `Modificando #${String(pokemon.id).padStart(3,'0')} ${pokemon.name}` : 'Agrega un Pokémon personalizado a tu Pokédex'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            {/* Name */}
            <div className="form-group full">
              <label className="form-label">Nombre <span className="required">*</span></label>
              <input
                className="form-input"
                placeholder="ej: charizard"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                style={errors.name ? {borderColor:'var(--accent-red)'} : {}}
              />
              {errors.name && <span className="form-hint" style={{color:'var(--accent-red)'}}>{errors.name}</span>}
            </div>

            {/* Emoji */}
            <div className="form-group">
              <label className="form-label">Emoji / Ícono</label>
              <input
                className="form-input"
                placeholder="⭐"
                value={form.emoji}
                onChange={e => set('emoji', e.target.value)}
                maxLength={4}
              />
            </div>

            {/* Sprite URL */}
            <div className="form-group">
              <label className="form-label">URL de imagen</label>
              <input
                className="form-input"
                placeholder="https://..."
                value={form.sprite}
                onChange={e => { set('sprite', e.target.value); setPreviewSrc(e.target.value); }}
              />
            </div>

            {/* Image preview */}
            <div className="form-group full">
              <label className="form-label">Vista previa</label>
              <div className="image-preview">
                {previewSrc ? (
                  <img className="preview-img" src={previewSrc} alt="preview"
                    onError={() => setPreviewSrc('')}/>
                ) : (
                  <div className="preview-placeholder">{form.emoji}</div>
                )}
                <span className="form-hint">Usa una URL de imagen directa (.png, .jpg, .gif) o el emoji se mostrará.</span>
              </div>
            </div>

            {/* Types */}
            <div className="form-group full">
              <label className="form-label">
                Tipos <span className="required">*</span>
                <span className="form-hint" style={{marginLeft:8,fontSize:'0.65rem',textTransform:'none',letterSpacing:0,color:'var(--text-muted)'}}>
                  (máx. 2)
                </span>
              </label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                {POKEMON_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`type-pill type-${t}`}
                    style={{
                      cursor: 'pointer',
                      border: form.types.includes(t) ? '2px solid currentColor' : '1px solid transparent',
                      padding: '5px 12px',
                      fontFamily: 'var(--font-display)',
                      fontWeight: form.types.includes(t) ? 700 : 500,
                      opacity: form.types.includes(t) ? 1 : 0.5,
                      transition: 'all 0.2s',
                      background: 'transparent',
                    }}
                    onClick={() => toggleType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {errors.types && <span className="form-hint" style={{color:'var(--accent-red)'}}>{errors.types}</span>}
            </div>

            {/* Stats */}
            <div className="form-group full">
              <label className="form-label">Estadísticas base</label>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:6}}>
                {Object.entries(form.stats).map(([key, val]) => (
                  <div key={key} className="stat-row">
                    <span className="stat-label" style={{width:48,fontSize:'0.62rem'}}>{STAT_LABELS[key]}</span>
                    <div className="stat-bar-bg" style={{flex:1}}>
                      <div className="stat-bar-fill" style={{
                        width: `${val/255*100}%`,
                        background: statColor(val),
                        height:'100%',borderRadius:2
                      }}/>
                    </div>
                    <input
                      type="range" min={1} max={255} value={val}
                      className="stat-slider"
                      onChange={e => setStat(key, e.target.value)}
                      style={{width:80,flexShrink:0}}
                    />
                    <span className="stat-number">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={handleSubmit}>
            {isEdit ? '💾 Guardar cambios' : '✨ Crear Pokémon'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm Modal ── */
function DeleteModal({ pokemon, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="modal confirm-modal">
        <div className="confirm-body">
          <div className="confirm-icon">⚠️</div>
          <div className="confirm-title">¿ELIMINAR POKÉMON?</div>
          <p className="confirm-text">
            Esta acción no se puede deshacer. Se eliminará a{' '}
            <strong>{pokemon.name}</strong> de tu Pokédex.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-delete-confirm" onClick={onConfirm}>🗑️ Eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ── Pagination ── */
function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;

  const pages = [];
  const delta = 2;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      pages.push(i);
    }
  }

  const rendered = [];
  let prev = null;
  for (const p of pages) {
    if (prev && p - prev > 1) rendered.push('...');
    rendered.push(p);
    prev = p;
  }

  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onChange(current-1)} disabled={current===1}>
        <Icon.Chevron dir="left"/>
      </button>
      {rendered.map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} className="page-ellipsis">…</span>
          : <button key={p} className={`page-btn ${current===p?'active':''}`} onClick={() => onChange(p)}>{p}</button>
      )}
      <button className="page-btn" onClick={() => onChange(current+1)} disabled={current===total}>
        <Icon.Chevron dir="right"/>
      </button>
    </div>
  );
}

/* ── Hook: Toast ── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type='success') => {
    const id = Date.now();
    setToasts(t => [...t, {id, message, type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return { toasts, toast: add };
}

/* ── Hook: Fetch Pokemon from API ── */
function usePokemonAPI() {
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const cache = useRef({});

  const fetchDetail = async (url) => {
    if (cache.current[url]) return cache.current[url];
    const r = await fetch(url);
    const data = await r.json();
    const result = {
      id:     data.id,
      name:   data.name,
      types:  data.types.map(t => t.type.name),
      sprite: data.sprites?.other?.['official-artwork']?.front_default || data.sprites?.front_default || null,
      stats: {
        hp:               data.stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
        attack:           data.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
        defense:          data.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
        'special-attack': data.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
        'special-defense':data.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
        speed:            data.stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
      },
      isCustom: false,
    };
    cache.current[url] = result;
    return result;
  };

  useEffect(() => {
    const loadBatch = async () => {
      setLoading(true);
      try {
        // Load first 151 Pokemon (gen 1)
        const listRes = await fetch(`${API_BASE}/pokemon?limit=151&offset=0`);
        const listData = await listRes.json();

        // Fetch details in parallel batches of 20
        const results = [];
        const batchSize = 20;
        for (let i = 0; i < listData.results.length; i += batchSize) {
          const batch = listData.results.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch.map(p => fetchDetail(p.url)));
          results.push(...batchResults);
          // Update incrementally
          setApiData(prev => {
            const ids = new Set(prev.map(p => p.id));
            return [...prev, ...batchResults.filter(p => !ids.has(p.id))];
          });
        }
      } catch (err) {
        console.error('Error cargando Pokémon:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBatch();
  }, []);

  return { apiData, loading };
}

/* ── Main App ── */
function App() {
  const { apiData, loading } = usePokemonAPI();
  const { toasts, toast } = useToast();

  // Custom pokemon stored in state (persisted to localStorage)
  const [customPokemon, setCustomPokemon] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pokedex_custom') || '[]'); }
    catch { return []; }
  });

  // Merge api + custom
  const [deletedIds, setDeletedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pokedex_deleted') || '[]'); }
    catch { return []; }
  });

  const allPokemon = [
    ...apiData.filter(p => !deletedIds.includes(p.id)),
    ...customPokemon,
  ];

  // UI State
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView]             = useState('grid');
  const [page, setPage]             = useState(1);
  const [modal, setModal]           = useState(null); // null | {mode:'add'} | {mode:'edit',pokemon} | {mode:'delete',pokemon}

  // Persist custom pokemon
  useEffect(() => {
    localStorage.setItem('pokedex_custom', JSON.stringify(customPokemon));
  }, [customPokemon]);

  useEffect(() => {
    localStorage.setItem('pokedex_deleted', JSON.stringify(deletedIds));
  }, [deletedIds]);

  // Filter
  const filtered = allPokemon.filter(p => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || p.types?.includes(typeFilter);
    return matchName && matchType;
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const resetPage = () => setPage(1);

  const handleSearch = (v) => { setSearch(v); resetPage(); };
  const handleType   = (v) => { setTypeFilter(v); resetPage(); };

  // CRUD
  const handleSave = (data) => {
    if (modal.mode === 'add') {
      setCustomPokemon(prev => [...prev, data]);
      toast(`✨ ${data.name} fue agregado a tu Pokédex!`, 'success');
    } else {
      // Edit — update in customPokemon if custom, else mark as overridden
      if (data.isCustom && String(data.id).startsWith('custom-')) {
        setCustomPokemon(prev => prev.map(p => p.id === data.id ? data : p));
      } else {
        // For API pokemon: replace in deletedIds + push custom version
        setDeletedIds(prev => [...new Set([...prev, data.id])]);
        setCustomPokemon(prev => prev.filter(p => p.id !== data.id).concat([data]));
      }
      toast(`💾 ${data.name} fue actualizado!`, 'success');
    }
    setModal(null);
  };

  const handleDelete = () => {
    const poke = modal.pokemon;
    if (String(poke.id).startsWith('custom-')) {
      setCustomPokemon(prev => prev.filter(p => p.id !== poke.id));
    } else {
      setDeletedIds(prev => [...new Set([...prev, poke.id])]);
      setCustomPokemon(prev => prev.filter(p => p.id !== poke.id));
    }
    toast(`🗑️ ${poke.name} fue eliminado.`, 'error');
    setModal(null);
  };

  const availableTypes = ['all', ...POKEMON_TYPES];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="logo-ball">
            <Icon.Pokeball />
          </div>
          <div className="logo-text">POKÉ<span>DEX</span> <span style={{color:'var(--text-muted)',fontSize:'0.65em',fontWeight:400}}>CRUD</span></div>
        </div>

        <div className="header-stats">
          <div className="stat-badge total">
            <div className="stat-dot"/>
            {loading ? '...' : allPokemon.length} POKÉMON
          </div>
          <div className="stat-badge custom">
            <div className="stat-dot"/>
            {customPokemon.length} CUSTOM
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* Controls */}
        <div className="controls">
          <div className="search-wrapper">
            <span className="search-icon"><Icon.Search /></span>
            <input
              className="search-input"
              placeholder="Buscar Pokémon por nombre..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          <div className="view-toggle">
            <button className={`view-btn ${view==='grid'?'active':''}`} onClick={() => setView('grid')} title="Vista cuadrícula">
              <Icon.Grid />
            </button>
            <button className={`view-btn ${view==='list'?'active':''}`} onClick={() => setView('list')} title="Vista lista">
              <Icon.List />
            </button>
          </div>

          <button className="btn-add" onClick={() => setModal({mode:'add'})}>
            <Icon.Plus /> NUEVO POKÉMON
          </button>
        </div>

        {/* Type filters */}
        <div className="type-filter" style={{marginBottom:24,display:'flex',gap:8,flexWrap:'wrap'}}>
          {availableTypes.map(t => (
            <button
              key={t}
              className={`type-btn ${typeFilter===t?'active':''}`}
              onClick={() => handleType(t)}
              style={t!=='all'&&typeFilter===t ? {background:'var(--accent-blue)',borderColor:'var(--accent-blue)',color:'#fff'} : {}}
            >
              {t === 'all' ? '✦ Todos' : t}
            </button>
          ))}
        </div>

        {/* Section header */}
        <div className="section-header">
          <span className="section-title">
            <span>▸</span>
            {loading ? 'CARGANDO POKÉMON...' : `${filtered.length} POKÉMON ENCONTRADOS`}
          </span>
          <span className="section-title" style={{color:'var(--text-muted)'}}>
            PÁG {page}/{totalPages || 1}
          </span>
        </div>

        {/* Grid / List */}
        {loading && apiData.length === 0 ? (
          <div className="loading-grid">
            {Array.from({length: 12}).map((_,i) => <SkeletonCard key={i}/>)}
          </div>
        ) : (
          <>
            {view === 'grid' ? (
              <div className="pokemon-grid">
                {paginated.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">NO SE ENCONTRARON POKÉMON</div>
                    <div className="empty-subtitle">Intenta con otro nombre o tipo, o crea uno nuevo.</div>
                  </div>
                ) : paginated.map((p, i) => (
                  <div key={p.id} style={{animationDelay: `${i*0.04}s`}}>
                    <PokemonCard
                      pokemon={p}
                      onEdit={() => setModal({mode:'edit', pokemon:p})}
                      onDelete={() => setModal({mode:'delete', pokemon:p})}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="pokemon-list">
                {paginated.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">NO SE ENCONTRARON POKÉMON</div>
                    <div className="empty-subtitle">Intenta con otro nombre o tipo, o crea uno nuevo.</div>
                  </div>
                ) : paginated.map((p, i) => (
                  <PokemonListCard
                    key={p.id}
                    pokemon={p}
                    onEdit={() => setModal({mode:'edit', pokemon:p})}
                    onDelete={() => setModal({mode:'delete', pokemon:p})}
                  />
                ))}
              </div>
            )}

            <Pagination current={page} total={totalPages} onChange={setPage}/>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>POKÉDEX CRUD · Datos de <a href="https://pokeapi.co" target="_blank" rel="noopener">PokéAPI</a> · Generación I</span>
      </footer>

      {/* Modals */}
      {modal?.mode === 'add' && (
        <PokemonModal mode="add" onSave={handleSave} onClose={() => setModal(null)}/>
      )}
      {modal?.mode === 'edit' && (
        <PokemonModal mode="edit" pokemon={modal.pokemon} onSave={handleSave} onClose={() => setModal(null)}/>
      )}
      {modal?.mode === 'delete' && (
        <DeleteModal pokemon={modal.pokemon} onConfirm={handleDelete} onClose={() => setModal(null)}/>
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts}/>
    </div>
  );
}

/* ── Mount ── */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
