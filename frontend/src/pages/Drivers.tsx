import { useEffect, useState } from 'react';
import { driverAPI, type Driver } from '../services/api';

function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<Driver>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    license_number: '',
    vehicle_type: '',
    vehicle_registration: '',
    is_available: true,
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await driverAPI.getAll();
      setDrivers(response.data);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await driverAPI.update(editingDriver.id!, formData);
      } else {
        await driverAPI.create(formData);
      }
      loadDrivers();
      resetForm();
    } catch (error) {
      console.error('Error saving driver:', error);
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData(driver);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await driverAPI.delete(id);
        loadDrivers();
      } catch (error) {
        console.error('Error deleting driver:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      license_number: '',
      vehicle_type: '',
      vehicle_registration: '',
      is_available: true,
    });
    setEditingDriver(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Loading drivers...</div>;
  }

  return (
    <div className="drivers-page">
      <div className="page-header">
        <h2>Drivers</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Driver'}
        </button>
      </div>

      {showForm && (
        <form className="driver-form" onSubmit={handleSubmit}>
          <h3>{editingDriver ? 'Edit Driver' : 'New Driver'}</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="First Name *"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Last Name *"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
            <input
              type="tel"
              placeholder="Phone *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="License Number *"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Vehicle Type"
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
            />
            <input
              type="text"
              placeholder="Vehicle Registration"
              value={formData.vehicle_registration}
              onChange={(e) => setFormData({ ...formData, vehicle_registration: e.target.value })}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              />
              Available
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingDriver ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>License</th>
            <th>Vehicle Type</th>
            <th>Registration</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((driver) => (
            <tr key={driver.id}>
              <td>{driver.first_name} {driver.last_name}</td>
              <td>{driver.phone}</td>
              <td>{driver.license_number}</td>
              <td>{driver.vehicle_type}</td>
              <td>{driver.vehicle_registration}</td>
              <td>
                <span className={`status-badge ${driver.is_available ? 'status-available' : 'status-unavailable'}`}>
                  {driver.is_available ? 'Available' : 'Unavailable'}
                </span>
              </td>
              <td className="actions">
                <button className="btn btn-small" onClick={() => handleEdit(driver)}>
                  Edit
                </button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(driver.id!)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Drivers;
