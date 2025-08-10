import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, TextField, IconButton, Paper,
  FormControl, InputLabel, Select, MenuItem, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Card, CardHeader, CardContent, TablePagination, Menu
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  ImportExport as ImportExportIcon, FileDownload as FileDownloadIcon,
  School as SchoolIcon, MoreVert as MoreVertIcon
} from "@mui/icons-material";
import MuiAlert from "@mui/material/Alert";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    name: "",
    code: "",
    coordinator: "",
    type: "B.Tech",
    establishmentYear: new Date().getFullYear(),
    intakeCapacity: 30,
    numberOfSemesters: 8
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [viewBranches, setViewBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentBranchForImport, setCurrentBranchForImport] = useState(null);
  const [currentSemesterForImport, setCurrentSemesterForImport] = useState(null);
  const [semesterSelections, setSemesterSelections] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBranchForActions, setSelectedBranchForActions] = useState(null);

  const branchTypes = ["B.Tech", "M.Tech", "Dual Degree(B.Tech + M.Tech)", "MCA", "PhD"];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/v1/branches");
      console.log("Branches Response:", data);
      const branchesData = Array.isArray(data.data) ? data.data : (data.data || data.branches || []);
      setBranches(branchesData.map(branch => ({
        ...branch,
        coordinator: branch.coordinator || "N/A",
        type: branch.type || "N/A",
        establishmentYear: branch.establishmentYear || "N/A",
        intakeCapacity: branch.intakeCapacity || "N/A",
        numberOfSemesters: branch.numberOfSemesters || 8
      })));
      setError(null);
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsAndStudents = async (branchId, semester) => {
    try {
      const [subjectsRes, studentsRes] = await Promise.all([
        axios.get(`/api/v1/branches/${branchId}/subjects?semester=${semester}`),
        axios.get(`/api/v1/branches/${branchId}/students?semester=${semester}`)
      ]);
      console.log("Subjects Response:", subjectsRes.data);
      console.log("Students Response:", studentsRes.data);
      setSubjects(subjectsRes.data.data || []);
      setStudents(studentsRes.data.data || []);
    } catch (err) {
      console.error("Error fetching subjects/students:", err);
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await axios.put(`/api/v1/branches/${editId}`, form);
        setSnackbar({ open: true, message: "Branch updated successfully!", severity: "success" });
      } else {
        await axios.post("/api/v1/branches", form);
        setSnackbar({ open: true, message: "Branch added successfully!", severity: "success" });
      }
      setForm({
        name: "",
        code: "",
        coordinator: "",
        type: "B.Tech",
        establishmentYear: new Date().getFullYear(),
        intakeCapacity: 30,
        numberOfSemesters: 8
      });
      setEditId(null);
      setAddBranchOpen(false);
      await fetchBranches();
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.response?.data?.message || "Operation failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this branch?")) {
      setLoading(true);
      try {
        await axios.delete(`/api/v1/branches/${id}`);
        setSnackbar({ open: true, message: "Branch deleted successfully!", severity: "success" });
        await fetchBranches();
      } catch (err) {
        setError(err.message);
        setSnackbar({ open: true, message: err.response?.data?.message || "Delete failed", severity: "error" });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (branch) => {
    setForm({
      name: branch.name,
      code: branch.code,
      coordinator: branch.coordinator,
      type: branch.type,
      establishmentYear: branch.establishmentYear,
      intakeCapacity: branch.intakeCapacity || 30,
      numberOfSemesters: branch.numberOfSemesters || 8
    });
    setEditId(branch._id);
    setAddBranchOpen(true);
  };

  const handleSemesterChange = (branchId, semester) => {
    setSemesterSelections((prev) => ({
      ...prev,
      [branchId]: semester
    }));
    setSelectedBranch(branchId);
    setSelectedSemester(semester);
    if (semester) {
      fetchSubjectsAndStudents(branchId, semester);
    } else {
      setSubjects([]);
      setStudents([]);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleImportStudents = async () => {
    if (!selectedFile || !currentBranchForImport || !currentSemesterForImport) {
      setSnackbar({ open: true, message: "Please select a file, branch and semester", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      const students = await readExcelFile(selectedFile);
      const formattedStudents = students.map(student => ({
        scholarNumber: student["Scholar Number"]?.toString() || "",
        name: student["Name"]?.toString() || "",
        email: student["Email"]?.toString() || "",
        mobile: student["Phone"]?.toString() || "",
        currentSemester: parseInt(student["Current Semester"]) || currentSemesterForImport,
        branch: currentBranchForImport
      }));

      const invalidStudents = formattedStudents.filter(s => !s.scholarNumber || !s.name);
      if (invalidStudents.length > 0) {
        throw new Error(`${invalidStudents.length} students missing Scholar Number or Name`);
      }

      const response = await axios.post(
        `/api/v1/branches/${currentBranchForImport}/students/import`,
        {
          semester: currentSemesterForImport,
          students: formattedStudents
        }
      );

      setSnackbar({ open: true, message: response.data.message || `Successfully imported ${formattedStudents.length} students`, severity: "success" });
      fetchSubjectsAndStudents(currentBranchForImport, currentSemesterForImport);
      setImportDialogOpen(false);
      setSelectedFile(null);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || err.message || "Import failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          const worksheet = workbook.worksheets[0];
          const students = [];

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              students.push({
                "Scholar Number": row.getCell(1).value?.toString(),
                "Name": row.getCell(2).value?.toString(),
                "Email": row.getCell(3).value?.toString(),
                "Phone": row.getCell(4).value?.toString(),
                "Current Semester": row.getCell(5)?.value?.toString() || "1"
              });
            }
          });

          resolve(students);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const CELL_STYLE = {
    font: { bold: true },
    alignment: { horizontal: "center" },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFADD8E6" },
    },
  };

  const exportStudentsToExcel = async (branchId, semester) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Students");

      worksheet.columns = [
        { header: "Scholar Number", key: "scholarNumber", width: 15 },
        { header: "Name", key: "name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 15 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.style = CELL_STYLE;
      });

      worksheet.addRows(students);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `students_${branchId}_sem${semester}_${new Date()
          .toISOString()
          .split("T")[0]}.xlsx`
      );
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to export students",
        severity: "error",
      });
    }
  };

  const openImportDialog = (branchId, semester) => {
    setCurrentBranchForImport(branchId);
    setCurrentSemesterForImport(semester);
    setImportDialogOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Branch Management Dashboard
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setAddBranchOpen(true);
              setViewBranches(false);
            }}
          >
            Add Branch
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<SchoolIcon />}
            onClick={() => {
              setViewBranches(true);
              setAddBranchOpen(false);
            }}
          >
            View Branches
          </Button>
        </Grid>
      </Grid>

      {addBranchOpen && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {editId ? "Edit Branch" : "Add New Branch"}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Branch Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Branch Code"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Coordinator"
                  name="coordinator"
                  value={form.coordinator}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Branch Type</InputLabel>
                  <Select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    label="Branch Type"
                  >
                    {branchTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Establishment Year"
                  name="establishmentYear"
                  type="number"
                  value={form.establishmentYear}
                  onChange={handleChange}
                  required
                  InputProps={{
                    inputProps: {
                      min: 1950,
                      max: new Date().getFullYear(),
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Intake Capacity"
                  name="intakeCapacity"
                  type="number"
                  value={form.intakeCapacity}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Number of Semesters"
                  name="numberOfSemesters"
                  type="number"
                  value={form.numberOfSemesters}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" disabled={loading}>
                  {editId ? "Update" : "Add"} Branch
                </Button>
                <Button
                  sx={{ ml: 2 }}
                  onClick={() => {
                    setAddBranchOpen(false);
                    setEditId(null);
                    setForm({
                      name: "",
                      code: "",
                      coordinator: "",
                      type: "B.Tech",
                      establishmentYear: new Date().getFullYear(),
                      intakeCapacity: 30,
                      numberOfSemesters: 8,
                    });
                  }}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {viewBranches && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Existing Branches
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Branch Name</TableCell>
                  <TableCell>Branch Code</TableCell>
                  <TableCell>Branch Coordinator</TableCell>
                  <TableCell>Degree Type</TableCell>
                  <TableCell>Established Year</TableCell>
                  <TableCell>Intake Capacity</TableCell>
                  <TableCell>Semester</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((branch) => (
                  <React.Fragment key={branch._id}>
                    <TableRow>
                      <TableCell>{branch.name || "N/A"}</TableCell>
                      <TableCell>{branch.code || "N/A"}</TableCell>
                      <TableCell>{branch.coordinator || "N/A"}</TableCell>
                      <TableCell>{branch.type || "N/A"}</TableCell>
                      <TableCell>{branch.establishmentYear || "N/A"}</TableCell>
                      <TableCell>{branch.intakeCapacity || "N/A"}</TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>Select Semester</InputLabel>
                          <Select
                            value={semesterSelections[branch._id] || ""}
                            label="Select Semester"
                            onChange={(e) => handleSemesterChange(branch._id, e.target.value)}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {semesters.slice(0, branch.numberOfSemesters || 8).map((sem) => (
                              <MenuItem key={sem} value={sem}>
                                {sem}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnchorEl(e.currentTarget);
                            setSelectedBranchForActions(branch._id);
                          }}
                          aria-label="branch actions"
                        >
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl) && selectedBranchForActions === branch._id}
                          onClose={handleMenuClose}
                        >
                          <MenuItem onClick={() => {
                            handleEdit(branch);
                            handleMenuClose();
                          }}>
                            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                          </MenuItem>
                          <MenuItem onClick={() => {
                            handleDelete(branch._id);
                            handleMenuClose();
                          }}>
                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                          </MenuItem>
                        </Menu>
                      </TableCell>
                    </TableRow>
                    {selectedBranch === branch._id && selectedSemester && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <Box sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Card>
                                  <CardHeader title={`Subjects (Semester ${selectedSemester})`} />
                                  <CardContent>
                                    <Typography variant="subtitle1">
                                      Total Subjects: {subjects.length}
                                    </Typography>
                                    <TableContainer>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell>Subject Code</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Credits</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {subjects.map((subject) => (
                                            <TableRow key={subject._id}>
                                              <TableCell>{subject.code}</TableCell>
                                              <TableCell>{subject.name}</TableCell>
                                              <TableCell>{subject.credits}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Card>
                                  <CardHeader
                                    title={`Students (Semester ${selectedSemester})`}
                                    action={
                                      <>
                                        <IconButton
                                          onClick={() => openImportDialog(branch._id, selectedSemester)}
                                          aria-label="import students"
                                        >
                                          <ImportExportIcon />
                                        </IconButton>
                                        <IconButton
                                          onClick={() => exportStudentsToExcel(branch._id, selectedSemester)}
                                          aria-label="export students"
                                        >
                                          <FileDownloadIcon />
                                        </IconButton>
                                      </>
                                    }
                                  />
                                  <CardContent>
                                    <Typography variant="subtitle1">
                                      Total Students: {students.length}
                                    </Typography>
                                    <TableContainer>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell>Scholar Number</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Email</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {students.map((student) => (
                                            <TableRow key={student._id}>
                                              <TableCell>{student.scholarNumber}</TableCell>
                                              <TableCell>{student.name}</TableCell>
                                              <TableCell>{student.email}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </CardContent>
                                </Card>
                              </Grid>
                            </Grid>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={branches.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </Paper>
      )}

      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>Import Students</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              Select an Excel file containing student data. The file should include these columns in order:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Scholar Number</li>
              <li>Name</li>
              <li>Email</li>
              <li>Phone</li>
              <li>Current Semester</li>
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet("Students");

                worksheet.columns = [
                  { header: "Scholar Number", key: "scholarNumber", width: 15 },
                  { header: "Name", key: "name", width: 25 },
                  { header: "Email", key: "email", width: 30 },
                  { header: "Phone", key: "phone", width: 15 },
                  { header: "Current Semester", key: "currentSemester", width: 15 }
                ];

                worksheet.getRow(1).eachCell((cell) => {
                  cell.font = { bold: true };
                });

                worksheet.addRow({
                  scholarNumber: "2023001",
                  name: "Sample Student",
                  email: "sample@example.com",
                  phone: "1234567890",
                  currentSemester: 6
                });

                workbook.xlsx.writeBuffer().then((buffer) => {
                  const blob = new Blob([buffer], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  });
                  saveAs(blob, "students_import_template.xlsx");
                });
              }}
            >
              Download Template
            </Button>
          </Box>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ marginTop: "16px" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleImportStudents}
            variant="contained"
            disabled={!selectedFile || loading}
          >
            {loading ? "Importing..." : "Import"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}