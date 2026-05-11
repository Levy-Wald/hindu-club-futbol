import { fetchConfigPublica, fetchCategoriasPublicas } from '../_lib/queries'
import { FormInscripcion } from './_components/form-inscripcion'

export default async function AsociatePage() {
  const [config, categorias] = await Promise.all([
    fetchConfigPublica(),
    fetchCategoriasPublicas(),
  ])

  return (
    <div className="min-h-screen">
      {/* Hero mini */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-900 text-white py-12 sm:py-16 text-center px-4">
        <img
          src="/hindu-logo.png"
          alt="Hindu Club"
          className="h-16 sm:h-20 mx-auto mb-4"
        />
        <h1 className="text-2xl sm:text-3xl font-bold">
          {config?.asociate_titulo || 'Sumate al club'}
        </h1>
        <p className="mt-2 text-white/80 max-w-lg mx-auto">
          {config?.asociate_bajada ||
            'Completa el formulario y nos ponemos en contacto'}
        </p>
      </section>

      {/* Form */}
      <section className="py-8 sm:py-12">
        <FormInscripcion
          categorias={categorias}
          tenantId="11111111-1111-1111-1111-111111111111"
        />
      </section>
    </div>
  )
}
