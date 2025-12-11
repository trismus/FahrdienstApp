import { useEffect, useState } from 'react';
import { driverAPI, availabilityAPI, WEEKDAYS, STANDARD_TIME_BLOCKS, type Driver, type AvailabilityPattern } from '../services/api';

function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverPatterns, setDriverPatterns] = useState<Map<number, AvailabilityPattern[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [availabilityPatterns, setAvailabilityPatterns] = useState<AvailabilityPattern[]>([]);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [savingPatterns, setSavingPatterns] = useState(false);
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

      // Load patterns for all drivers
      const patternsMap = new Map<number, AvailabilityPattern[]>();
      for (const driver of response.data) {
        if (driver.id) {
          try {
            const patternsRes = await availabilityAPI.getPatternsByDriver(driver.id);
            patternsMap.set(driver.id, patternsRes.data);
          } catch (error) {
            console.error(`Error loading patterns for driver ${driver.id}:`, error);
            patternsMap.set(driver.id, []);
          }
        }
      }
      setDriverPatterns(patternsMap);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailabilityPatterns = async (driverId: number) => {
    setLoadingPatterns(true);
    try {
      const response = await availabilityAPI.getPatternsByDriver(driverId);
      setAvailabilityPatterns(response.data);
    } catch (error) {
      console.error('Error loading availability patterns:', error);
      setAvailabilityPatterns([]);
    } finally {
      setLoadingPatterns(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await driverAPI.update(editingDriver.id!, formData);
        // Save availability patterns if driver exists
        await saveAvailabilityPatterns(editingDriver.id!);
      } else {
        const response = await driverAPI.create(formData);
        // Save availability patterns for new driver
        if (response.data.id && availabilityPatterns.length > 0) {
          await saveAvailabilityPatterns(response.data.id);
        }
      }
      loadDrivers();
      resetForm();
    } catch (error) {
      console.error('Error saving driver:', error);
    }
  };

  const saveAvailabilityPatterns = async (driverId: number) => {
    setSavingPatterns(true);
    try {
      // Delete all existing patterns
      await availabilityAPI.deleteAllPatterns(driverId);

      // Create the selected patterns
      if (availabilityPatterns.length > 0) {
        const patternsToCreate = availabilityPatterns.map(p => ({
          ...p,
          driver_id: driverId
        }));
        await availabilityAPI.createPatterns(patternsToCreate);
      }
    } catch (error) {
      console.error('Error saving availability patterns:', error);
      throw error;
    } finally {
      setSavingPatterns(false);
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData(driver);
    setShowForm(true);
    if (driver.id) {
      loadAvailabilityPatterns(driver.id);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Möchten Sie diesen Fahrer wirklich löschen?')) {
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
    setAvailabilityPatterns([]);
  };

  const isPatternSelected = (weekday: number, timeBlock: typeof STANDARD_TIME_BLOCKS[0]): boolean => {
    return availabilityPatterns.some(
      (pattern) =>
        pattern.weekday === weekday &&
        pattern.start_time === timeBlock.start &&
        pattern.end_time === timeBlock.end
    );
  };

  const togglePattern = (weekday: number, timeBlock: typeof STANDARD_TIME_BLOCKS[0]) => {
    const patternIndex = availabilityPatterns.findIndex(
      (pattern) =>
        pattern.weekday === weekday &&
        pattern.start_time === timeBlock.start &&
        pattern.end_time === timeBlock.end
    );

    if (patternIndex >= 0) {
      // Remove pattern
      setAvailabilityPatterns(availabilityPatterns.filter((_, i) => i !== patternIndex));
    } else {
      // Add pattern (driver_id will be set when saving)
      setAvailabilityPatterns([
        ...availabilityPatterns,
        {
          driver_id: editingDriver?.id || 0,
          weekday: weekday,
          start_time: timeBlock.start,
          end_time: timeBlock.end,
        },
      ]);
    }
  };

  const getAvailabilitySummary = (driverId: number): string => {
    const patterns = driverPatterns.get(driverId) || [];
    if (patterns.length === 0) {
      return 'Keine Verfügbarkeit definiert';
    }

    // Group by weekday
    const byWeekday = new Map<number, string[]>();
    patterns.forEach(pattern => {
      const timeStr = pattern.start_time.substring(0, 5) + '-' + pattern.end_time.substring(0, 5);
      if (!byWeekday.has(pattern.weekday)) {
        byWeekday.set(pattern.weekday, []);
      }
      byWeekday.get(pattern.weekday)!.push(timeStr);
    });

    // Format as "Mo: 08-10, 10-12 | Di: 08-10"
    const parts: string[] = [];
    WEEKDAYS.forEach(wd => {
      const times = byWeekday.get(wd.value);
      if (times && times.length > 0) {
        parts.push(`${wd.short}: ${times.join(', ')}`);
      }
    });

    return parts.join(' | ') || 'Keine Verfügbarkeit';
  };

  if (loading) {
    return <div className="loading">Lade Fahrer...</div>;
  }

  return (
    <div className="drivers-page">
      <div className="page-header">
        <h2>Fahrer</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : 'Neuer Fahrer'}
        </button>
      </div>

      {showForm && (
        <form className="driver-form" onSubmit={handleSubmit}>
          <h3>{editingDriver ? 'Fahrer bearbeiten' : 'Neuer Fahrer'}</h3>

          {/* Basic Information */}
          <div className="form-section">
            <h4>Grundinformationen</h4>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Vorname *"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Nachname *"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="Telefon *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="E-Mail"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Führerscheinnummer *"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Fahrzeugtyp"
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
              />
              <input
                type="text"
                placeholder="Fahrzeugkennzeichen"
                value={formData.vehicle_registration}
                onChange={(e) => setFormData({ ...formData, vehicle_registration: e.target.value })}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                />
                Verfügbar
              </label>
            </div>
          </div>

          {/* Availability Patterns */}
          <div className="form-section">
            <h4>Wöchentliche Verfügbarkeitsmuster</h4>
            <p className="text-sm text-gray-600 mb-4">
              Wählen Sie die Zeitblöcke aus, in denen dieser Fahrer jede Woche verfügbar ist.
              Diese Muster gelten für jede Woche im Jahr.
            </p>

            {loadingPatterns ? (
              <div className="text-center py-4">Lade Verfügbarkeitsmuster...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="availability-table">
                  <thead>
                    <tr>
                      <th>Zeitblock</th>
                      {WEEKDAYS.map((weekday) => (
                        <th key={weekday.value}>{weekday.short}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STANDARD_TIME_BLOCKS.map((timeBlock, timeIndex) => (
                      <tr key={timeIndex}>
                        <td className="font-medium">{timeBlock.label}</td>
                        {WEEKDAYS.map((weekday) => {
                          const isSelected = isPatternSelected(weekday.value, timeBlock);
                          return (
                            <td key={weekday.value} className="text-center p-1">
                              <button
                                type="button"
                                onClick={() => togglePattern(weekday.value, timeBlock)}
                                className={`w-full h-10 rounded transition-colors ${
                                  isSelected
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                title={
                                  isSelected
                                    ? 'Verfügbar (Klicken zum Entfernen)'
                                    : 'Nicht verfügbar (Klicken zum Hinzufügen)'
                                }
                              >
                                {isSelected ? '✓' : ''}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingPatterns}
            >
              {savingPatterns ? 'Speichert...' : (editingDriver ? 'Aktualisieren' : 'Erstellen')}
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
            <th>Telefon</th>
            <th>Führerschein</th>
            <th>Fahrzeugtyp</th>
            <th>Kennzeichen</th>
            <th>Verfügbarkeitsmuster</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((driver) => (
            <tr key={driver.id}>
              <td>{driver.first_name} {driver.last_name}</td>
              <td>{driver.phone}</td>
              <td>{driver.license_number}</td>
              <td>{driver.vehicle_type || '-'}</td>
              <td>{driver.vehicle_registration || '-'}</td>
              <td className="text-sm">
                {getAvailabilitySummary(driver.id!)}
              </td>
              <td>
                <span className={`status-badge ${driver.is_available ? 'status-available' : 'status-unavailable'}`}>
                  {driver.is_available ? 'Verfügbar' : 'Nicht verfügbar'}
                </span>
              </td>
              <td className="actions">
                <button className="btn btn-small" onClick={() => handleEdit(driver)}>
                  Bearbeiten
                </button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(driver.id!)}>
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

export default Drivers;
