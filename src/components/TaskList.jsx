import React from 'react';
import TaskItem from './TaskItem';

export default function TaskList({ tasks, onTaskCompleted, showDelete = false }) {
  return (
    <div className="task-list">
      {tasks.map(task => (
        <TaskItem 
          key={task.id} 
          task={task}
          onCompleted={onTaskCompleted}
          showDelete={showDelete}
        />
      ))}
    </div>
  );
}