import React, { ChangeEvent } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface FileUploadProps {
    selectedFile: File | null;
    onFileChange: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ selectedFile, onFileChange }) => {
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'text/csv') {
            onFileChange(file);
        } else if (file) {
            alert('Please select a valid CSV file');
        }
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Upload Dataset
            </Typography>

            <Box sx={{ mb: 2 }}>
                <input
                    accept=".csv"
                    style={{ display: 'none' }}
                    id="dataset-file"
                    type="file"
                    onChange={handleFileChange}
                />
                <label htmlFor="dataset-file">
                    <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUpload />}
                        fullWidth
                    >
                        {selectedFile ? selectedFile.name : 'Choose CSV File'}
                    </Button>
                </label>
            </Box>

            {selectedFile && (
                <Typography variant="body2" color="textSecondary">
                    File size: {(selectedFile.size / 1024).toFixed(2)} KB
                </Typography>
            )}
        </Paper>
    );
};

export default FileUpload;
