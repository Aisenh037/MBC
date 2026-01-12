# Dataset Analysis Components

This directory contains modular React components for the Dataset Analysis feature.

## Components

### FileUpload
- **Purpose**: Handles CSV file selection and validation
- **Props**:
  - `selectedFile`: Current selected file object
  - `onFileChange`: Callback function when file changes
- **Features**: File size display, CSV validation

### AnalysisTypeSelector
- **Purpose**: Dropdown selector for choosing analysis type
- **Props**:
  - `analysisType`: Current selected analysis type
  - `setAnalysisType`: Callback to update analysis type
- **Options**: Summary, Clustering, Classification, Regression

### ResultsDisplay
- **Purpose**: Renders analysis results based on type
- **Props**:
  - `analysisType`: Type of analysis performed
  - `results`: Analysis results data
- **Features**: Conditional rendering for different result types

## Usage

```jsx
import { FileUpload, AnalysisTypeSelector, ResultsDisplay } from '../components/dataset-analysis';

// In your component
<FileUpload selectedFile={selectedFile} onFileChange={setSelectedFile} />
<AnalysisTypeSelector analysisType={analysisType} setAnalysisType={setAnalysisType} />
<ResultsDisplay analysisType={analysisType} results={results} />
```

## Architecture Benefits

- **Modularity**: Each component has a single responsibility
- **Reusability**: Components can be used independently
- **Maintainability**: Easier to update and test individual components
- **Scalability**: New analysis types can be added by extending ResultsDisplay
