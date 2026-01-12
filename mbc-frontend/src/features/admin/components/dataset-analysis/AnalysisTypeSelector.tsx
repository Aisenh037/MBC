import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

interface AnalysisTypeSelectorProps {
    analysisType: string;
    setAnalysisType: (type: string) => void;
}

const AnalysisTypeSelector: React.FC<AnalysisTypeSelectorProps> = ({ analysisType, setAnalysisType }) => {
    const handleChange = (event: SelectChangeEvent) => {
        setAnalysisType(event.target.value as string);
    };

    return (
        <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Analysis Type</InputLabel>
            <Select
                value={analysisType}
                label="Analysis Type"
                onChange={handleChange}
            >
                <MenuItem value="summary">Summary Statistics</MenuItem>
                <MenuItem value="clustering">Clustering Analysis</MenuItem>
                <MenuItem value="classification">Classification (requires 'target' column)</MenuItem>
                <MenuItem value="regression">Regression (requires 'target' column)</MenuItem>
            </Select>
        </FormControl>
    );
};

export default AnalysisTypeSelector;
