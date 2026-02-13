import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="space-y-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900">Página no encontrada</h1>
      <p className="text-gray-600">La ruta solicitada no existe o ya no está disponible.</p>
      <Link
        to="/"
        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Volver al dashboard
      </Link>
    </div>
  )
}
