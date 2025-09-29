"""
Validaciones específicas del dominio retail argentino
Implementa reglas de negocio críticas para el sistema multi-agente
"""

import re
from typing import Literal, Optional
from decimal import Decimal, ROUND_HALF_UP
from pydantic import BaseModel, validator, Field
from datetime import datetime, date


class MovimientoStock(BaseModel):
    """Validación para movimientos de stock retail"""
    
    producto_id: int = Field(..., gt=0, description="ID del producto")
    cantidad: int = Field(..., gt=0, description="Cantidad a mover")
    tipo: Literal["ENTRADA", "SALIDA", "TRANSFERENCIA", "AJUSTE", "DEVOLUCION"]
    deposito_id: int = Field(..., gt=0, description="ID del depósito")
    motivo: str = Field(..., min_length=3, max_length=200, description="Motivo del movimiento")
    usuario_id: int = Field(..., gt=0, description="ID del usuario responsable")
    
    @validator('cantidad')
    def validate_cantidad_positiva(cls, v):
        """Cantidad siempre debe ser positiva"""
        if v <= 0:
            raise ValueError("Cantidad debe ser mayor a cero")
        if v > 999999:  # Límite realista para retail
            raise ValueError("Cantidad excede límite máximo permitido (999,999)")
        return v
    
    @validator('tipo')
    def validate_tipo_movimiento(cls, v):
        """Validar tipos de movimiento permitidos"""
        tipos_validos = ["ENTRADA", "SALIDA", "TRANSFERENCIA", "AJUSTE", "DEVOLUCION"] 
        if v not in tipos_validos:
            raise ValueError(f"Tipo de movimiento debe ser uno de: {', '.join(tipos_validos)}")
        return v


class ProductoRetail(BaseModel):
    """Validación para productos retail argentinos"""
    
    nombre: str = Field(..., min_length=2, max_length=200, description="Nombre del producto")
    codigo_barras: Optional[str] = Field(None, description="Código EAN-13/UPC")
    precio_ars: Decimal = Field(..., ge=0.01, description="Precio en pesos argentinos") 
    categoria: str = Field(..., min_length=1, max_length=50, description="Categoría del producto")
    stock_minimo: int = Field(default=0, ge=0, description="Stock mínimo de alerta")
    proveedor: Optional[str] = Field(None, max_length=100, description="Proveedor principal")
    
    @validator('codigo_barras')
    def validate_codigo_barras(cls, v):
        """Validar formato EAN-13 o UPC-A"""
        if v is None:
            return v
            
        # Remover espacios y guiones
        codigo = re.sub(r'[-\s]', '', v)
        
        # Validar formato EAN-13 (13 dígitos) o UPC-A (12 dígitos)
        if not re.match(r'^\d{12,14}$', codigo):
            raise ValueError("Código de barras debe ser EAN-13 (13 dígitos) o UPC-A (12 dígitos)")
            
        # Validar dígito verificador para EAN-13
        if len(codigo) == 13:
            if not cls._validate_ean13_checksum(codigo):
                raise ValueError("Código EAN-13 tiene dígito verificador inválido")
                
        return codigo
    
    @staticmethod
    def _validate_ean13_checksum(codigo: str) -> bool:
        """Validar dígito verificador EAN-13"""
        if len(codigo) != 13:
            return False
            
        # Algoritmo EAN-13
        suma = 0
        for i, digit in enumerate(codigo[:-1]):
            peso = 1 if i % 2 == 0 else 3
            suma += int(digit) * peso
            
        checksum = (10 - (suma % 10)) % 10
        return checksum == int(codigo[-1])
    
    @validator('precio_ars')
    def validate_precio_argentino(cls, v):
        """Validar precios razonables en contexto argentino"""
        if v < Decimal('0.01'):
            raise ValueError("Precio debe ser mayor a $0.01 ARS")
            
        if v > Decimal('9999999.99'):
            raise ValueError("Precio excede límite máximo ($9,999,999.99 ARS)")
            
        # Redondear a 2 decimales (centavos)
        return v.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    @validator('categoria')
    def validate_categoria_retail(cls, v):
        """Validar categorías típicas de retail argentino"""
        categorias_validas = [
            'Almacén', 'Bebidas', 'Lacteos', 'Carnes', 'Verduras', 'Frutas',
            'Panadería', 'Limpieza', 'Perfumería', 'Kiosco', 'Mascotas',
            'Electrodomésticos', 'Textil', 'Juguetes', 'Librería', 'Farmacia'
        ]
        
        if v not in categorias_validas:
            # Permitir otras categorías pero log warning
            import logging
            logging.warning(f"Categoría no estándar: {v}. Considerar usar: {', '.join(categorias_validas[:5])}...")
        
        return v.title()  # Capitalizar primera letra


class TransferenciaDeposito(BaseModel):
    """Validación para transferencias entre depósitos"""
    
    producto_id: int = Field(..., gt=0)
    cantidad: int = Field(..., gt=0)
    deposito_origen_id: int = Field(..., gt=0)
    deposito_destino_id: int = Field(..., gt=0)
    observaciones: Optional[str] = Field(None, max_length=500)
    fecha_programada: Optional[date] = Field(None, description="Fecha programada para transferencia")
    
    @validator('deposito_destino_id')
    def validate_depositos_diferentes(cls, v, values):
        """Origen y destino deben ser diferentes"""
        if 'deposito_origen_id' in values and v == values['deposito_origen_id']:
            raise ValueError("Depósito origen y destino deben ser diferentes")
        return v
    
    @validator('fecha_programada')
    def validate_fecha_futura(cls, v):
        """Fecha programada no puede ser en el pasado"""
        if v is not None and v < date.today():
            raise ValueError("Fecha programada no puede ser anterior a hoy")
        return v


