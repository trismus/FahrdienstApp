# Fahrerverfügbarkeits-System

## Übersicht

Das Fahrerverfügbarkeits-System ermöglicht es Operatoren, die Verfügbarkeit von Fahrern über wählbare 2-Stunden-Einsatzblöcke zu verwalten. Das System stellt sicher, dass Fahrten nur zu Zeiten zugewiesen werden, in denen ein Fahrer tatsächlich verfügbar ist.

## Funktionsweise

### Zeitblöcke

Das System arbeitet mit festen 2-Stunden-Zeitblöcken:
- **08:00 - 10:00**
- **10:00 - 12:00**
- **12:00 - 14:00**
- **14:00 - 16:00**
- **16:00 - 18:00**

Diese Blöcke gelten für Montag bis Freitag (Mo-Fr, 08:00-18:00).

### Verfügbarkeitsblöcke

Jeder Verfügbarkeitsblock enthält:
- **Fahrer**: Der zugehörige Fahrer
- **Datum**: Das Datum des Blocks
- **Startzeit & Endzeit**: Der 2-Stunden-Zeitraum
- **Status**: Verfügbar (grün) oder Belegt (rot)
- **Fahrt**: Optional die zugewiesene Fahrt-ID, wenn belegt

## Benutzeroberfläche

### Verfügbarkeit verwalten

1. Navigieren Sie zu **Verfügbarkeit** im Hauptmenü
2. Wählen Sie einen Fahrer aus der Dropdown-Liste
3. Wählen Sie die gewünschte Woche (Navigation über Pfeiltasten)
4. Klicken Sie auf die gewünschten Zeitblöcke, um diese zu aktivieren/deaktivieren
   - **Grau**: Nicht verfügbar (klicken zum Hinzufügen)
   - **Grün**: Verfügbar (klicken zum Entfernen)
   - **Rot**: Belegt durch eine Fahrt (kann nicht entfernt werden)
5. Klicken Sie auf **"Verfügbarkeiten speichern"**, um die Änderungen zu übernehmen

### Fahrten zuweisen

1. Navigieren Sie zu **Fahrten** im Hauptmenü
2. Erstellen Sie eine neue Fahrt oder bearbeiten Sie eine bestehende
3. Wählen Sie den Patienten aus
4. Wählen Sie die **Abholzeit**
   - Das System lädt automatisch nur Fahrer mit verfügbaren Blöcken für diese Zeit
   - Eine Meldung zeigt die Anzahl der verfügbaren Fahrer an
5. Wählen Sie einen Fahrer aus der gefilterten Liste
6. Füllen Sie die restlichen Felder aus und speichern Sie
7. Der zugewiesene Zeitblock wird automatisch als **belegt** markiert

## Validierung

Das System stellt sicher, dass:
- Nur Fahrer mit verfügbaren Blöcken zur Auswahl stehen
- Bei der Zuweisung wird geprüft, ob der Block noch verfügbar ist
- Belegte Blöcke können nicht gelöscht werden
- Ein Block kann nur einmal pro Datum und Fahrer existieren

## Backend API

### Verfügbarkeits-Endpunkte

#### Blöcke eines Fahrers abrufen
```
GET /api/availability/driver/:driverId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

#### Verfügbare Blöcke für eine Zeit abrufen
```
GET /api/availability/available?date=YYYY-MM-DD&startTime=HH:MM:SS&endTime=HH:MM:SS
```

#### Blöcke erstellen
```
POST /api/availability
Body: AvailabilityBlock | AvailabilityBlock[]
```

#### Block als belegt markieren
```
PATCH /api/availability/:id/occupy
Body: { trip_id: number }
```

#### Block freigeben
```
PATCH /api/availability/:id/free
```

#### Blöcke löschen
```
DELETE /api/availability/:id
DELETE /api/availability/driver/:driverId/range?startDate=...&endDate=...
```

## Datenbank

### Tabelle: driver_availability_blocks

```sql
CREATE TABLE driver_availability_blocks (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_occupied BOOLEAN DEFAULT false,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_driver_time_slot UNIQUE (driver_id, date, start_time, end_time),
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);
```

### Indizes

- `idx_availability_driver_date`: Auf (driver_id, date) für schnelle Abfragen
- `idx_availability_occupied`: Auf is_occupied für Verfügbarkeitsabfragen
- `idx_availability_trip`: Auf trip_id für Rückverfolgung

## Migration

Um die Verfügbarkeitstabelle in einer bestehenden Datenbank anzulegen:

```bash
# PostgreSQL
psql -U postgres -d fahrdienst -f backend/src/database/migrations/001_add_availability_blocks.sql

# oder beim Start der Anwendung
# Die Tabelle wird automatisch durch schema.sql erstellt
```

## Workflow-Beispiel

1. **Operator plant Verfügbarkeit**
   - Öffnet "Verfügbarkeit"
   - Wählt Fahrer "Max Mustermann"
   - Aktiviert Montag 08:00-10:00 und 10:00-12:00
   - Speichert

2. **Operator erstellt Fahrt**
   - Öffnet "Fahrten" → "Neue Fahrt"
   - Wählt Patient und Abholzeit: Montag 09:00
   - System zeigt nur "Max Mustermann" als verfügbar an (hat Block 08:00-10:00)
   - Weist Fahrt zu Max zu
   - Block 08:00-10:00 wird rot (belegt)

3. **Operator versucht weitere Zuweisung**
   - Erstellt zweite Fahrt für Montag 09:15
   - Max Mustermann erscheint NICHT in der Liste (Block bereits belegt)
   - Nur andere Fahrer mit verfügbaren Blöcken werden angezeigt

## Vorteile

- **Automatische Validierung**: Keine versehentliche Doppelbuchung
- **Visuelle Übersicht**: Operator sieht sofort, welche Zeiten verfügbar sind
- **Flexible Planung**: Wochenweise Verwaltung der Verfügbarkeit
- **Transparenz**: Klare Anzeige von verfügbaren vs. belegten Blöcken

## Technische Details

### Frontend
- React Component: `DriverAvailability.tsx`
- State Management: React Hooks (useState, useEffect)
- API-Integration: `availabilityAPI` aus `services/api.ts`

### Backend
- Routes: `routes/availability.routes.ts`
- TypeScript Types: `models/types.ts`
- Datenbank: PostgreSQL mit pg-Pool

### Datenbankschema
- CASCADE DELETE: Wenn ein Fahrer gelöscht wird, werden seine Blöcke entfernt
- SET NULL: Wenn eine Fahrt gelöscht wird, wird der Block freigegeben
- UNIQUE Constraint: Verhindert Duplikate

## Erweiterungsmöglichkeiten

- **Flexible Zeitblöcke**: Variable Block-Längen
- **Automatische Zuweisung**: KI-basierte Fahrerauswahl
- **Benachrichtigungen**: Fahrer werden über Zuweisungen informiert
- **Kalenderintegration**: Export in externe Kalender (iCal, Google Calendar)
- **Statistiken**: Auslastungsanalyse pro Fahrer
