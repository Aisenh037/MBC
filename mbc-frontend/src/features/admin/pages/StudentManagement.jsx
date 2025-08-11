// src/features/admin/dashboard/admin/StudentManagement.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Select, MenuItem, InputLabel, FormControl,
  Grid, IconButton, CircularProgress
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CloudUpload as UploadIcon } from "@mui/icons-material";
import { useNotify } from '../../../components/UI/NotificationProvider';

// ✨ Use central API services
import { getStudents, addStudent, updateStudent, deleteStudent } from '../../../../src/api/student.js';
import { getBranches } from '../../../../src/api/branch.js';

// Add/Edit Student Dialog Component
const StudentFormDialog = ({ open, onClose, editingStudent, branches, onSave }) => {
  const [form, setForm] = useState({
    scholarNumber: "",
    name: "",
    email: "",
    mobile: "",
    currentSemester: 1,
    branch: "",
  });
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    if (editingStudent) {
      setForm({
        scholarNumber: editingStudent.scholarNumber || "",
        name: editingStudent.name || "",
        email: editingStudent.email || "",
        mobile: editingStudent.mobile || "",
        currentSemester: editingStudent.currentSemester || 1,
        branch: editingStudent.branch?._id || editingStudent.branch || "",
      });
    } else {
      setForm({
        scholarNumber: "", name: "", email: "", mobile: "", currentSemester: 1, branch: ""
      });
    }
  }, [editingStudent, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.scholarNumber || !form.name || !form.email || !form.branch) {
      notify("Please fill all required fields", "error");
      return;
    }
    setLoading(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent._id, form);
        notify("Student updated successfully", "success");
      } else {
        await addStudent(form);
        notify("Student added successfully", "success");
      }
      onSave(); // Callback to refresh data and close
    } catch (err) {
      notify(err.response?.data?.error || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
      <DialogContent>
        {/* Form Fields... */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentRes, branchRes] = await Promise.all([getStudents(), getBranches()]);
      setStudents(studentRes.data.data || []);
      setBranches(branchRes.data.data || []);
    } catch (err) {
      notify("Failed to fetch data. Please check if the backend server is running.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (student = null) => {
    setEditingStudent(student);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingStudent(null);
    setDialogOpen(false);
  };

  const handleSave = () => {
    handleCloseDialog();
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteStudent(id);
        notify("Student deleted successfully", "success");
        fetchData();
      } catch (err) {
        notify(err.response?.data?.error || "Failed to delete student", "error");
      }
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Student Management</Typography>
      <Box sx={{ mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Student
        </Button>
        {/* Add Bulk Import Button Here If Needed */}
      </Box>

      <StudentFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        editingStudent={editingStudent}
        branches={branches}
        onSave={handleSave}
      />

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Scholar Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center"><CircularProgress /></TableCell>
              </TableRow>
            ) : students.map((student) => (
              <TableRow key={student._id}>
                <TableCell>{student.scholarNumber}</TableCell>
                <TableCell>{student.user?.name || 'N/A'}</TableCell>
                <TableCell>{student.user?.email || 'N/A'}</TableCell>
                <TableCell>{student.branch?.name || 'N/A'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(student)}>
                    <EditIcon color="primary" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(student._id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}