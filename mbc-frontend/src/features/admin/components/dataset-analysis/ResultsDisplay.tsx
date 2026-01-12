import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';

interface SummaryStats {
    count: number;
    mean: number;
    std: number;
    min: number;
    max: number;
}

interface AnalysisResults {
    summary?: Record<string, SummaryStats>;
    clusters?: (string | number)[];
    classification?: Record<string, number>;
    regression?: Record<string, number>;
}

interface ResultsDisplayProps {
    analysisType: string;
    results: AnalysisResults | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ analysisType, results }) => {
    if (!results) return null;

    const renderSummary = () => {
        const { summary } = results;
        if (!summary) return <Typography>No summary data available.</Typography>;

        return (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small" aria-label="summary statistics">
                    <TableHead>
                        <TableRow>
                            <TableCell>Column</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Mean</TableCell>
                            <TableCell>Std</TableCell>
                            <TableCell>Min</TableCell>
                            <TableCell>Max</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(summary).map(([column, stats]) => (
                            <TableRow key={column}>
                                <TableCell>{column}</TableCell>
                                <TableCell>{stats.count || 'N/A'}</TableCell>
                                <TableCell>{stats.mean ? stats.mean.toFixed(2) : 'N/A'}</TableCell>
                                <TableCell>{stats.std ? stats.std.toFixed(2) : 'N/A'}</TableCell>
                                <TableCell>{stats.min || 'N/A'}</TableCell>
                                <TableCell>{stats.max || 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderClustering = () => {
        const { clusters } = results;
        if (!clusters) return <Typography>No clustering data available.</Typography>;

        return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Cluster Assignments</Typography>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                    {clusters.map((cluster, idx) => (
                        <Grid item key={idx}>
                            <Chip label={`Cluster ${cluster}`} color="primary" />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    const renderClassification = () => {
        const { classification } = results;
        if (!classification) return <Typography>No classification data available.</Typography>;

        return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Classification Report</Typography>
                <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table size="small" aria-label="classification report">
                        <TableHead>
                            <TableRow>
                                <TableCell>Metric</TableCell>
                                <TableCell>Score</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(classification).map(([metric, score]) => (
                                <TableRow key={metric}>
                                    <TableCell>{metric}</TableCell>
                                    <TableCell>{score.toFixed(3)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    const renderRegression = () => {
        const { regression } = results;
        if (!regression) return <Typography>No regression data available.</Typography>;

        return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Regression Metrics</Typography>
                <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table size="small" aria-label="regression metrics">
                        <TableHead>
                            <TableRow>
                                <TableCell>Metric</TableCell>
                                <TableCell>Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(regression).map(([metric, value]) => (
                                <TableRow key={metric}>
                                    <TableCell>{metric}</TableCell>
                                    <TableCell>{value.toFixed(3)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    return (
        <Box>
            {analysisType === 'summary' && renderSummary()}
            {analysisType === 'clustering' && renderClustering()}
            {analysisType === 'classification' && renderClassification()}
            {analysisType === 'regression' && renderRegression()}
        </Box>
    );
};

export default ResultsDisplay;
