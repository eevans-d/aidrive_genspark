-- CRIT-03: Atomic reservation cancellation with row-level locking
-- Prevents race conditions on concurrent cancellation requests

CREATE OR REPLACE FUNCTION sp_cancelar_reserva(
    p_reserva_id UUID,
    p_usuario UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reserva RECORD;
    v_result JSONB;
BEGIN
    -- Lock the row to prevent concurrent modifications
    SELECT *
    INTO v_reserva
    FROM stock_reservado
    WHERE id = p_reserva_id
    FOR UPDATE;

    -- Check if reservation exists
    IF v_reserva IS NULL THEN
        RAISE EXCEPTION 'RESERVA_NOT_FOUND: Reserva % no encontrada', p_reserva_id;
    END IF;

    -- Check if reservation is in a cancellable state
    IF v_reserva.estado <> 'activa' THEN
        RAISE EXCEPTION 'RESERVA_NOT_ACTIVE: Reserva % tiene estado %, solo se pueden cancelar reservas activas',
            p_reserva_id, v_reserva.estado;
    END IF;

    -- Cancel the reservation atomically
    UPDATE stock_reservado
    SET
        estado = 'cancelada',
        fecha_cancelacion = NOW(),
        updated_at = NOW()
    WHERE id = p_reserva_id;

    -- Build result
    v_result := jsonb_build_object(
        'id', v_reserva.id,
        'producto_id', v_reserva.producto_id,
        'cantidad', v_reserva.cantidad,
        'estado_anterior', v_reserva.estado,
        'estado_nuevo', 'cancelada',
        'cancelado_por', p_usuario,
        'fecha_cancelacion', NOW()
    );

    RETURN v_result;
END;
$$;

-- Grant execute to authenticated users (RLS on stock_reservado still applies for reads)
GRANT EXECUTE ON FUNCTION sp_cancelar_reserva(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sp_cancelar_reserva(UUID, UUID) TO service_role;
