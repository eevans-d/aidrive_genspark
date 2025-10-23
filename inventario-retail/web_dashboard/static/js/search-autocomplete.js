/**
 * Search Autocomplete Module
 * Búsqueda inteligente de productos con autocompletado
 */

class SearchAutocomplete {
    constructor(inputSelector, dropdownSelector) {
        this.input = document.querySelector(inputSelector);
        this.dropdown = document.querySelector(dropdownSelector);
        this.debounceTimer = null;
        this.minChars = 2;
        this.debounceDelay = 200;
        this.cache = new Map();
        
        if (this.input) {
            this.init();
        }
    }
    
    init() {
        console.log('🔍 SearchAutocomplete inicializado');
        
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('focus', (e) => this.handleFocus(e));
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        document.addEventListener('click', (e) => this.handleClickOutside(e));
    }
    
    handleInput(e) {
        clearTimeout(this.debounceTimer);
        
        const query = e.target.value.trim();
        
        if (query.length < this.minChars) {
            this.hideDropdown();
            return;
        }
        
        this.showLoading();
        
        this.debounceTimer = setTimeout(() => {
            this.search(query);
        }, this.debounceDelay);
    }
    
    handleFocus(e) {
        const query = e.target.value.trim();
        if (query.length >= this.minChars) {
            this.search(query);
        }
    }
    
    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.hideDropdown();
        }
    }
    
    async search(query) {
        try {
            // Verificar cache
            if (this.cache.has(query)) {
                console.log('📦 Cache hit:', query);
                this.showResults(this.cache.get(query));
                return;
            }
            
            const response = await fetch(
                `/api/productos/search?q=${encodeURIComponent(query)}&limit=8`,
                {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    timeout: 5000
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Guardar en cache (5 minutos)
            this.cache.set(query, data.results);
            setTimeout(() => this.cache.delete(query), 300000);
            
            console.log('✅ Búsqueda completada:', data.count, 'resultados');
            this.showResults(data.results);
            
        } catch (error) {
            console.error('❌ Error búsqueda:', error);
            this.showError('Error en la búsqueda');
        }
    }
    
    showLoading() {
        if (!this.dropdown) return;
        this.dropdown.innerHTML = '<div class="autocomplete-loading"><span>Buscando...</span></div>';
        this.dropdown.style.display = 'block';
    }
    
    showResults(results) {
        if (!this.dropdown) return;
        
        if (!results || results.length === 0) {
            this.dropdown.innerHTML = '<div class="autocomplete-empty">No se encontraron productos</div>';
        } else {
            this.dropdown.innerHTML = results.map(p => `
                <div class="autocomplete-item" data-id="${p.id}" data-nombre="${p.nombre}" data-precio="${p.precio}">
                    <div class="item-main">
                        <div class="item-name">${this.highlightMatch(p.nombre, this.input.value)}</div>
                        <div class="item-code">${p.codigo_barras || 'N/A'}</div>
                    </div>
                    <div class="item-right">
                        <div class="item-price">$${parseFloat(p.precio).toFixed(2)}</div>
                        <div class="item-stock ${p.stock < 5 ? 'critical' : p.stock < 10 ? 'low' : 'ok'}">
                            ${p.stock} unid
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Event listeners
            this.dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('click', () => this.selectItem(item));
                item.addEventListener('hover', () => item.classList.add('active'));
            });
        }
        
        this.dropdown.style.display = 'block';
    }
    
    showError(message) {
        if (!this.dropdown) return;
        this.dropdown.innerHTML = `<div class="autocomplete-error">⚠️ ${message}</div>`;
        this.dropdown.style.display = 'block';
    }
    
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
    
    hideDropdown() {
        if (this.dropdown) {
            this.dropdown.style.display = 'none';
        }
    }
    
    handleClickOutside(e) {
        if (this.dropdown && !this.dropdown.contains(e.target) && e.target !== this.input) {
            this.hideDropdown();
        }
    }
    
    selectItem(element) {
        const productId = element.dataset.id;
        const productName = element.dataset.nombre;
        
        console.log('✅ Producto seleccionado:', productName, '(ID:', productId, ')');
        
        // Actualizar input
        this.input.value = productName;
        
        // Disparar evento personalizado
        const event = new CustomEvent('product-selected', {
            detail: {
                id: productId,
                nombre: productName,
                precio: element.dataset.precio
            }
        });
        this.input.dispatchEvent(event);
        
        this.hideDropdown();
    }
}

// Inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando SearchAutocomplete');
    const searchInput = document.getElementById('producto-search');
    
    if (searchInput) {
        new SearchAutocomplete('#producto-search', '#autocomplete-dropdown');
    } else {
        console.warn('⚠️ No se encontró elemento #producto-search');
    }
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchAutocomplete;
}
