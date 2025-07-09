import api from './axios'

export const getAssignments = () => api.get('/assignments')
export const createAssignment = (data) => api.post('/assignments', data)
export const updateAssignment = (id, data) => api.patch(`/assignments/${id}`, data)
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`)