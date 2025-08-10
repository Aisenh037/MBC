import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Tabs, Tab, Divider,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  ArrowBack, Search, ImportExport, 
  FilterAlt, CloudUpload, CloudDownload
} from '@mui/icons-material';
import { CSVLink } from 'react-csv';
import axios from 'axios';
import Papa from 'papaparse';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function BranchDetails() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [branch, setBranch] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    semester: '',
    residence: ''
  });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importResults, setImportResults] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [branchRes, semestersRes, studentsRes] = await Promise.all([
          axios.get(`/api/v1/branches/${branchId}`),
          axios.get(`/api/v1/branches/${branchId}/semesters`),
          axios.get(`/api/v1/branches/${branchId}/students`)
        ]);
        setBranch(branchRes.data);
        setSemesters(semestersRes.data);
        setStudents(studentsRes.data);
      } catch (error) {
        console.error('Error fetching branch details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [branchId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.scholarNumber.includes(searchTerm) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSemester = 
      !filters.semester || student.currentSemester === parseInt(filters.semester);
    
    const matchesResidence = 
      !filters.residence || 
      (filters.residence === 'hostel' && student.hostel) ||
      (filters.residence === 'day' && !student.hostel);
    
    return matchesSearch && matchesSemester && matchesResidence;
  });

  const handleImport = async () => {
    if (!csvFile) return;
    
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      
      const response = await axios.post(
        `/api/v1/branches/${branchId}/students/import`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      setImportResults({
        success: response.data.success,
        errors: response.data.errors
      });
      // Refresh student data
      const studentsRes = await axios.get(`/api/v1/branches/${branchId}/students`);
      setStudents(studentsRes.data);
    } catch (error) {
      setImportResults({
        success: false,
        errors: ['Import failed: ' + error.message]
      });
    }
  };

  const exportHeaders = [
    { label: 'Scholar Number', key: 'scholarNumber' },
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Mobile', key: 'mobile' },
    { label: 'Semester', key: 'currentSemester' },
    { label: 'Hostel Block', key: 'hostel.block' },
    { label: 'Hostel Room', key: 'hostel.room' }
  ];

  if (loading) return <Typography>Loading...</Typography>;
  if (!branch) return <Typography>Branch not found</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
        Back to Branches
      </Button>

      <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
        {branch.name} ({branch.code})
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        Coordinator: {branch.coordinator} | Intake: {branch.intakeCapacity}
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mt: 3 }}>
        <Tab label="Current Session" />
        <Tab label="All Students" />
        <Tab label="Semester Structure" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Current Academic Session (2023-24)
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          {semesters.filter(s => s.current).map(semester => (
            <Paper key={semester._id} sx={{ p: 2, minWidth: 200 }}>
              <Typography variant="subtitle1">
                Semester {semester.number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {semester.students.length} students
              </Typography>
            </Paper>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Current Semester Classes
        </Typography>
        {/* Add class schedule component here */}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Search and Filter Bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Semester</InputLabel>
            <Select
              value={filters.semester}
              label="Semester"
              onChange={(e) => setFilters({...filters, semester: e.target.value})}
            >
              <MenuItem value="">All</MenuItem>
              {[...Array(8).keys()].map(num => (
                <MenuItem key={num+1} value={num+1}>Sem {num+1}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Residence</InputLabel>
            <Select
              value={filters.residence}
              label="Residence"
              onChange={(e) => setFilters({...filters, residence: e.target.value})}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="hostel">Hosteller</MenuItem>
              <MenuItem value="day">Day Scholar</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button 
            startIcon={<CloudUpload />} 
            onClick={() => setImportDialogOpen(true)}
            variant="outlined"
          >
            Import
          </Button>
          
          <CSVLink 
            data={filteredStudents} 
            headers={exportHeaders}
            filename={`${branch.code}_students.csv`}
            style={{ textDecoration: 'none' }}
          >
            <Button startIcon={<CloudDownload />} variant="outlined">
              Export
            </Button>
          </CSVLink>
        </Box>

        {/* Student Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Scholar No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Residence</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map(student => (
                <TableRow key={student._id}>
                  <TableCell>{student.scholarNumber}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.branch.name}</TableCell>
                  <TableCell>
                    <Chip label={`Sem ${student.currentSemester}`} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography>{student.email}</Typography>
                      <Typography variant="body2">{student.mobile}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {student.hostel 
                      ? `Hostel ${student.hostel.block}-${student.hostel.room}` 
                      : 'Day Scholar'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
          <DialogTitle>Import Students</DialogTitle>
          <DialogContent>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
            />
            {importResults && (
              <Box sx={{ mt: 2 }}>
                {importResults.success > 0 && (
                  <Typography color="success.main">
                    Successfully imported {importResults.success} students
                  </Typography>
                )}
                {importResults.errors?.map((error, i) => (
                  <Typography key={i} color="error">
                    {error}
                  </Typography>
                ))}
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                CSV format: scholarNumber,name,email,mobile,currentSemester,hostelBlock,hostelRoom
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleImport} 
              disabled={!csvFile}
              variant="contained"
              color="primary"
            >
              Import
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Semester Structure
        </Typography>
        {/* Add semester curriculum component here */}
      </TabPanel>
    </Box>
  );
}