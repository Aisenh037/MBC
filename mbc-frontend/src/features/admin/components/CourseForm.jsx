import React, { useState, useEffect } from 'react';

const CourseForm = ({ editingCourse, onClose }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingCourse) {
      setName(editingCourse.name || '');
      setCode(editingCourse.code || '');
      setDescription(editingCourse.description || '');
    }
  }, [editingCourse]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement form submission logic (create or update course)
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Course Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Course Code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button type="submit">{editingCourse ? 'Update' : 'Add'} Course</button>
      <button type="button" onClick={onClose}>Cancel</button>
    </form>
  );
};

export default CourseForm;
