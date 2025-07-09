import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableRow,
  TableCell, TableBody, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, IconButton, Chip, Paper,
  Select, MenuItem, InputLabel, FormControl, Snackbar,
  TableContainer, Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Book as BookIcon
} from '@mui/icons-material';
import MuiAlert from '@mui/material/Alert';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000' // Adjust to your backend port
});

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function ProfessorManagement() {
  const [professors, setProfessors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: 'MBC',
    assignedBranches: [],
    password: '',
    contact: ''
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [addProfessorOpen, setAddProfessorOpen] = useState(false);
  const [viewProfessors, setViewProfessors] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [currentProfessor, setCurrentProfessor] = useState(null);
  const [subjectAssignment, setSubjectAssignment] = useState({
    subjectId: '',
    semester: 1,
    branchId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profRes, branchRes, subjectRes] = await Promise.all([
        api.get('/api/v1/professors'),
        api.get('/api/v1/branches'),
        api.get('/api/v1/subjects')
      ]);
      setProfessors(Array.isArray(profRes.data.data) ? profRes.data.data : []);
      setBranches(Array.isArray(branchRes.data.data) ? branchRes.data.data : []);
      setSubjects(Array.isArray(subjectRes.data.data) ? subjectRes.data.data : []);
    } catch (err) {
      showError('Failed to fetch data. Please check if the backend server is running.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBranchSelect = (e) => {
    setForm(prev => ({
      ...prev,
      assignedBranches: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editId) {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        await api.put(`/api/v1/professors/${editId}`, updateData);
        showSuccess('Professor updated successfully');
      } else {
        await api.post('/api/v1/professors', form);
        showSuccess('Professor added successfully');
      }
      resetForm();
      setAddProfessorOpen(false);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this professor?')) {
      try {
        await api.delete(`/api/v1/professors/${id}`);
        showSuccess('Professor deleted successfully');
        fetchData();
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to delete professor');
      }
    }
  };

  const handleEdit = (professor) => {
    setForm({
      name: professor.name || '',
      email: professor.email || '',
      department: professor.department || 'MBC',
      assignedBranches: professor.assignedBranches?.map(b => b._id) || [],
      password: '',
      contact: professor.contact || ''
    });
    setEditId(professor._id);
    setAddProfessorOpen(true);
    setViewProfessors(false);
  };

  const handleAssignSubjects = (professor) => {
    setCurrentProfessor(professor);
    setSubjectDialogOpen(true);
    setSubjectAssignment({ subjectId: '', semester: 1, branchId: '' });
  };

  const handleSubjectAssignment = async () => {
    try {
      await api.post(`/api/v1/professors/${currentProfessor._id}/assign`, {
        subjectId: subjectAssignment.subjectId,
        semester: subjectAssignment.semester,
        branchId: subjectAssignment.branchId
      });
      showSuccess('Subject assigned successfully');
      setSubjectDialogOpen(false);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to assign subject');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      department: 'MBC',
      assignedBranches: [],
      password: '',
      contact: ''
    });
    setEditId(null);
  };

  const showSuccess = (message) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };

  const showError = (message) => {
    setSnackbar({ open: true, message, severity: 'error' });
  };

  const getBranchName = (id) => {
    return branches.find(b => b._id === id)?.name || 'Unknown';
  };

  const getSubjectName = (id) => {
    return subjects.find(s => s._id === id)?.name || 'Unknown';
  };

  const getSubjectCredits = (id) => {
    return subjects.find(s => s._id === id)?.credits || 'N/A';
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Professor Management Dashboard</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setAddProfessorOpen(true);
              setViewProfessors(false);
              resetForm();
            }}
          >
            Add Professor
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<BookIcon />}
            onClick={() => {
              setViewProfessors(true);
              setAddProfessorOpen(false);
            }}
          >
            View Professors
          </Button>
        </Grid>
      </Grid>

      {addProfessorOpen && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {editId ? 'Edit Professor' : 'Add New Professor'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="name"
                  label="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="contact"
                  label="Contact Number"
                  value={form.contact}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    label="Department"
                  >
                    <MenuItem value="MBC">MBC</MenuItem>
                    <MenuItem value="Mathematics">Mathematics</MenuItem>
                    <MenuItem value="Physics">Physics</MenuItem>
                    <MenuItem value="Chemistry">Chemistry</MenuItem>
                    <MenuItem value="Computer Science">Computer Science</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Branches</InputLabel>
                  <Select
                    multiple
                    name="assignedBranches"
                    value={form.assignedBranches}
                    onChange={handleBranchSelect}
                    label="Assigned Branches"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={getBranchName(value)} />
                        ))}
                      </Box>
                    )}
                  >
                    {branches.map(branch => (
                      <MenuItem key={branch._id} value={branch._id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {!editId && (
                <Grid item xs={12}>
                  <TextField
                    name="password"
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    fullWidth
                    required
                    helperText="Required for new professors"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      resetForm();
                      setAddProfessorOpen(false);
                    }}
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={editId ? <SaveIcon /> : <AddIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : (editId ? 'Update' : 'Add')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {viewProfessors && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Existing Professors</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Current Branches</TableCell>
                  <TableCell>Current Subjects</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {professors.map(professor => (
                  <TableRow key={professor._id}>
                    <TableCell>{professor.name}</TableCell>
                    <TableCell>{professor.department || 'MBC'}</TableCell>
                    <TableCell>{professor.contact || 'N/A'}</TableCell>
                    <TableCell>{professor.email}</TableCell>
                    <TableCell>
                      {professor.assignedBranches?.map(b => (
                        <Chip
                          key={b._id}
                          label={b.name}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )) || 'None'}
                    </TableCell>
                    <TableCell>
                      {professor.assignedSubjects?.map(as => (
                        <Box key={as._id || as.subject?._id} sx={{ mb: 1 }}>
                          <Chip
                            label={`${getSubjectName(as.subject?._id)} (Sem ${as.semester}, Credits: ${getSubjectCredits(as.subject?._id)})`}
                            size="small"
                            sx={{ mr: 1 }}
                            icon={<BookIcon fontSize="small" />}
                          />
                        </Box>
                      )) || 'None'}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(professor)}>
                        <EditIcon color="primary" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(professor._id)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                      <Button
                        size="small"
                        onClick={() => handleAssignSubjects(professor)}
                        startIcon={<BookIcon />}
                      >
                        Assign Subjects
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog
        open={subjectDialogOpen}
        onClose={() => setSubjectDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Assign Subjects to {currentProfessor?.name}
        </DialogTitle>
        <DialogContent>
          {currentProfessor && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Branch</InputLabel>
                <Select
                  value={subjectAssignment.branchId}
                  onChange={(e) => setSubjectAssignment({
                    ...subjectAssignment,
                    branchId: e.target.value,
                    subjectId: ''
                  })}
                  label="Branch"
                >
                  <MenuItem value=""><em>Select Branch</em></MenuItem>
                  {branches.map(branch => (
                    <MenuItem key={branch._id} value={branch._id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" disabled={!subjectAssignment.branchId}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={subjectAssignment.subjectId}
                  onChange={(e) => setSubjectAssignment({
                    ...subjectAssignment,
                    subjectId: e.target.value
                  })}
                  label="Subject"
                >
                  <MenuItem value=""><em>Select Subject</em></MenuItem>
                  {subjects
                    .filter(subject => subject.branch?._id === subjectAssignment.branchId)
                    .map(subject => (
                      <MenuItem key={subject._id} value={subject._id}>
                        {subject.name} (Credits: {subject.credits})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Semester</InputLabel>
                <Select
                  value={subjectAssignment.semester}
                  onChange={(e) => setSubjectAssignment({
                    ...subjectAssignment,
                    semester: e.target.value
                  })}
                  label="Semester"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <MenuItem key={sem} value={sem}>
                      Semester {sem}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubjectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubjectAssignment}
            variant="contained"
            disabled={!subjectAssignment.subjectId || !subjectAssignment.branchId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}