import { DataGrid } from '@mui/x-data-grid'
import { useGetAssignments } from './userAssignment'

export default function AssignmentsPage() {
  const { data, isLoading } = useGetAssignments()

  const columns = [
    { field: 'title', headerName: 'Title', width: 200 },
    { field: 'dueDate', headerName: 'Due Date', width: 150 }
  ]

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={data || []}
        columns={columns}
        loading={isLoading}
      />
    </div>
  )
}
