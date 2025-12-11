import { useEffect, useState } from 'react';
import { destinationAPI, type Destination } from '../services/api';

const DESTINATION_TYPES = [
  { value: 'hospital', label: 'Spital' },
  { value: 'clinic', label: 'Klinik' },
  { value: 'practice', label: 'Arztpraxis' },
  { value: 'rehab', label: 'Reha-Zentrum' },
  { value: 'pharmacy', label: 'Apotheke' },
  { value: 'other', label: 'Sonstiges' },
];

function Destinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [formData, setFormData] = useState<Destination>({
    name: '',
    type: 'hospital',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    contact_person: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      const response = await destinationAPI.getAll();
      setDestinations(response.data);
    } catch (error) {
      console.error('Error loading destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDestination) {
        await destinationAPI.update(editingDestination.id!, formData);
      } else {
        await destinationAPI.create(formData);
      }
      loadDestinations();
      resetForm();
    } catch (error) {
      console.error('Error saving destination:', error);
    }
  };

  const handleEdit = (destination: Destination) => {
    setEditingDestination(destination);
    setFormData(destination);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Möchten Sie dieses Ziel wirklich löschen?')) {
      try {
        await destinationAPI.delete(id);
        loadDestinations();
      } catch (error) {
        console.error('Error deleting destination:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'hospital',
      address: '',
      city: '',
      postal_code: '',
      phone: '',
      email: '',
      contact_person: '',
      notes: '',
      is_active: true,
    });
    setEditingDestination(null);
    setShowForm(false);
  };

  const getTypeLabel = (type: string) => {
    return DESTINATION_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return <div className="loading">Lade Ziele...</div>;
  }

  return (
    <div className="destinations-page">
      <div className="page-header">
        <h2>Ziele (Arztpraxen, Spitäler, etc.)</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : 'Neues Ziel'}
        </button>
      </div>

      {showForm && (
        <form className="destination-form" onSubmit={handleSubmit}>
          <h3>{editingDestination ? 'Ziel bearbeiten' : 'Neues Ziel'}</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Destination['type'] })}
              required
            >
              {DESTINATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Adresse *"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Stadt"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <input
              type="text"
              placeholder="PLZ"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            />
            <input
              type="tel"
              placeholder="Telefon"
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
              placeholder="Ansprechpartner"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              Aktiv
            </label>
          </div>
          <textarea
            placeholder="Notizen"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingDestination ? 'Aktualisieren' : 'Erstellen'}
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
            <th>Name</th>
            <th>Typ</th>
            <th>Adresse</th>
            <th>Stadt / PLZ</th>
            <th>Telefon</th>
            <th>Ansprechpartner</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {destinations.map((destination) => (
            <tr key={destination.id}>
              <td><strong>{destination.name}</strong></td>
              <td>{getTypeLabel(destination.type)}</td>
              <td>{destination.address}</td>
              <td>
                {destination.city && destination.postal_code
                  ? `${destination.postal_code} ${destination.city}`
                  : destination.city || destination.postal_code || '-'}
              </td>
              <td>{destination.phone || '-'}</td>
              <td>{destination.contact_person || '-'}</td>
              <td>
                <span className={`status-badge ${destination.is_active ? 'status-available' : 'status-unavailable'}`}>
                  {destination.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </td>
              <td className="actions">
                <button className="btn btn-small" onClick={() => handleEdit(destination)}>
                  Bearbeiten
                </button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(destination.id!)}>
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

export default Destinations;
