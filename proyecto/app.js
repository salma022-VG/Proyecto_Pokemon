const { useState, useEffect, useMemo } = React;

const PokemonCard = ({ pokemon, isFavorite, onToggleFavorite }) => {
    return (
        <div className="pokemon-card">
            <button 
                className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(pokemon.id);
                }}
            >
                <i data-lucide="heart" fill={isFavorite ? "currentColor" : "none"}></i>
            </button>
            <span className="poke-id">#{String(pokemon.id).padStart(3, '0')}</span>
            <img 
                src={pokemon.image} 
                alt={pokemon.name} 
                className="poke-img"
                loading="lazy"
            />
            <h2 className="poke-name">{pokemon.name}</h2>
            <div className="types-row">
                {pokemon.types.map(t => (
                    <span key={t} className={`type-tag ${t}`}>{t}</span>
                ))}
            </div>
        </div>
    );
};

const App = () => {
    const [allPokemon, setAllPokemon] = useState([]);
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('pokedex-favorites');
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('asc');
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

    useEffect(() => {
        localStorage.setItem('pokedex-favorites', JSON.stringify(favorites));
        setTimeout(() => lucide.createIcons(), 100);
    }, [favorites]);

    useEffect(() => {
        const fetchPokemon = async () => {
            try {
                const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=100');
                const data = await response.json();
                
                const detailedData = await Promise.all(
                    data.results.map(async (p) => {
                        const res = await fetch(p.url);
                        const detail = await res.json();
                        return {
                            id: detail.id,
                            name: detail.name,
                            image: detail.sprites.other['official-artwork'].front_default,
                            types: detail.types.map(t => t.type.name)
                        };
                    })
                );
                
                setAllPokemon(detailedData);
                setLoading(false);
                setTimeout(() => lucide.createIcons(), 100);
            } catch (error) {
                console.error("Error fetching pokemon:", error);
                setLoading(false);
            }
        };

        fetchPokemon();
    }, []);

    const filteredAndSortedPokemon = useMemo(() => {
        let result = allPokemon.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                String(p.id).includes(searchQuery);
            const matchesFavorite = showOnlyFavorites ? favorites.includes(p.id) : true;
            return matchesSearch && matchesFavorite;
        });

        result.sort((a, b) => {
            let valA = sortBy === 'id' ? a.id : a.name.toLowerCase();
            let valB = sortBy === 'id' ? b.id : b.name.toLowerCase();
            
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [allPokemon, searchQuery, sortBy, sortOrder, showOnlyFavorites, favorites]);

    const toggleFavorite = (id) => {
        setFavorites(prev => 
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    return (
        <div className="container">
            <header className="header">
                <h1 className="title">Pokedex OS</h1>
                <div className="controls">
                    <div className="search-container">
                        <i data-lucide="search" className="search-icon"></i>
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Buscar por nombre o ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="sort-group">
                        <button 
                            className={`btn-icon ${showOnlyFavorites ? 'active' : ''}`}
                            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                            title="Ver Favoritos"
                        >
                            <i data-lucide="heart"></i>
                        </button>
                        <button 
                            className={`btn-icon ${sortBy === 'name' ? 'active' : ''}`}
                            onClick={() => setSortBy('name')}
                        >
                            <i data-lucide="type"></i>
                            <span>A-Z</span>
                        </button>
                        <button 
                            className={`btn-icon ${sortBy === 'id' ? 'active' : ''}`}
                            onClick={() => setSortBy('id')}
                        >
                            <i data-lucide="hash"></i>
                            <span>ID</span>
                        </button>
                        <button 
                            className="btn-icon"
                            onClick={toggleSortOrder}
                        >
                            <i data-lucide={sortOrder === 'asc' ? "arrow-up-narrow-wide" : "arrow-down-wide-narrow"}></i>
                        </button>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="pokemon-grid">
                    {filteredAndSortedPokemon.length > 0 ? (
                        filteredAndSortedPokemon.map(pokemon => (
                            <PokemonCard 
                                key={pokemon.id} 
                                pokemon={pokemon} 
                                isFavorite={favorites.includes(pokemon.id)}
                                onToggleFavorite={toggleFavorite}
                            />
                        ))
                    ) : (
                        <div className="no-results">
                            <i data-lucide="search-x" size="48"></i>
                            <p>No se encontraron pokémon.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
setTimeout(() => lucide.createIcons(), 500);
