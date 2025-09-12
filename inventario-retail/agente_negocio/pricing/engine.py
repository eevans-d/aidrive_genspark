"""
Motor de precios con inflación automática argentina
Refactorizado para usar API de AgenteDepósito en lugar de acceso directo a BD
"""
from shared.config import get_settings
from shared.utils import calcular_precio_con_inflacion
from ..integrations.deposito_client import DepositoClient
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

class PricingEngine:
    def __init__(self):
        self.deposito_client = DepositoClient()
        
    async def calcular_precio_inflacion(self, codigo: str, dias_transcurridos: int) -> float:
        """Calcular precio con inflación aplicada usando API de AgenteDepósito"""
        try:
            # ✅ Usar API del AgenteDepósito en lugar de acceso directo
            producto_data = await self.deposito_client.get_producto_by_codigo(codigo)
            if not producto_data:
                raise Exception(f"Producto {codigo} no encontrado")

            # Aplicar inflación sobre precio obtenido vía API
            precio_actualizado = calcular_precio_con_inflacion(
                producto_data['precio_compra'],
                dias_transcurridos,
                settings.INFLACION_MENSUAL
            )

            logger.info(f"Precio actualizado vía API - {codigo}: ${precio_actualizado:.2f}")
            return precio_actualizado

        except Exception as e:
            logger.error(f"Error calculando precio para {codigo}: {e}")
            raise
