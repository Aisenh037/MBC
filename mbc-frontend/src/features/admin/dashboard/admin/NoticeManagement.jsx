import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Select, MenuItem, InputLabel, FormControl, Snackbar, IconButton, CircularProgress
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import MuiAlert from "@mui/material/Alert";
import axios from "axios";

// Adjust baseURL as needed
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
});

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function NoticeManagement() {
  const [notices, setNotices] = useState([]);
  const [classes, setClasses] = useState([]); // For target: class
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    target: "all",
    class: "",
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

  // Fetch notices and classes (for target: class)
  const fetchData = async () => {
    setLoading(true);
    try {
      const [noticeRes, classRes] = await Promise.all([
        api.get("/api/v1/notices").catch(() => ({ data: { data: [] } })),
        api.get("/api/v1/classes").catch(() => ({ data: { data: [] } })),
      ]);
      setNotices(Array.isArray(noticeRes.data.data) ? noticeRes.data.data : []);
      setClasses(Array.isArray(classRes.data.data) ? classRes.data.data : []);
    } catch (err) {
      showError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.target) {
      showError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (form.target !== "class") payload.class = "";
      if (editingId) {
        await api.put(`/api/v1/notices/${editingId}`, payload);
        showSuccess("Notice updated.");
      } else {
        await api.post("/api/v1/notices", payload);
        showSuccess("Notice added.");
      }
      fetchData();
      setOpen(false);
      resetForm();
    } catch (err) {
      showError(err.response?.data?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (notice) => {
    setForm({
      title: notice.title || "",
      content: notice.content || "",
      target: notice.target || "all",
      class: notice.class?._id || notice.class || "",
    });
    setEditingId(notice._id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      setLoading(true);
      try {
        await api.delete(`/api/v1/notices/${id}`);
        showSuccess("Notice deleted.");
        fetchData();
      } catch (err) {
        showError("Failed to delete notice.");
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      target: "all",
      class: "",
    });
    setEditingId(null);
  };

  const showSuccess = (message) => {
    setSnackbar({ open: true, message, severity: "success" });
  };
  const showError = (message) => {
    setSnackbar({ open: true, message, severity: "error" });
  };

  const getClassName = (classId) => {
    const c = classes.find((cl) => cl._id === classId);
    return c ? c.name : "";
  };

  return (
    <Box p={{ xs: 2, md: 6 }}>
      <Typography variant="h4" gutterBottom>Notice Management</Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        disabled={loading}
        sx={{ mb: 3 }}
      >
        Add Notice
      </Button>

      {/* Add/Edit Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Notice" : "Add Notice"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Content"
            name="content"
            value={form.content}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            minRows={3}
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Target</InputLabel>
            <Select
              name="target"
              value={form.target}
              onChange={handleChange}
              label="Target"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="students">Students</MenuItem>
              <MenuItem value="teachers">Teachers</MenuItem>
              <MenuItem value="class">Class</MenuItem>
            </Select>
          </FormControl>
          {form.target === "class" && (
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Class</InputLabel>
              <Select
                name="class"
                value={form.class}
                onChange={handleChange}
                label="Class"
              >
                <MenuItem value="">
                  <em>Select Class</em>
                </MenuItem>
                {classes.map((c) => (
                  <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={18} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notices.map((notice) => (
              <TableRow key={notice._id}>
                <TableCell>{notice.title}</TableCell>
                <TableCell>{notice.content}</TableCell>
                <TableCell>{notice.target}</TableCell>
                <TableCell>
                  {notice.target === "class"
                    ? getClassName(notice.class?._id || notice.class)
                    : "-"}
                </TableCell>
                <TableCell>
                  {notice.createdAt ? new Date(notice.createdAt).toLocaleString() : ""}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(notice)} disabled={loading}>
                    <EditIcon color="primary" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(notice._id)} disabled={loading}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!notices.length && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No notices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
