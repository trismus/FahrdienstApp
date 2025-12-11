import React, { useState, useEffect } from 'react';
import { driverAPI, availabilityAPI, STANDARD_TIME_BLOCKS, WEEKDAYS, type Driver, type AvailabilityPattern } from '../services/api';

const DriverAvailability: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [availabilityPatterns, setAvailabilityPatterns] = useState<AvailabilityPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    if (selectedDriver) {
      loadAvailabilityPatterns();
    }
  }, [selectedDriver]);

  const loadDrivers = async () => {
    try {
      const response = await driverAPI.getAll();
      setDrivers(response.data);
    } catch (error) {
      console.error('Error loading drivers:', error);
      showMessage('error', 'Fehler beim Laden der Fahrer');
    }
  };

  const loadAvailabilityPatterns = async () => {
    if (!selectedDriver) return;

    setLoading(true);
    try {
      const response = await availabilityAPI.getPatternsByDriver(selectedDriver.id!);
      setAvailabilityPatterns(response.data);
    } catch (error) {
      console.error('Error loading availability patterns:', error);
      showMessage('error', 'Fehler beim Laden der Verfügbarkeitsmuster');
    } finally {
      setLoading(false);
    }
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
      // Add pattern
      setAvailabilityPatterns([
        ...availabilityPatterns,
        {
          driver_id: selectedDriver!.id!,
          weekday: weekday,
          start_time: timeBlock.start,
          end_time: timeBlock.end,
        },
      ]);
    }
  };

  const saveAvailability = async () => {
    if (!selectedDriver) return;

    setSaving(true);
    try {
      // Delete all existing patterns
      await availabilityAPI.deleteAllPatterns(selectedDriver.id!);

      // Create the selected patterns
      if (availabilityPatterns.length > 0) {
        await availabilityAPI.createPatterns(availabilityPatterns);
      }

      await loadAvailabilityPatterns();
      showMessage('success', 'Verfügbarkeitsmuster erfolgreich gespeichert');
    } catch (error) {
      console.error('Error saving availability:', error);
      showMessage('error', 'Fehler beim Speichern der Verfügbarkeitsmuster');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Fahrerverfügbarkeit verwalten</h1>

      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          <strong>Hinweis:</strong> Die hier definierten Zeitblöcke gelten für <strong>jede Woche</strong> im Jahr.
          Zum Beispiel: "Montag 08:00-10:00" bedeutet, dass der Fahrer jeden Montag von 08:00 bis 10:00 Uhr verfügbar ist.
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Driver Selection */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fahrer auswählen
        </label>
        <select
          value={selectedDriver?.id || ''}
          onChange={(e) => {
            const driver = drivers.find((d) => d.id === parseInt(e.target.value));
            setSelectedDriver(driver || null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Bitte wählen --</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.first_name} {driver.last_name} ({driver.license_number})
            </option>
          ))}
        </select>
      </div>

      {selectedDriver && (
        <>
          {/* Availability Grid */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Wöchentliche Verfügbarkeitsmuster (2-Stunden-Blöcke)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Klicken Sie auf die Blöcke, um die Verfügbarkeit zu ändern.
              Grün = verfügbar, Grau = nicht verfügbar.
              Diese Muster gelten für jede Woche im Jahr.
            </p>

            {loading ? (
              <div className="text-center py-8">Lade Verfügbarkeitsmuster...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 bg-gray-100">
                        Zeitblock
                      </th>
                      {WEEKDAYS.map((weekday) => (
                        <th
                          key={weekday.value}
                          className="border border-gray-300 px-4 py-2 bg-gray-100"
                        >
                          {weekday.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STANDARD_TIME_BLOCKS.map((timeBlock, timeIndex) => (
                      <tr key={timeIndex}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">
                          {timeBlock.label}
                        </td>
                        {WEEKDAYS.map((weekday) => {
                          const isSelected = isPatternSelected(weekday.value, timeBlock);
                          return (
                            <td
                              key={weekday.value}
                              className="border border-gray-300 p-1 text-center"
                            >
                              <button
                                onClick={() => togglePattern(weekday.value, timeBlock)}
                                className={`w-full h-12 rounded transition-colors ${
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

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveAvailability}
              disabled={saving || loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Speichert...' : 'Verfügbarkeitsmuster speichern'}
            </button>
          </div>
        </>
      )}

      {!selectedDriver && (
        <div className="bg-gray-100 p-8 rounded-lg text-center text-gray-600">
          Bitte wählen Sie einen Fahrer aus, um die Verfügbarkeit zu verwalten.
        </div>
      )}
    </div>
  );
};

export default DriverAvailability;
