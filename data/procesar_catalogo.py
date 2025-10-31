"""
Script para procesar el catálogo de productos del mini market
Extrae categorías y productos del archivo listas_precios_mini_m.md
"""
import re
import json
from typing import List, Dict, Any

def extraer_categorias_y_productos(archivo_path: str) -> Dict[str, Any]:
    """
    Extrae todas las categorías y productos del catálogo
    """
    with open(archivo_path, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    categorias = []
    productos_por_categoria = {}
    categoria_actual = None
    categoria_codigo = None
    
    # Patrones para detectar categorías (con emoji)
    patron_categoria = r'^#+ (.+)$'
    
    lineas = contenido.split('\n')
    
    for i, linea in enumerate(lineas):
        linea = linea.strip()
        
        # Detectar categoría (línea que empieza con #)
        match_cat = re.match(patron_categoria, linea)
        if match_cat:
            nombre_categoria = match_cat.group(1).strip()
            
            # Extraer emoji si existe
            emoji_match = re.match(r'^([\U0001F300-\U0001F9FF])\s*(.+)$', nombre_categoria)
            if emoji_match:
                emoji = emoji_match.group(1)
                nombre_limpio = emoji_match.group(2).strip()
            else:
                emoji = None
                nombre_limpio = nombre_categoria
            
            # Generar código de categoría
            categoria_codigo = generar_codigo_categoria(nombre_limpio)
            
            categoria_actual = {
                'nombre': nombre_limpio,
                'codigo': categoria_codigo,
                'emoji': emoji,
                'descripcion': nombre_limpio
            }
            
            if categoria_codigo not in [c['codigo'] for c in categorias]:
                categorias.append(categoria_actual)
                productos_por_categoria[categoria_codigo] = []
        
        # Detectar productos en tablas markdown
        elif '|' in linea and categoria_actual and not linea.startswith('|---'):
            # Limpiar línea y extraer campos
            campos = [c.strip() for c in linea.split('|') if c.strip()]
            
            # Ignorar encabezados de tabla
            if campos and campos[0] not in ['Producto', 'Tamaño', 'x6 unid']:
                producto_nombre = campos[0]
                
                # Limpiar nombre de producto
                if producto_nombre and not producto_nombre.startswith('---'):
                    # Detectar presentación
                    presentacion = None
                    if len(campos) > 1:
                        # Buscar información de tamaño/presentación en columnas
                        for campo in campos[1:]:
                            if campo and not campo.isspace():
                                # Buscar patrones de tamaño (x6, x12, 1LT, etc)
                                size_match = re.search(r'(x\d+|[\d.]+\s*[a-zA-Z]+)', campo)
                                if size_match:
                                    presentacion = size_match.group(1)
                                    break
                    
                    # Buscar presentación en el nombre del producto
                    if not presentacion:
                        size_in_name = re.search(r'(x\d+|[\d.]+\s*[a-zA-Z]+)$', producto_nombre)
                        if size_in_name:
                            presentacion = size_in_name.group(1)
                            producto_nombre = producto_nombre.replace(presentacion, '').strip()
                    
                    producto = {
                        'nombre': producto_nombre,
                        'presentacion': presentacion,
                        'categoria_codigo': categoria_codigo
                    }
                    
                    productos_por_categoria[categoria_codigo].append(producto)
    
    return {
        'categorias': categorias,
        'productos_por_categoria': productos_por_categoria,
        'total_categorias': len(categorias),
        'total_productos': sum(len(prods) for prods in productos_por_categoria.values())
    }

def generar_codigo_categoria(nombre: str) -> str:
    """
    Genera código de 3 letras para la categoría
    """
    # Eliminar palabras comunes
    palabras_ignorar = ['y', 'en', 'de', 'para', 'del', 'la', 'el', 'las', 'los']
    palabras = [p for p in nombre.split() if p.lower() not in palabras_ignorar]
    
    if len(palabras) == 0:
        palabras = nombre.split()
    
    # Tomar primeras letras
    if len(palabras) == 1:
        codigo = palabras[0][:3].upper()
    else:
        codigo = ''.join([p[0] for p in palabras[:3]]).upper()
    
    # Ajustar a 3 caracteres
    if len(codigo) < 3:
        codigo = (codigo + palabras[0])[:3].upper()
    elif len(codigo) > 3:
        codigo = codigo[:3]
    
    return codigo

def main():
    archivo = '/workspace/docs/listas_precios_mini_m.md'
    resultado = extraer_categorias_y_productos(archivo)
    
    print(f"\n{'='*60}")
    print(f"ANALISIS DEL CATALOGO MINI MARKET")
    print(f"{'='*60}\n")
    
    print(f"Total de categorias detectadas: {resultado['total_categorias']}")
    print(f"Total de productos detectados: {resultado['total_productos']}\n")
    
    print(f"{'='*60}")
    print(f"CATEGORIAS DETECTADAS:")
    print(f"{'='*60}\n")
    
    for cat in resultado['categorias']:
        emoji = cat['emoji'] if cat['emoji'] else ''
        print(f"  {emoji} [{cat['codigo']}] {cat['nombre']}")
    
    print(f"\n{'='*60}")
    print(f"PRODUCTOS POR CATEGORIA:")
    print(f"{'='*60}\n")
    
    for cat in resultado['categorias']:
        codigo = cat['codigo']
        productos = resultado['productos_por_categoria'][codigo]
        print(f"\n{cat['nombre']} ({len(productos)} productos):")
        for i, prod in enumerate(productos[:5], 1):
            pres = f" - {prod['presentacion']}" if prod['presentacion'] else ""
            print(f"  {i}. {prod['nombre']}{pres}")
        if len(productos) > 5:
            print(f"  ... y {len(productos) - 5} mas")
    
    # Guardar JSON
    output_file = '/workspace/data/catalogo_procesado.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"Catalogo guardado en: {output_file}")
    print(f"{'='*60}\n")
    
    return resultado

if __name__ == '__main__':
    main()
