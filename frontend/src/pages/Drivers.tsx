import { useEffect, useState, useMemo } from 'react';
import { driverAPI, availabilityAPI, WEEKDAYS, STANDARD_TIME_BLOCKS, type Driver, type AvailabilityPattern } from '../services/api';

// MUI Components
import {
  Avatar, Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, Chip, FormControlLabel, Switch, Tooltip, Menu, MenuItem, DialogContentText
} from '@mui/material';

// MUI Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const emptyDriver: Driver = {
  first_name: '', last_name: '', phone: '', email: '', license_number: '',
  vehicle_type: '', vehicle_registration: '', is_available: true,
};

function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverPatterns, setDriverPatterns] = useState<Map<number, AvailabilityPattern[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState<Driver>(emptyDriver);
  const [availabilityPatterns, setAvailabilityPatterns] = useState<AvailabilityPattern[]>([]);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // State for action menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const response = await driverAPI.getAll();
      setDrivers(response.data);
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
  
  const getAvailabilitySummary = useMemo(() => (driverId: number): string => {
    const patterns = driverPatterns.get(driverId) || [];
    if (patterns.length === 0) return 'No availability defined';
    const byWeekday = new Map<number, string[]>();
    patterns.forEach(p => {
      const timeStr = `${p.start_time.substring(0, 5)}-${p.end_time.substring(0, 5)}`;
      if (!byWeekday.has(p.weekday)) byWeekday.set(p.weekday, []);
      byWeekday.get(p.weekday)!.push(timeStr);
    });
    return WEEKDAYS.map(wd => {
      const times = byWeekday.get(wd.value);
      return times ? `${wd.short}: ${times.join(', ')}` : '';
    }).filter(Boolean).join(' | ') || 'None';
  }, [driverPatterns]);


  const handleOpenFormDialog = async (driver: Driver | null = null) => {
    setOpenFormDialog(true);
    if (driver) {
      setEditingDriver(driver);
      setFormData(driver);
      if (driver.id) {
        setLoadingPatterns(true);
        try {
          const response = await availabilityAPI.getPatternsByDriver(driver.id);
          setAvailabilityPatterns(response.data);
        } catch (error) {
          console.error('Error loading patterns:', error);
          setAvailabilityPatterns([]);
        } finally {
          setLoadingPatterns(false);
        }
      }
    } else {
      setEditingDriver(null);
      setFormData(emptyDriver);
      setAvailabilityPatterns([]);
    }
  };
  
  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setEditingDriver(null);
    setFormData(emptyDriver);
    setAvailabilityPatterns([]);
  };

  const handleOpenConfirmDialog = (id: number) => {
    setDriverToDelete(id);
    setOpenConfirmDialog(true);
  };
  
  const handleCloseConfirmDialog = () => {
    setDriverToDelete(null);
    setOpenConfirmDialog(false);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const togglePattern = (weekday: number, timeBlock: typeof STANDARD_TIME_BLOCKS[0]) => {
    const patternIndex = availabilityPatterns.findIndex(p => p.weekday === weekday && p.start_time === timeBlock.start && p.end_time === timeBlock.end);
    if (patternIndex >= 0) {
      setAvailabilityPatterns(availabilityPatterns.filter((_, i) => i !== patternIndex));
    } else {
      setAvailabilityPatterns([...availabilityPatterns, {
        driver_id: editingDriver?.id || 0, weekday: weekday, start_time: timeBlock.start, end_time: timeBlock.end,
      }]);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let driverId: number;
      if (editingDriver) {
        driverId = editingDriver.id!;
        await driverAPI.update(driverId, formData);
      } else {
        const response = await driverAPI.create(formData);
        driverId = response.data.id!;
      }
      await availabilityAPI.deleteAllPatterns(driverId);
      if (availabilityPatterns.length > 0) {
        const patternsToCreate = availabilityPatterns.map(p => ({ ...p, driver_id: driverId }));
        await availabilityAPI.createPatterns(patternsToCreate);
      }
      loadDrivers();
      handleCloseFormDialog();
    } catch (error) {
      console.error('Error saving driver:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (driverToDelete) {
      try {
        await driverAPI.delete(driverToDelete);
        loadDrivers();
      } catch (error) {
        console.error('Error deleting driver:', error);
      }
    }
    handleCloseConfirmDialog();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, driver: Driver) => {
    setAnchorEl(event.currentTarget);
    setCurrentDriver(driver);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentDriver(null);
  };

  const handleEditFromMenu = () => {
    if (currentDriver) handleOpenFormDialog(currentDriver);
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (currentDriver?.id) handleOpenConfirmDialog(currentDriver.id);
    handleMenuClose();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;

  return (
    <>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" component="h1" fontWeight="bold">Fahrer</Typography>
            <Typography variant="subtitle2" color="text.secondary">Verwalten Sie Ihre Fahrer und deren Verfügbarkeit</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenFormDialog()}>Neuer Fahrer</Button>
        </Box>
        <TableContainer>
          <Table sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid rgba(255, 255, 255, 0.08)' } }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Kontakt</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map(driver => (
                <TableRow key={driver.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>{driver.first_name[0]}{driver.last_name[0]}</Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">{driver.first_name} {driver.last_name}</Typography>
                        <Typography variant="body2" color="text.secondary">{driver.license_number}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>
                    <Chip label={driver.is_available ? 'Verfügbar' : 'Nicht verfügbar'} color={driver.is_available ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => handleMenuOpen(e, driver)}><MoreVertIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditFromMenu}><EditIcon sx={{ mr: 1 }} fontSize="small" /> Bearbeiten</MenuItem>
        <MenuItem onClick={handleDeleteFromMenu}><DeleteIcon sx={{ mr: 1 }} fontSize="small" /> Löschen</MenuItem>
      </Menu>

      {/* Form Dialog */}
      <Dialog open={openFormDialog} onClose={handleCloseFormDialog} maxWidth="lg" fullWidth>
        <DialogTitle>{editingDriver ? 'Fahrer bearbeiten' : 'Neuer Fahrer'}</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Grundinformationen</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField name="first_name" label="Vorname" value={formData.first_name} onChange={handleFormChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField name="last_name" label="Nachname" value={formData.last_name} onChange={handleFormChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField name="phone" label="Telefon" value={formData.phone} onChange={handleFormChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField name="email" label="Email" type="email" value={formData.email} onChange={handleFormChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField name="license_number" label="Führerscheinnummer" value={formData.license_number} onChange={handleFormChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={3}><TextField name="vehicle_type" label="Fahrzeugtyp" value={formData.vehicle_type} onChange={handleFormChange} fullWidth /></Grid>
            <Grid item xs={12} sm={3}><TextField name="vehicle_registration" label="Kennzeichen" value={formData.vehicle_registration} onChange={handleFormChange} fullWidth /></Grid>
            <Grid item xs={12}>
                <FormControlLabel control={<Switch name="is_available" checked={formData.is_available} onChange={handleFormChange} />} label="Ist verfügbar" />
            </Grid>
          </Grid>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Wöchentliche Verfügbarkeit</Typography>
          {loadingPatterns ? <CircularProgress /> : (
            <Paper variant="outlined">
                <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Zeitblock</TableCell>
                                {WEEKDAYS.map(wd => <TableCell key={wd.value} align="center">{wd.short}</TableCell>)}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {STANDARD_TIME_BLOCKS.map(tb => (
                                <TableRow key={tb.start}>
                                    <TableCell>{tb.label}</TableCell>
                                    {WEEKDAYS.map(wd => {
                                        const isSelected = availabilityPatterns.some(p => p.weekday === wd.value && p.start_time === tb.start);
                                        return (
                                            <TableCell key={wd.value} align="center" sx={{ p: 0.5 }}>
                                                <Tooltip title={isSelected ? 'Verfügbar' : 'Nicht verfügbar'}>
                                                    <IconButton
                                                        onClick={() => togglePattern(wd.value, tb)}
                                                        color={isSelected ? 'success' : 'default'}
                                                        size="small"
                                                    >
                                                        <CheckIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={handleCloseFormDialog}>Abbrechen</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : (editingDriver ? 'Aktualisieren' : 'Erstellen')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Löschen bestätigen</DialogTitle>
        <DialogContent><DialogContentText>Möchten Sie diesen Fahrer wirklich löschen? Dadurch werden auch alle zugehörigen Verfügbarkeitsmuster entfernt.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Abbrechen</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Löschen</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Drivers;
