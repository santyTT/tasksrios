import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { userService } from "../services/userService";
import { companyService } from "../services/companyService";
import { areaService } from "../services/areaService";
import "./styles/ModalAddTask.css";

const CreateTaskModal = ({ onClose, onSave, editTask = null }) => {
  const [formData, setFormData] = useState(
    editTask || {
      title: "",
      observation: "",
      assigned_to: "",
      company_id: "",
      area_id: "",
      dueDate: "",
      status: "in_progress",
      createdAt: new Date().toISOString(), 
    }
  );

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoading(true);
        const [usersData, companiesData, areasData] = await Promise.all([
          userService.getAllUsers(),
          companyService.getAllCompanies(),
          areaService.getAllAreas(),
        ]);

        setUsers(usersData);
        setCompanies(companiesData);
        setAreas(areasData);
        setError(null);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos necesarios");
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (
      !formData.title ||
      !formData.observation ||
      !formData.assigned_to ||
      !formData.company_id ||
      !formData.area_id ||
      !formData.dueDate
    ) {
      alert("Todos los campos son obligatorios.");
      return;
    }
  
    try {
      const response = await onSave(formData);
      console.log("Respuesta del servidor:", response);
  
      if (response && response.task) {
        console.log("Tarea creada/actualizada:", response.task);
        setFormData(response.task); 
      }
  
      onClose();
    } catch (error) {
      console.error("Error al guardar la tarea:", error);
      alert("Ocurrió un error al procesar la solicitud.");
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    console.log(`${name} actualizado:`, value); 
  };

  if (loading) return <div className="loading">Cargando datos...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <div className="backdrop" onClick={onClose}></div>
      <div className="modal-create-task">
        <h2>{editTask ? "Editar Tarea" : "Crear Nueva Tarea"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título: *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Asignar a: *</label>
            <select
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar usuario</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Empresa: *</label>
            <select
              name="company_id"
              value={formData.company_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar empresa</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} - Tipo {company.companyType}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Área: *</label>
            <select
              name="area_id"
              value={formData.area_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar área</option>
              {areas.map((area) => (
                <option key={area.id_area} value={area.id_area}>
                  {area.nombre_area} - {area.departamento}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Fecha límite: *</label>
            <input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Descripción: *</label>
            <textarea
              name="observation"
              value={formData.observation}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <div className="button-group">
            <button type="submit">
              {editTask ? "Guardar Cambios" : "Crear Tarea"}
            </button>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

CreateTaskModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  editTask: PropTypes.object,
};

export default CreateTaskModal;
