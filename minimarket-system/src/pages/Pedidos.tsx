/**
 * Página de Gestión de Pedidos
 * @description Permite crear, ver y gestionar pedidos de clientes
 */

import { useState } from 'react';
import {
        usePedidos,
        useCreatePedido,
        useUpdateEstadoPedido,
        useUpdateItemPreparado,
        type PedidosFilters
} from '../hooks/queries/usePedidos';
import {
        PedidoResponse,
        PedidoItem,
        CreatePedidoParams,
        productosApi,
        DropdownItem
} from '../lib/apiClient';
import { useQuery } from '@tanstack/react-query';
import { SkeletonTable, SkeletonText } from '../components/Skeleton';
import { ErrorMessage } from '../components/ErrorMessage';
import { parseErrorMessage, detectErrorType, extractRequestId } from '../components/errorMessageUtils';
import { toast } from 'sonner';
import { money } from '../utils/currency';

// ============================================================================
// Componente principal
// ============================================================================

export default function Pedidos() {
        const [filters, setFilters] = useState<PedidosFilters>({ estado: 'todos' });
        const [showForm, setShowForm] = useState(false);
        const [selectedPedido, setSelectedPedido] = useState<PedidoResponse | null>(null);

        const { data, isLoading, isFetching, error, refetch } = usePedidos(filters);
        const createMutation = useCreatePedido();
        const updateEstadoMutation = useUpdateEstadoPedido();
        const updateItemMutation = useUpdateItemPreparado();

        // Obtener productos para el dropdown
        const { data: productos = [] } = useQuery({
                queryKey: ['productos', 'dropdown'],
                queryFn: () => productosApi.dropdown(),
        });

        const handleCreatePedido = async (pedidoData: CreatePedidoParams) => {
                try {
                        await createMutation.mutateAsync(pedidoData);
                        setShowForm(false);
                        refetch();
                } catch (err) {
                        toast.error(parseErrorMessage(err, import.meta.env.PROD));
                }
        };

        const handleUpdateEstado = async (id: string, estado: PedidoResponse['estado']) => {
                try {
                        await updateEstadoMutation.mutateAsync({ id, estado });
                        refetch();
                } catch (err) {
                        toast.error(parseErrorMessage(err, import.meta.env.PROD));
                }
        };

        const handleToggleItemPreparado = async (itemId: string, preparado: boolean) => {
                try {
                        await updateItemMutation.mutateAsync({ itemId, preparado });
                        refetch();
                } catch (err) {
                        toast.error(parseErrorMessage(err, import.meta.env.PROD));
                }
        };

        if (isLoading) {
                return (
                        <div className="space-y-6">
                                <SkeletonText width="w-48" className="h-8" />
                                <SkeletonText width="w-72" className="h-4" />
                                <SkeletonTable />
                        </div>
                );
        }

        if (error) {
                return (
                        <div className="p-4">
                                <ErrorMessage
                                        message={parseErrorMessage(error, import.meta.env.PROD)}
                                        type={detectErrorType(error)}
                                        onRetry={() => refetch()}
                                        isRetrying={isFetching}
                                        requestId={extractRequestId(error)}
                                />
                        </div>
                );
        }

        return (
                <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                                <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
                                        <p className="text-gray-500 mt-1">
                                                {data?.total || 0} pedidos • {data?.pendientes || 0} pendientes • {data?.listos || 0} listos
                                        </p>
                                </div>
                                <button
                                        onClick={() => setShowForm(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                        + Nuevo Pedido
                                </button>
                        </div>

                        {/* Filtros */}
                        <div className="flex gap-4 flex-wrap">
                                {(['todos', 'pendiente', 'preparando', 'listo', 'entregado'] as const).map((estado) => (
                                        <button
                                                key={estado}
                                                onClick={() => setFilters({ ...filters, estado })}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filters.estado === estado
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                        >
                                                {estado === 'todos' ? 'Todos' : estado.charAt(0).toUpperCase() + estado.slice(1)}
                                        </button>
                                ))}
                        </div>

                        {/* Lista de pedidos */}
                        <div className="grid gap-4">
                                {data?.pedidos.map((pedido) => (
                                        <PedidoCard
                                                key={pedido.id}
                                                pedido={pedido}
                                                onUpdateEstado={handleUpdateEstado}
                                                onToggleItem={handleToggleItemPreparado}
                                                onSelect={() => setSelectedPedido(pedido)}
                                        />
                                ))}
                                {data?.pedidos.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                                No hay pedidos para mostrar
                                        </div>
                                )}
                        </div>

                        {/* Modal de nuevo pedido */}
                        {showForm && (
                                <NuevoPedidoModal
                                        productos={productos}
                                        onSubmit={handleCreatePedido}
                                        onClose={() => setShowForm(false)}
                                        isLoading={createMutation.isPending}
                                />
                        )}

                        {/* Modal de detalle */}
                        {selectedPedido && (
                                <DetallePedidoModal
                                        pedido={selectedPedido}
                                        onClose={() => setSelectedPedido(null)}
                                        onUpdateEstado={handleUpdateEstado}
                                        onToggleItem={handleToggleItemPreparado}
                                />
                        )}
                </div>
        );
}

// ============================================================================
// PedidoCard
// ============================================================================

interface PedidoCardProps {
        pedido: PedidoResponse;
        onUpdateEstado: (id: string, estado: PedidoResponse['estado']) => void;
        onToggleItem: (itemId: string, preparado: boolean) => void;
        onSelect: () => void;
}

function PedidoCard({ pedido, onUpdateEstado, onToggleItem, onSelect }: PedidoCardProps) {
        const estadoColors: Record<string, string> = {
                pendiente: 'bg-yellow-100 text-yellow-800',
                preparando: 'bg-blue-100 text-blue-800',
                listo: 'bg-green-100 text-green-800',
                entregado: 'bg-gray-100 text-gray-800',
                cancelado: 'bg-red-100 text-red-800',
        };

        const pagoColors: Record<string, string> = {
                pendiente: 'bg-red-100 text-red-800',
                parcial: 'bg-orange-100 text-orange-800',
                pagado: 'bg-green-100 text-green-800',
        };

        const itemsPreparados = pedido.detalle_pedidos?.filter(i => i.preparado).length || 0;
        const totalItems = pedido.detalle_pedidos?.length || 0;

        return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                                <div>
                                        <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-lg">#{pedido.numero_pedido}</h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColors[pedido.estado]}`}>
                                                        {pedido.estado.toUpperCase()}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${pagoColors[pedido.estado_pago]}`}>
                                                        {pedido.estado_pago === 'pagado' ? '✓ Pagado' : pedido.estado_pago === 'parcial' ? 'Parcial' : 'Sin pagar'}
                                                </span>
                                        </div>
                                        <p className="text-gray-600 mt-1">{pedido.cliente_nombre}</p>
                                        {pedido.cliente_telefono && (
                                                <p className="text-gray-500 text-sm">{pedido.cliente_telefono}</p>
                                        )}
                                </div>
                                <div className="text-right">
                                        <p className="font-bold text-xl">${money(pedido.monto_total)}</p>
                                        <p className="text-sm text-gray-500">
                                                {pedido.tipo_entrega === 'domicilio' ? '🚚 Envío' : '🏪 Retira'}
                                        </p>
                                </div>
                        </div>

                        {/* Progreso de preparación */}
                        <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Preparación</span>
                                        <span>{itemsPreparados}/{totalItems} items</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                                className="h-full bg-green-500 transition-all"
                                                style={{ width: `${totalItems > 0 ? (itemsPreparados / totalItems) * 100 : 0}%` }}
                                        />
                                </div>
                        </div>

                        {/* Items del pedido (checklist) */}
                        {pedido.detalle_pedidos && pedido.detalle_pedidos.length > 0 && (
                                <div className="space-y-2 mb-4">
                                        {pedido.detalle_pedidos.slice(0, 3).map((item) => (
                                                <div
                                                        key={item.id}
                                                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                                                >
                                                        <input
                                                                type="checkbox"
                                                                checked={item.preparado}
                                                                onChange={() => item.id && onToggleItem(item.id, !item.preparado)}
                                                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className={item.preparado ? 'line-through text-gray-400' : ''}>
                                                                {item.cantidad}x {item.producto_nombre}
                                                        </span>
                                                        {item.observaciones && (
                                                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                                        {item.observaciones}
                                                                </span>
                                                        )}
                                                </div>
                                        ))}
                                        {pedido.detalle_pedidos.length > 3 && (
                                                <button
                                                        onClick={onSelect}
                                                        className="text-blue-600 text-sm hover:underline"
                                                >
                                                        +{pedido.detalle_pedidos.length - 3} más...
                                                </button>
                                        )}
                                </div>
                        )}

                        {/* Observaciones */}
                        {pedido.observaciones && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
                                        <strong>📝 Obs:</strong> {pedido.observaciones}
                                </div>
                        )}

                        {/* Datos de entrega */}
                        {pedido.tipo_entrega === 'domicilio' && pedido.direccion_entrega && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
                                        <strong>📍 Entregar en:</strong> {pedido.direccion_entrega}
                                        {pedido.edificio && ` - Edificio ${pedido.edificio}`}
                                        {pedido.piso && ` - Piso ${pedido.piso}`}
                                        {pedido.departamento && ` - Dpto ${pedido.departamento}`}
                                        {pedido.horario_entrega_preferido && (
                                                <span className="block mt-1">🕐 {pedido.horario_entrega_preferido}</span>
                                        )}
                                </div>
                        )}

                        {/* Acciones */}
                        <div className="flex gap-2 mt-4">
                                {pedido.estado === 'pendiente' && (
                                        <button
                                                onClick={() => onUpdateEstado(pedido.id, 'preparando')}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                                        >
                                                Comenzar Preparación
                                        </button>
                                )}
                                {pedido.estado === 'preparando' && itemsPreparados === totalItems && (
                                        <button
                                                onClick={() => {
                                                        if (!window.confirm('¿Marcar pedido como listo? Esta acción no se puede deshacer.')) return;
                                                        onUpdateEstado(pedido.id, 'listo');
                                                }}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
                                        >
                                                Marcar como Listo
                                        </button>
                                )}
                                {pedido.estado === 'listo' && (
                                        <button
                                                onClick={() => {
                                                        if (!window.confirm('¿Marcar pedido como entregado? Esta acción no se puede deshacer.')) return;
                                                        onUpdateEstado(pedido.id, 'entregado');
                                                }}
                                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition-colors"
                                        >
                                                Marcar Entregado
                                        </button>
                                )}
                                <button
                                        onClick={onSelect}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                        Ver Detalles
                                </button>
                        </div>
                </div>
        );
}

// ============================================================================
// NuevoPedidoModal
// ============================================================================

interface NuevoPedidoModalProps {
        productos: DropdownItem[];
        onSubmit: (data: CreatePedidoParams) => void;
        onClose: () => void;
        isLoading: boolean;
}

function NuevoPedidoModal({ productos, onSubmit, onClose, isLoading }: NuevoPedidoModalProps) {
        const [formData, setFormData] = useState<{
                cliente_nombre: string;
                cliente_telefono: string;
                tipo_entrega: 'retiro' | 'domicilio';
                direccion_entrega: string;
                edificio: string;
                piso: string;
                departamento: string;
                horario_entrega_preferido: string;
                observaciones: string;
        }>({
                cliente_nombre: '',
                cliente_telefono: '',
                tipo_entrega: 'retiro',
                direccion_entrega: '',
                edificio: '',
                piso: '',
                departamento: '',
                horario_entrega_preferido: '',
                observaciones: '',
        });

        const [items, setItems] = useState<CreatePedidoParams['items']>([]);
        const [newItem, setNewItem] = useState({
                producto_id: '',
                producto_nombre: '',
                cantidad: 1,
                precio_unitario: 0,
                observaciones: '',
        });

        const handleAddItem = () => {
                if (!newItem.producto_nombre || newItem.cantidad <= 0) return;
                if (newItem.precio_unitario <= 0) {
                        toast.error('El precio unitario debe ser mayor a 0');
                        return;
                }

                setItems([...items, { ...newItem }]);
                setNewItem({ producto_id: '', producto_nombre: '', cantidad: 1, precio_unitario: 0, observaciones: '' });
        };

        const handleRemoveItem = (index: number) => {
                setItems(items.filter((_, i) => i !== index));
        };

        const handleSelectProducto = (productoId: string) => {
                const producto = productos.find(p => p.id === productoId);
                if (producto) {
                        setNewItem({
                                ...newItem,
                                producto_id: producto.id,
                                producto_nombre: producto.nombre,
                                precio_unitario: typeof producto.precio_actual === 'number' ? producto.precio_actual : 0,
                        });
                }
        };

        const handleSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                if (!formData.cliente_nombre || items.length === 0) return;

                onSubmit({
                        ...formData,
                        items,
                });
        };

        const totalPedido = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

        return (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Nuevo pedido">
                                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                                        <h2 className="text-xl font-bold">Nuevo Pedido</h2>
                                        <button onClick={onClose} className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-2xl" aria-label="Cerrar">×</button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                        {/* Datos del cliente */}
                                        <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Nombre del cliente *
                                                        </label>
                                                        <input
                                                                type="text"
                                                                value={formData.cliente_nombre}
                                                                onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                required
                                                        />
                                                </div>
                                                <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Teléfono
                                                        </label>
                                                        <input
                                                                type="tel"
                                                                value={formData.cliente_telefono}
                                                                onChange={(e) => setFormData({ ...formData, cliente_telefono: e.target.value })}
                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                </div>
                                        </div>

                                        {/* Tipo de entrega */}
                                        <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de entrega</label>
                                                <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                        type="radio"
                                                                        value="retiro"
                                                                        checked={formData.tipo_entrega === 'retiro'}
                                                                        onChange={() => setFormData({ ...formData, tipo_entrega: 'retiro' })}
                                                                        className="text-blue-600"
                                                                />
                                                                🏪 Retira en local
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                        type="radio"
                                                                        value="domicilio"
                                                                        checked={formData.tipo_entrega === 'domicilio'}
                                                                        onChange={() => setFormData({ ...formData, tipo_entrega: 'domicilio' })}
                                                                        className="text-blue-600"
                                                                />
                                                                🚚 Envío a domicilio
                                                        </label>
                                                </div>
                                        </div>

                                        {/* Datos de entrega (si es domicilio) */}
                                        {formData.tipo_entrega === 'domicilio' && (
                                                <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                                                        <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                                                                <input
                                                                        type="text"
                                                                        value={formData.direccion_entrega}
                                                                        onChange={(e) => setFormData({ ...formData, direccion_entrega: e.target.value })}
                                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                                        required={formData.tipo_entrega === 'domicilio'}
                                                                />
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-4">
                                                                <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Edificio</label>
                                                                        <input
                                                                                type="text"
                                                                                value={formData.edificio}
                                                                                onChange={(e) => setFormData({ ...formData, edificio: e.target.value })}
                                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                                        />
                                                                </div>
                                                                <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Piso</label>
                                                                        <input
                                                                                type="text"
                                                                                value={formData.piso}
                                                                                onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                                        />
                                                                </div>
                                                                <div>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dpto</label>
                                                                        <input
                                                                                type="text"
                                                                                value={formData.departamento}
                                                                                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                                        />
                                                                </div>
                                                        </div>
                                                        <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Horario preferido</label>
                                                                <input
                                                                        type="text"
                                                                        value={formData.horario_entrega_preferido}
                                                                        onChange={(e) => setFormData({ ...formData, horario_entrega_preferido: e.target.value })}
                                                                        placeholder="Ej: 18-20hs"
                                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                                />
                                                        </div>
                                                </div>
                                        )}

                                        {/* Agregar productos */}
                                        <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Productos</label>
                                                <div className="flex gap-2 mb-4">
                                                        <select
                                                                value={newItem.producto_id}
                                                                onChange={(e) => handleSelectProducto(e.target.value)}
                                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                                                        >
                                                                <option value="">Seleccionar producto...</option>
                                                                {productos.map((p) => (
                                                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                                                ))}
                                                        </select>
                                                        <input
                                                                type="number"
                                                                value={newItem.cantidad}
                                                                onChange={(e) => setNewItem({ ...newItem, cantidad: parseInt(e.target.value) || 1 })}
                                                                min={1}
                                                                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center"
                                                                placeholder="Cant"
                                                        />
                                                        <input
                                                                type="number"
                                                                value={newItem.precio_unitario}
                                                                onChange={(e) => setNewItem({ ...newItem, precio_unitario: parseFloat(e.target.value) || 0 })}
                                                                min={0}
                                                                className="w-28 border border-gray-300 rounded-lg px-3 py-2"
                                                                placeholder="Precio"
                                                        />
                                                        <button
                                                                type="button"
                                                                onClick={handleAddItem}
                                                                disabled={!newItem.producto_nombre}
                                                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
                                                        >
                                                                +
                                                        </button>
                                                </div>

                                                {/* Lista de items agregados */}
                                                {items.length > 0 && (
                                                        <div className="border rounded-lg divide-y">
                                                                {items.map((item, index) => (
                                                                        <div key={index} className="flex items-center justify-between p-3">
                                                                                <span>{item.cantidad}x {item.producto_nombre}</span>
                                                                                <div className="flex items-center gap-4">
                                                                                        <span className="font-medium">${money(item.cantidad * item.precio_unitario)}</span>
                                                                                        <button
                                                                                                type="button"
                                                                                                onClick={() => handleRemoveItem(index)}
                                                                                                className="text-red-500 hover:text-red-700"
                                                                                        >
                                                                                                ✕
                                                                                        </button>
                                                                                </div>
                                                                        </div>
                                                                ))}
                                                                <div className="flex justify-between p-3 bg-gray-50 font-bold">
                                                                        <span>Total</span>
                                                                        <span>${money(totalPedido)}</span>
                                                                </div>
                                                        </div>
                                                )}
                                        </div>

                                        {/* Observaciones */}
                                        <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                                                <textarea
                                                        value={formData.observaciones}
                                                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                                        rows={3}
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                        placeholder="Instrucciones especiales, alergias, etc."
                                                />
                                        </div>

                                        {/* Botones */}
                                        <div className="flex gap-4">
                                                <button
                                                        type="button"
                                                        onClick={onClose}
                                                        className="flex-1 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50"
                                                >
                                                        Cancelar
                                                </button>
                                                <button
                                                        type="submit"
                                                        disabled={isLoading || items.length === 0 || !formData.cliente_nombre}
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium"
                                                >
                                                        {isLoading ? 'Creando...' : 'Crear Pedido'}
                                                </button>
                                        </div>
                                </form>
                        </div>
                </div>
        );
}

// ============================================================================
// DetallePedidoModal
// ============================================================================

interface DetallePedidoModalProps {
        pedido: PedidoResponse;
        onClose: () => void;
        onUpdateEstado: (id: string, estado: PedidoResponse['estado']) => void;
        onToggleItem: (itemId: string, preparado: boolean) => void;
}

function DetallePedidoModal({ pedido, onClose, onUpdateEstado, onToggleItem }: DetallePedidoModalProps) {
        return (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Detalle del pedido">
                                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                                        <h2 className="text-xl font-bold">Pedido #{pedido.numero_pedido}</h2>
                                        <button onClick={onClose} className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-2xl" aria-label="Cerrar">×</button>
                                </div>

                                <div className="p-6 space-y-6">
                                        {/* Info del cliente */}
                                        <div>
                                                <h3 className="font-semibold text-gray-900 mb-2">Cliente</h3>
                                                <p>{pedido.cliente_nombre}</p>
                                                {pedido.cliente_telefono && <p className="text-gray-500">{pedido.cliente_telefono}</p>}
                                        </div>

                                        {/* Checklist de items */}
                                        <div>
                                                <h3 className="font-semibold text-gray-900 mb-2">Productos</h3>
                                                <div className="space-y-2">
                                                        {pedido.detalle_pedidos?.map((item) => (
                                                                <div
                                                                        key={item.id}
                                                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                                                >
                                                                        <input
                                                                                type="checkbox"
                                                                                checked={item.preparado}
                                                                                onChange={() => item.id && onToggleItem(item.id, !item.preparado)}
                                                                                className="w-5 h-5 rounded border-gray-300 text-blue-600"
                                                                        />
                                                                        <div className="flex-1">
                                                                                <span className={item.preparado ? 'line-through text-gray-400' : ''}>
                                                                                        {item.cantidad}x {item.producto_nombre}
                                                                                </span>
                                                                                {item.observaciones && (
                                                                                        <p className="text-xs text-orange-600 mt-1">{item.observaciones}</p>
                                                                                )}
                                                                        </div>
                                                                        <span className="font-medium">${money(item.subtotal ?? 0)}</span>
                                                                </div>
                                                        ))}
                                                </div>
                                                <div className="flex justify-between mt-4 pt-4 border-t font-bold text-lg">
                                                        <span>Total</span>
                                                        <span>${money(pedido.monto_total)}</span>
                                                </div>
                                        </div>

                                        {/* Datos de entrega */}
                                        {pedido.tipo_entrega === 'domicilio' && (
                                                <div className="bg-blue-50 p-4 rounded-lg">
                                                        <h3 className="font-semibold text-gray-900 mb-2">🚚 Datos de Entrega</h3>
                                                        <p>{pedido.direccion_entrega}</p>
                                                        {pedido.edificio && <p>Edificio: {pedido.edificio}</p>}
                                                        {pedido.piso && <p>Piso: {pedido.piso}</p>}
                                                        {pedido.departamento && <p>Dpto: {pedido.departamento}</p>}
                                                        {pedido.horario_entrega_preferido && (
                                                                <p className="mt-2">🕐 {pedido.horario_entrega_preferido}</p>
                                                        )}
                                                </div>
                                        )}

                                        {/* Observaciones */}
                                        {pedido.observaciones && (
                                                <div className="bg-yellow-50 p-4 rounded-lg">
                                                        <h3 className="font-semibold text-gray-900 mb-2">📝 Observaciones</h3>
                                                        <p>{pedido.observaciones}</p>
                                                </div>
                                        )}
                                </div>
                        </div>
                </div>
        );
}
