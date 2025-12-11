import { useEffect, useState } from 'react';
import { patientAPI, type Patient } from '../services/api';

// MUI Components
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

// MUI Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const emptyPatient: Patient = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  phone: '',
  email: '',
  street: '',
  house_number: '',
  city: '',
  postal_code: '',
  medical_notes: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState<Patient>(emptyPatient);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await patientAPI.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFormDialog = (patient: Patient | null = null) => {
    if (patient) {
      setEditingPatient(patient);
      // Ensure date is in YYYY-MM-DD format for the input
      const patientData = { ...patient, date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '' };
      setFormData(patientData);
    } else {
      setEditingPatient(null);
      setFormData(emptyPatient);
    }
    setOpenFormDialog(true);
  };

  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setEditingPatient(null);
    setFormData(emptyPatient);
  };

  const handleOpenConfirmDialog = (id: number) => {
    setPatientToDelete(id);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setPatientToDelete(null);
    setOpenConfirmDialog(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editingPatient) {
        await patientAPI.update(editingPatient.id!, formData);
      } else {
        await patientAPI.create(formData);
      }
      loadPatients();
      handleCloseFormDialog();
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const handleDelete = async () => {
    if (patientToDelete) {
      try {
        await patientAPI.delete(patientToDelete);
        loadPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
    handleCloseConfirmDialog();
  };


  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
        <Typography variant="h4" component="h1">
          Patients
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenFormDialog()}
        >
          New Patient
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Emergency Contact</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>{patient.first_name} {patient.last_name}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>
                    {patient.street && patient.house_number
                      ? `${patient.street} ${patient.house_number}, ${patient.postal_code || ''} ${patient.city || ''}`.trim()
                      : patient.address || '-'}
                  </TableCell>
                  <TableCell>
                    {patient.emergency_contact_name}
                    {patient.emergency_contact_phone && ` (${patient.emergency_contact_phone})`}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenFormDialog(patient)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleOpenConfirmDialog(patient.id!)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Form Dialog */}
      <Dialog open={openFormDialog} onClose={handleCloseFormDialog} maxWidth="md">
        <DialogTitle>{editingPatient ? 'Edit Patient' : 'New Patient'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField label="First Name" name="first_name" value={formData.first_name} onChange={handleFormChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Last Name" name="last_name" value={formData.last_name} onChange={handleFormChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleFormChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Phone" name="phone" value={formData.phone} onChange={handleFormChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Email" name="email" type="email" value={formData.email} onChange={handleFormChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Street" name="street" value={formData.street} onChange={handleFormChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="House Number" name="house_number" value={formData.house_number} onChange={handleFormChange} fullWidth /></Grid>
            <Grid item xs={12} sm={3}><TextField label="Postal Code" name="postal_code" value={formData.postal_code} onChange={handleFormChange} fullWidth /></Grid>
            <Grid item xs={12} sm={9}><TextField label="City" name="city" value={formData.city} onChange={handleFormChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Emergency Contact Name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleFormChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Emergency Contact Phone" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleFormChange} fullWidth /></Grid>
            <Grid item xs={12}><TextField label="Medical Notes" name="medical_notes" value={formData.medical_notes} onChange={handleFormChange} fullWidth multiline rows={3} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editingPatient ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this patient? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}

export default Patients;
