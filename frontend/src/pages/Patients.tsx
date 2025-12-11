import { useEffect, useState } from 'react';
import { patientAPI, type Patient } from '../services/api';

function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<Patient>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone: '',
    email: '',
    address: '',
    medical_notes: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await patientAPI.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await patientAPI.update(editingPatient.id!, formData);
      } else {
        await patientAPI.create(formData);
      }
      loadPatients();
      resetForm();
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData(patient);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientAPI.delete(id);
        loadPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      phone: '',
      email: '',
      address: '',
      medical_notes: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    });
    setEditingPatient(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Loading patients...</div>;
  }

  return (
    <div className="patients-page">
      <div className="page-header">
        <h2>Patients</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Patient'}
        </button>
      </div>

      {showForm && (
        <form className="patient-form" onSubmit={handleSubmit}>
          <h3>{editingPatient ? 'Edit Patient' : 'New Patient'}</h3>
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
              type="date"
              placeholder="Date of Birth"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <input
              type="text"
              placeholder="Emergency Contact Name"
              value={formData.emergency_contact_name}
              onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
            />
            <input
              type="tel"
              placeholder="Emergency Contact Phone"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Medical Notes"
            value={formData.medical_notes}
            onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
            rows={3}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingPatient ? 'Update' : 'Create'}
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
            <th>Email</th>
            <th>Address</th>
            <th>Emergency Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td>{patient.first_name} {patient.last_name}</td>
              <td>{patient.phone}</td>
              <td>{patient.email}</td>
              <td>{patient.address}</td>
              <td>
                {patient.emergency_contact_name}
                {patient.emergency_contact_phone && ` (${patient.emergency_contact_phone})`}
              </td>
              <td className="actions">
                <button className="btn btn-small" onClick={() => handleEdit(patient)}>
                  Edit
                </button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(patient.id!)}>
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

export default Patients;
