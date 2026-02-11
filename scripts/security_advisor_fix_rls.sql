-- Enable RLS for critical tables (only if Security Advisor indicates they are public)

ALTER TABLE public.stock_deposito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_deposito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios_historicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_faltantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_tareas ENABLE ROW LEVEL SECURITY;