class ConfiguracionInflacion(BaseModel):
    """Configuración específica para contexto inflacionario argentino"""
    
    inflacion_mensual: float = Field(default=4.5, ge=0.0, le=50.0, description="Inflación mensual %")
    alerta_precio_desactualizado_dias: int = Field(default=30, ge=7, le=365)
    factor_ajuste_automatico: bool = Field(default=False, description="Aplicar ajuste automático de precios")
    
    @validator('inflacion_mensual')
    def validate_inflacion_realista(cls, v):
        """Validar inflación en rango realista para Argentina"""
        if v > 30.0:
            import logging
            logging.warning(f"Inflación mensual muy alta: {v}%. Verificar si es correcto.")
        return v


class FacturaOCR(BaseModel):
    """Validación para procesamiento OCR de facturas"""
    
    tipo_comprobante: Literal["FACTURA_A", "FACTURA_B", "FACTURA_C", "TICKET", "REMITO"]
    numero_comprobante: str = Field(..., min_length=1, max_length=50)
    cuit_emisor: Optional[str] = Field(None, description="CUIT del emisor")
    fecha_emision: date
    importe_total: Decimal = Field(..., gt=0)
    confianza_ocr: float = Field(..., ge=0.0, le=1.0, description="Nivel de confianza OCR")
    
    @validator('cuit_emisor')
    def validate_cuit_formato(cls, v):
        """Validar formato CUIT argentino"""
        if v is None:
            return v
            
        # Remover guiones y espacios
        cuit = re.sub(r'[-\s]', '', v)
        
        # Validar formato 11 dígitos
        if not re.match(r'^\d{11}$', cuit):
            raise ValueError("CUIT debe tener 11 dígitos")
            
        # Validar dígito verificador CUIT
        if not cls._validate_cuit_checksum(cuit):
            raise ValueError("CUIT tiene dígito verificador inválido")
            
        return f"{cuit[:2]}-{cuit[2:10]}-{cuit[10]}"  # Formato XX-XXXXXXXX-X
    
    @staticmethod
    def _validate_cuit_checksum(cuit: str) -> bool:
        """Validar dígito verificador CUIT"""
        if len(cuit) != 11:
            return False
            
        # Algoritmo CUIT
        multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
        suma = sum(int(cuit[i]) * mult for i, mult in enumerate(multiplicadores))
        
        resto = suma % 11
        if resto < 2:
            dv = resto
        else:
            dv = 11 - resto
            
        return dv == int(cuit[10])
    
    @validator('confianza_ocr')
    def validate_confianza_minima(cls, v):
        """Advertir si confianza OCR es baja"""
        if v < 0.7:
            import logging
            logging.warning(f"Confianza OCR baja ({v:.2%}). Revisar manualmente.")
        return v


# Funciones de validación específicas del dominio

def validar_stock_suficiente(stock_actual: int, cantidad_requerida: int, producto_nombre: str = "") -> bool:
    """
    Validar que hay stock suficiente para una operación
    """
    if stock_actual < cantidad_requerida:
        raise ValueError(
            f"Stock insuficiente para {producto_nombre}. "
            f"Disponible: {stock_actual}, Requerido: {cantidad_requerida}"
        )
    return True


def validar_precio_actualizado(fecha_ultima_actualizacion: datetime, max_dias: int = 30) -> bool:
    """
    Validar que el precio no esté desactualizado (contexto inflacionario argentino)
    """
    from datetime import datetime, timedelta
    
    dias_transcurridos = (datetime.now() - fecha_ultima_actualizacion).days
    
    if dias_transcurridos > max_dias:
        import logging
        logging.warning(
            f"Precio posiblemente desactualizado. "
            f"Última actualización hace {dias_transcurridos} días. "
            f"Considerar actualizar por inflación."
        )
        return False
    
    return True


def calcular_precio_con_inflacion(precio_base: Decimal, inflacion_mensual: float, meses: int) -> Decimal:
    """
    Calcular precio ajustado por inflación (específico para contexto argentino)
    """
    factor_inflacion = (1 + inflacion_mensual/100) ** meses
    precio_ajustado = precio_base * Decimal(str(factor_inflacion))
    
    return precio_ajustado.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


# Constantes específicas del retail argentino
CATEGORIAS_RETAIL_ARGENTINA = [
    'Almacén', 'Bebidas', 'Lacteos', 'Carnes', 'Verduras', 'Frutas',
    'Panadería', 'Limpieza', 'Perfumería', 'Kiosco', 'Mascotas',
    'Electrodomésticos', 'Textil', 'Juguetes', 'Librería', 'Farmacia'
]

TIPOS_COMPROBANTE_ARGENTINA = [
    'FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'NOTA_CREDITO_A', 
    'NOTA_CREDITO_B', 'NOTA_CREDITO_C', 'REMITO', 'TICKET'
]

# Thresholds para alertas
STOCK_CRITICO_DIAS = 7  # Días de stock crítico
INFLACION_ALERTA_MENSUAL = 10.0  # % inflación mensual que dispara alerta
CONFIANZA_OCR_MINIMA = 0.75  # Confianza mínima para auto-procesamiento OCR