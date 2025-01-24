import { useState, useEffect } from "react";
import CreateAreaModal from "../components/CreateAreaModal.jsx";
import { areaService } from "../services/areaService.js";
import "../components/styles/AreaList.css";
import { useAuth } from "../context/authContext";
import ConfirmModal from "../components/ConfirmModal.jsx";
import Notification from "../components/Notification.jsx";

const AreaList = () => {
  const [areas, setAreas] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAreas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await areaService.getAllAreas();
      console.log("Áreas cargadas:", data);
      setAreas(data);
    } catch (err) {
      console.error("Error al cargar áreas:", err);
      setError("Error al cargar áreas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAreas();
    }
  }, [user]);

  useEffect(() => {
    console.log("Lista de áreas actualizada:", areas);
  }, [areas]);

  const handleDeleteClick = (area) => {
    if (!area || !area.id_area) {
      console.error("Intento de eliminar área inválida:", area);
      setNotification({
        message: "No se puede eliminar el área: datos inválidos",
        type: "error",
      });
      return;
    }
    setAreaToDelete(area);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      if (!areaToDelete || !areaToDelete.id_area) {
        throw new Error("No se puede eliminar: área inválida");
      }

      await areaService.deleteArea(areaToDelete.id_area);

      setAreas((prevAreas) =>
        prevAreas.filter((area) => area.id_area !== areaToDelete.id_area)
      );

      setNotification({
        message: "Área eliminada exitosamente",
        type: "success",
      });
    } catch (error) {
      console.error("Error detallado al eliminar área:", error);
      setNotification({
        message: error.message || "Error al eliminar el área",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
      setAreaToDelete(null);
    }
  };

  const handleEditArea = (area) => {
    setEditingArea(area);
    setShowCreateModal(true);
  };

  const handleSaveArea = async (areaData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (!user?.role === "admin") {
        throw new Error("No tienes permisos para gestionar áreas");
      }

      let updatedArea;
      if (editingArea) {
        updatedArea = await areaService.updateArea(
          editingArea.id_area,
          areaData
        );
        setAreas((prevAreas) =>
          prevAreas.map((area) =>
            area.id_area === editingArea.id_area ? updatedArea : area
          )
        );
      } else {
        const newArea = await areaService.createArea(areaData);
        setAreas((prevAreas) => [...prevAreas, newArea]);
      }

      setNotification({
        message: `Área ${editingArea ? "actualizada" : "creada"} exitosamente`,
        type: "success",
      });
    } catch (err) {
      console.error("Error al guardar área:", err);
      setNotification({
        message: err.message || "Error al guardar el área",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
      setShowCreateModal(false);
      setEditingArea(null);
    }
  };

  const filteredAreas = areas.filter(
    (area) =>
      area.nombre_area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.departamento?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="loading">Cargando áreas...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="area-list-container">
      <div className="area-list-header">
        <div className="header-top">
          <h2>Lista de Áreas</h2>
          <button
            className="create-button"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fa-solid fa-plus"></i> Crear Área
          </button>
        </div>
        <input
          type="text"
          placeholder="Buscar área..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredAreas.length === 0 ? (
        <div className="no-areas">No se encontraron áreas</div>
      ) : (
        <div className="areas-grid">
          {filteredAreas.map((area) => (
            <div key={area.id_area} className="area-card">
              <div className="area-card-header">
                <h3>{area.nombre_area}</h3>
                <div className="area-actions">
                  <button
                    onClick={() => handleEditArea(area)}
                    className="edit-button"
                    title="Editar área"
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(area)}
                    className="delete-button"
                    title="Eliminar área"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
              <div className="area-card-content">
                <p className="area-department">
                  <i className="fa-solid fa-building"></i>
                  {area.departamento}
                </p>
                <p className="area-description">
                  <i className="fa-solid fa-align-left"></i>
                  {area.descripcion || "Sin descripción"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAreaModal
          onClose={() => {
            if (!isSubmitting) {
              setShowCreateModal(false);
              setEditingArea(null);
            }
          }}
          onSave={handleSaveArea}
          editArea={editingArea}
          isSubmitting={isSubmitting}
        />
      )}

      {showConfirmModal && (
        <ConfirmModal
          message={`¿Estás seguro de que quieres eliminar el área ${areaToDelete.nombre_area}?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!isDeleting) {
              setShowConfirmModal(false);
              setAreaToDelete(null);
            }
          }}
          isLoading={isDeleting}
        />
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default AreaList;
