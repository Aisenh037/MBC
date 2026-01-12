import React, { useState } from 'react';
import { Container, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { Analytics } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import axios from '../../../api/axios';
import { FileUpload, AnalysisTypeSelector, ResultsDisplay } from '../components/dataset-analysis';

// Defined locally or imported from a types file if available
interface SummaryStats {
    count: number;
    mean: number;
    std: number;
    min: number;
    max: number;
}

interface AnalysisResultsData {
    summary?: Record<string, SummaryStats>;
    clusters?: (string | number)[];
    classification?: Record<string, number>;
    regression?: Record<string, number>;
}

interface AnalysisResponse {
    success: boolean;
    data: AnalysisResultsData;
    error?: string;
}

interface AnalyzeMutationParams {
    file: File;
    analysisType: string;
}

const DatasetAnalysis: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [analysisType, setAnalysisType] = useState<string>('summary');
    const [results, setResults] = useState<AnalysisResponse | null>(null);

    const analyzeMutation = useMutation<AnalysisResponse, Error, AnalyzeMutationParams>({
        mutationFn: async ({ file, analysisType }) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('analysis_type', analysisType);

            const response = await axios.post<AnalysisResponse>('/dataset/analyze', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            setResults(data);
        },
    });

    const handleAnalyze = () => {
        if (!selectedFile) {
            alert('Please select a file first');
            return;
        }
        analyzeMutation.mutate({ file: selectedFile, analysisType });
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dataset Analysis
            </Typography>

            <FileUpload selectedFile={selectedFile} onFileChange={setSelectedFile} />

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Analysis Configuration
                </Typography>

                <AnalysisTypeSelector
                    analysisType={analysisType}
                    setAnalysisType={setAnalysisType}
                />

                <Button
                    variant="contained"
                    onClick={handleAnalyze}
                    disabled={!selectedFile || analyzeMutation.isPending}
                    fullWidth
                    sx={{ mt: 2 }}
                >
                    {analyzeMutation.isPending ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Analyzing...
                        </>
                    ) : (
                        'Analyze Dataset'
                    )}
                </Button>
            </Paper>

            {analyzeMutation.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Error analyzing dataset: {analyzeMutation.error.message}
                </Alert>
            )}

            {results && results.success && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom color="primary">
                        Analysis Results
                    </Typography>
                    <ResultsDisplay analysisType={analysisType} results={results.data} />
                </Paper>
            )}
        </Container>
    );
};

export default DatasetAnalysis;
