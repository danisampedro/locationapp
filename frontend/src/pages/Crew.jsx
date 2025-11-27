import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import axios, { API_URL } from '../config/axios.js'

export default function Crew() {
  const [crew, setCrew] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    fechaNacimiento: '',
    carnetConducir: false,
    rol: '',
    email: '',
    telefono: '',
    notas: '',
    foto: null
  })
  const [editingMember, setEditingMember] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadCrew()
  }, [])

  const loadCrew = async () => {
    try {
      const response = await axios.get(`${API_URL}/crew`, { withCredentials: true })
      setCrew(response.data)
    } catch (error) {
      console.error('Error cargando crew:', error)
    }
  }

  const onDropFoto = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFormData({ ...formData, foto: acceptedFiles[0] })
    }
  }

  const { getRootProps: getFotoRootProps, getInputProps: getFotoInputProps, isDragActive: isFotoDragActive } = useDropzone({
    onDrop: onDropFoto,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  })

  const removeFoto = () => {
    setFormData({ ...formData, foto: null })
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setFormData({
      nombre: member.nombre || '',
      dni: member.dni || '',
      fechaNacimiento: member.fechaNacimiento ? member.fechaNacimiento.slice(0, 10) : '',
      carnetConducir: member.carnetConducir || false,
      rol: member.rol || '',
      email: member.email || '',
      telefono: member.telefono || '',
      notas: member.notas || '',
      foto: null
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSubmitting(true)

    try {
      const data = new FormData()
      data.append('nombre', formData.nombre)
      data.append('dni', formData.dni)
      if (formData.fechaNacimiento) {
        data.append('fechaNacimiento', formData.fechaNacimiento)
      }
      data.append('carnetConducir', formData.carnetConducir)
      data.append('rol', formData.rol)
      data.append('email', formData.email)
      data.append('telefono', formData.telefono)
      data.append('notas', formData.notas)
      if (formData.foto) {
        data.append('foto', formData.foto)
      }

      const response = await axios.put(
        `${API_URL}/crew/${editingMember.id}`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
          withCredentials: true
        }
      )

      if (response.status === 200) {
        setShowEditModal(false)
        setEditingMember(null)
        setFormData({ nombre: '', dni: '', fechaNacimiento: '', carnetConducir: false, rol: '', email: '', telefono: '', notas: '', foto: null })
        await loadCrew()
        alert('Miembro del crew actualizado exitosamente')
      }
    } catch (error) {
      console.error('Error actualizando crew:', error)
      alert(`Error: ${error.response?.data?.error || error.message || 'Error al actualizar el miembro del crew'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (memberId, memberName) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a "${memberName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await axios.delete(`${API_URL}/crew/${memberId}`, { withCredentials: true })
      await loadCrew()
      alert('Miembro del crew eliminado exitosamente')
    } catch (error) {
      console.error('Error eliminando crew:', error)
      alert(`Error: ${error.response?.data?.error || error.message || 'Error al eliminar el miembro del crew'}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('handleSubmit llamado', formData)
    
    setIsSubmitting(true)
    
    try {
      const data = new FormData()
      data.append('nombre', formData.nombre)
      data.append('dni', formData.dni)
      if (formData.fechaNacimiento) {
        data.append('fechaNacimiento', formData.fechaNacimiento)
      }
      data.append('carnetConducir', formData.carnetConducir)
      data.append('rol', formData.rol)
      data.append('email', formData.email)
      data.append('telefono', formData.telefono)
      data.append('notas', formData.notas)
      if (formData.foto) {
        data.append('foto', formData.foto)
      }

      console.log('Enviando petición a:', `${API_URL}/crew`)
      
      const response = await axios.post(
        `${API_URL}/crew`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
          withCredentials: true
        }
      )
      
      console.log('Respuesta recibida:', response)
      
      if (response.status === 201 || response.status === 200) {
        console.log('Crew creado exitosamente:', response.data)
        setShowModal(false)
        setFormData({ nombre: '', dni: '', fechaNacimiento: '', carnetConducir: false, rol: '', email: '', telefono: '', notas: '', foto: null })
        await loadCrew()
        console.log('Crew recargado')
      } else {
        throw new Error('Respuesta inesperada del servidor')
      }
    } catch (error) {
      console.error('Error creando crew:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Error al crear el miembro del crew'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Crew</h1>
          <p className="text-gray-500 mt-1 text-sm">Gestiona todos los miembros de tu equipo</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true)
            setFormData({ nombre: '', dni: '', fechaNacimiento: '', carnetConducir: false, rol: '', email: '', telefono: '', notas: '', foto: null })
          }}
          className="bg-dark-blue text-white px-5 py-2.5 rounded-lg hover:bg-dark-blue-light transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Miembro
        </button>
      </div>

      {crew.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay miembros del crew aún</h3>
          <p className="text-gray-500 mb-6">Añade tu primer miembro del equipo para comenzar</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-dark-blue text-white px-5 py-2.5 rounded-lg hover:bg-dark-blue-light transition-colors"
          >
            Añadir primer miembro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crew.map((member) => (
            <div 
              key={member.id} 
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-shadow border border-gray-100 hover:border-accent-green/40"
            >
              {member.fotoUrl && (
                <div className="w-full aspect-square overflow-hidden">
                  <img
                    src={member.fotoUrl}
                    alt={member.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">{member.nombre}</h2>
                    {member.rol && (
                      <p className="text-xs text-gray-600 mb-2">
                        <span className="font-semibold text-gray-800">Rol: </span>
                        {member.rol}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(member)}
                      className="p-1.5 text-gray-600 hover:text-dark-blue hover:bg-gray-100 rounded transition-colors"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(member.id, member.nombre)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {member.dni && (
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">DNI: </span>
                    {member.dni}
                  </p>
                )}
                {member.fechaNacimiento && (
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">Fecha de nacimiento: </span>
                    {new Date(member.fechaNacimiento).toLocaleDateString('es-ES')}
                  </p>
                )}
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">Carnet de conducir: </span>
                  {member.carnetConducir ? (
                    <span className="text-green-600 font-medium">Sí</span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </p>
                {member.email && (
                  <p className="text-xs text-gray-600 truncate">
                    <span className="font-semibold text-gray-800">Email: </span>
                    {member.email}
                  </p>
                )}
                {member.telefono && (
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">Teléfono: </span>
                    {member.telefono}
                  </p>
                )}
                {member.notas && (
                  <p className="text-sm text-gray-500 line-clamp-2 mt-2">{member.notas}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Crear */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">Nuevo Miembro del Crew</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Foto
                </label>
                {formData.foto ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(formData.foto)}
                      alt="Foto preview"
                      className="w-32 h-32 object-cover rounded-lg mb-2"
                    />
                    <button
                      type="button"
                      onClick={removeFoto}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    {...getFotoRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isFotoDragActive ? 'border-accent-green bg-accent-green/10' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getFotoInputProps()} />
                    {isFotoDragActive ? (
                      <p className="text-accent-green">Suelta la foto aquí...</p>
                    ) : (
                      <p className="text-gray-600">
                        Arrastra la foto aquí o haz clic para seleccionar
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">DNI</label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="12345678A"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.carnetConducir}
                    onChange={(e) => setFormData({ ...formData, carnetConducir: e.target.checked })}
                    className="w-4 h-4 text-dark-blue border-gray-300 rounded focus:ring-dark-blue"
                  />
                  <span className="text-gray-700">Tiene carnet de conducir</span>
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Rol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="+34 123 456 789"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  rows="3"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-dark-blue text-white px-6 py-2 rounded-lg hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creando...' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowEditModal(false)
          setEditingMember(null)
          setFormData({ nombre: '', dni: '', fechaNacimiento: '', carnetConducir: false, rol: '', email: '', telefono: '', notas: '', foto: null })
        }}>
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">Editar Miembro del Crew</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Foto</label>
                {formData.foto ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(formData.foto)}
                      alt="Foto preview"
                      className="w-32 h-32 object-cover rounded-lg mb-2"
                    />
                    <button
                      type="button"
                      onClick={removeFoto}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : editingMember.fotoUrl ? (
                  <div className="relative">
                    <img
                      src={editingMember.fotoUrl}
                      alt="Foto actual"
                      className="w-32 h-32 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-500 mb-2">Foto actual (deja vacío para mantener)</p>
                    <div
                      {...getFotoRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        isFotoDragActive ? 'border-accent-green bg-accent-green/10' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input {...getFotoInputProps()} />
                      {isFotoDragActive ? (
                        <p className="text-accent-green text-sm">Suelta la foto aquí...</p>
                      ) : (
                        <p className="text-gray-600 text-sm">Arrastra nueva foto o haz clic para seleccionar</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    {...getFotoRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isFotoDragActive ? 'border-accent-green bg-accent-green/10' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getFotoInputProps()} />
                    {isFotoDragActive ? (
                      <p className="text-accent-green">Suelta la foto aquí...</p>
                    ) : (
                      <p className="text-gray-600">Arrastra la foto aquí o haz clic para seleccionar</p>
                    )}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">DNI</label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="12345678A"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.carnetConducir}
                    onChange={(e) => setFormData({ ...formData, carnetConducir: e.target.checked })}
                    className="w-4 h-4 text-dark-blue border-gray-300 rounded focus:ring-dark-blue"
                  />
                  <span className="text-gray-700">Tiene carnet de conducir</span>
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Rol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  placeholder="+34 123 456 789"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-blue"
                  rows="3"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-dark-blue text-white px-6 py-2 rounded-lg hover:bg-dark-blue-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingMember(null)
                    setFormData({ nombre: '', dni: '', fechaNacimiento: '', carnetConducir: false, rol: '', email: '', telefono: '', notas: '', foto: null })
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
