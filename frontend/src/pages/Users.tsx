import { useEffect, useState } from 'react';
import { userAPI, driverAPI, type User, type Driver } from '../services/api';

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<User>({
    username: '',
    email: '',
    password: '',
    role: 'dispatcher',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, driversRes] = await Promise.all([
        userAPI.getAll(),
        driverAPI.getAll(),
      ]);
      setUsers(usersRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userAPI.update(editingUser.id!, formData);
      } else {
        await userAPI.create(formData);
      }
      loadData();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Speichern');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
      try {
        await userAPI.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'dispatcher',
    });
    setEditingUser(null);
    setShowForm(false);
  };

  if (loading) return <div className="loading">Lade Benutzer...</div>;

  return (
    <div className="users-page">
      <div className="page-header">
        <h2>Benutzerverwaltung</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : 'Neuer Benutzer'}
        </button>
      </div>

      {showForm && (
        <form className="user-form" onSubmit={handleSubmit}>
          <h3>{editingUser ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Benutzername *"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="E-Mail *"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {!editingUser && (
              <input
                type="password"
                placeholder="Passwort *"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            )}
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
              required
            >
              <option value="admin">Administrator</option>
              <option value="dispatcher">Operator</option>
              <option value="driver">Fahrer</option>
            </select>
            {formData.role === 'driver' && (
              <select
                value={formData.driver_id || ''}
                onChange={(e) => setFormData({ ...formData, driver_id: parseInt(e.target.value) })}
                required={formData.role === 'driver'}
              >
                <option value="">Fahrer auswählen *</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingUser ? 'Aktualisieren' : 'Erstellen'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Benutzername</th>
            <th>E-Mail</th>
            <th>Rolle</th>
            <th>Verknüpfter Fahrer</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                {user.role === 'admin' && 'Administrator'}
                {user.role === 'dispatcher' && 'Operator'}
                {user.role === 'driver' && 'Fahrer'}
              </td>
              <td>
                {user.driver_id ? drivers.find(d => d.id === user.driver_id)?.first_name + ' ' + drivers.find(d => d.id === user.driver_id)?.last_name : '-'}
              </td>
              <td className="actions">
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(user.id!)}>
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Users;
