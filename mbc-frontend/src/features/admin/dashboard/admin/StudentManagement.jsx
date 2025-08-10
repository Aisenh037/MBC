import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Select, MenuItem, InputLabel, FormControl,
  Grid, Snackbar, IconButton, CircularProgress
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CloudUpload as UploadIcon } from "@mui/icons-material";
import MuiAlert from "@mui/material/Alert";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
});

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [form, setForm] = useState({
    scholarNumber: "",
    name: "",
    email: "",
    mobile: "",
    currentSemester: 1,
    branch: "",
  });
  const [bulkForm, setBulkForm] = useState({
    branchId: "",
    semester: 1,
    students: []
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchData();
  }, []);

  // API fetch
  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentRes, branchRes] = await Promise.all([
        api.get("/api/v1/students").catch(() => ({ data: { data: [] } })),
        api.get("/api/v1/branches").catch(() => ({ data: { data: [] } })),
      ]);
      setStudents(Array.isArray(studentRes.data.data) ? studentRes.data.data : []);
      setBranches(Array.isArray(branchRes.data.data) ? branchRes.data.data : []);
      if (!branchRes.data.data.length) {
        showWarning("No branches available. Please add branches in the backend.");
      }
    } catch (err) {
      showError("Failed to fetch data. Please check if the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Form handling
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Bulk form handlers
  const handleBulkChange = (e) => {
    const { name, value } = e.target;
    setBulkForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleBulkStudentsChange = (e) => {
    try {
      const students = JSON.parse(e.target.value);
      if (!Array.isArray(students)) throw new Error("Students must be an array");
      setBulkForm((prev) => ({ ...prev, students }));
    } catch {
      showError("Invalid JSON format for students");
    }
  };

  // CRUD handlers
  const handleSubmit = async () => {
    if (!form.scholarNumber || !form.name || !form.email || !form.branch) {
      showError("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/api/v1/students/${editingId}`, form);
        showSuccess("Student updated successfully");
      } else {
        await api.post("/api/v1/students", form);
        showSuccess("Student added successfully");
      }
      fetchData();
      setOpen(false);
      resetForm();
    } catch (err) {
      showError(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkForm.branchId || !bulkForm.semester || !bulkForm.students.length) {
      showError("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/api/v1/students/bulk-import", bulkForm);
      showSuccess(data.message);
      fetchData();
      setBulkImportOpen(false);
      resetBulkForm();
    } catch (err) {
      showError(err.response?.data?.message || "Bulk import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setForm({
      scholarNumber: student.scholarNumber || "",
      name: student.name || "",
      email: student.email || "",
      mobile: student.mobile || "",
      currentSemester: student.currentSemester || 1,
      branch: student.branch?._id || student.branch || "",
    });
    setEditingId(student._id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      setLoading(true);
      try {
        await api.delete(`/api/v1/students/${id}`);
        showSuccess("Student deleted successfully");
        fetchData();
      } catch (err) {
        showError(err.response?.data?.message || "Failed to delete student");
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setForm({
      scholarNumber: "",
      name: "",
      email: "",
      mobile: "",
      currentSemester: 1,
      branch: "",
    });
    setEditingId(null);
  };

  const resetBulkForm = () => {
    setBulkForm({
      branchId: "",
      semester: 1,
      students: [],
    });
  };

  const showSuccess = (message) => {
    setSnackbar({ open: true, message, severity: "success" });
  };
  const showError = (message) => {
    setSnackbar({ open: true, message, severity: "error" });
  };
  const showWarning = (message) => {
    setSnackbar({ open: true, message, severity: "warning" });
  };

  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b._id === branchId);
    return branch ? branch.name : "Unknown";
  };

  return (
    <Box p={{ xs: 2, md: 6 }}>
      <Typography variant="h4" gutterBottom>Student Management Dashboard</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            disabled={loading}
          >
            Add Student
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setBulkImportOpen(true)}
            disabled={loading}
          >
            Bulk Import
          </Button>
        </Grid>
      </Grid>

      {/* Add/Edit Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Student" : "Add New Student"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Scholar Number"
            name="scholarNumber"
            value={form.scholarNumber}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Mobile"
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Current Semester</InputLabel>
            <Select
              name="currentSemester"
              value={form.currentSemester}
              onChange={handleChange}
              label="Current Semester"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Branch</InputLabel>
            <Select
              name="branch"
              value={form.branch}
              onChange={handleChange}
              label="Branch"
            >
              <MenuItem value="">
                <em>Select Branch</em>
              </MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch._id} value={branch._id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={18} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Modal */}
      <Dialog open={bulkImportOpen} onClose={() => setBulkImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Import Students</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Branch</InputLabel>
            <Select
              name="branchId"
              value={bulkForm.branchId}
              onChange={handleBulkChange}
              label="Branch"
            >
              <MenuItem value="">
                <em>Select Branch</em>
              </MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch._id} value={branch._id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Semester</InputLabel>
            <Select
              name="semester"
              value={bulkForm.semester}
              onChange={handleBulkChange}
              label="Semester"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Students JSON"
            name="students"
            value={JSON.stringify(bulkForm.students, null, 2)}
            onChange={handleBulkStudentsChange}
            fullWidth
            margin="normal"
            multiline
            rows={8}
            helperText='Example: [{"scholarNumber": "S001", "name": "John Doe", "email": "john@example.com", "mobile": "1234567890"}]'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkImportOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleBulkSubmit} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={18} /> : "Import"}
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Scholar Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student._id}>
                <TableCell>{student.scholarNumber}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.mobile || "N/A"}</TableCell>
                <TableCell>{student.currentSemester}</TableCell>
                <TableCell>{getBranchName(student.branch?._id || student.branch)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(student)} disabled={loading}>
                    <EditIcon color="primary" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(student._id)} disabled={loading}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!students.length && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
