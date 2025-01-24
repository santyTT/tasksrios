import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { userService } from "../services/userService";
import CreateUser from "./createUser";
import ConfirmModal from "./ConfirmModal";
import Notification from "./Notification";
import "../components/styles/userList.css";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadUsers();
    }
  }, [currentUser]);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await userService.deleteUser(userToDelete.id);
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userToDelete.id));
      setNotification({
        message: "Usuario eliminado exitosamente",
        type: "success",
      });
    } catch (err) {
      setNotification({
        message: err.message || "Error al eliminar usuario",
        type: "error",
      });
    } finally {
      setShowConfirmModal(false);
      setUserToDelete(null);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowCreateModal(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (!currentUser?.role === "admin") {
        throw new Error("No tienes permisos para gestionar usuarios");
      }
  
      let updatedUsers;
      if (userData.id) {
        // Actualiza el usuario en la lista directamente en el estado
        const updatedUser = await userService.updateUser(userData.id, userData);
        updatedUsers = users.map((user) =>
          user.id === userData.id ? { ...user, ...updatedUser } : user
        );
      } else {
        const newUser = await userService.createUser(userData);
        updatedUsers = [...users, newUser];
      }
  
      setUsers(updatedUsers); // Actualiza los usuarios sin recargar la página
      setShowCreateModal(false);
      setEditingUser(null);
      setNotification({
        message: `Usuario ${userData.id ? "actualizado" : "creado"} exitosamente`,
        type: "success",
      });
    } catch (err) {
      console.error("Error al guardar usuario:", err);
      setNotification({
        message: err.message || "Error al guardar usuario",
        type: "error",
      });
    }
  };
  
  

  const filteredUsers = users.filter((user) => {
    const searchText = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchText) ||
      user.email?.toLowerCase().includes(searchText) ||
      user.role?.toLowerCase().includes(searchText)
    );
  });

  if (loading) return <div className="loading">Cargando usuarios...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <div className="header-top">
          <h2>Lista de Usuarios</h2>
          <button
            className="create-button"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fas fa-plus"></i> Crear Usuario
          </button>
        </div>
        <input
          type="text"
          placeholder="Buscar usuario..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="users-grid">
        {filteredUsers.length === 0 ? (
          <div className="no-users">No se encontraron usuarios</div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <h3>{user.name}</h3>
                <div className="user-actions">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="edit-button"
                    title="Editar usuario"
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(user)}
                    className="delete-button"
                    title="Eliminar usuario"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div className="user-card-content">
                <p className="user-email">
                  <i className="fas fa-envelope"></i>
                  {user.email}
                </p>
                <p className="user-role">
                  <i className="fas fa-user-tag"></i>
                  {user.role}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateUser
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
          editUser={editingUser}
        />
      )}

      {showConfirmModal && (
        <ConfirmModal
          message={`¿Estás seguro de que quieres eliminar al usuario ${userToDelete.name}?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowConfirmModal(false);
            setUserToDelete(null);
          }}
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

export default UserList;
