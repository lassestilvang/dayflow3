import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedForm } from '@/components/forms/UnifiedForm';
import { TaskList } from '@/components/tasks/TaskList';
import { Task } from '@/types';

// Mock tasks for testing
const mockTasks: Task[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'Test Task',
    description: 'Test description',
    listId: 'list-1',
    priority: 'medium',
    completed: false,
    dueDate: new Date('2024-01-25'),
    scheduledDate: new Date('2024-01-22'),
    scheduledTime: '10:00',
    allDay: false,
    duration: 60,
    subtasks: [
      { id: '1', title: 'Subtask 1', completed: false },
      { id: '2', title: 'Subtask 2', completed: true },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('UnifiedForm', () => {
  it('should render task form fields', () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <UnifiedForm
        type="task"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/category/i)).toBeInTheDocument();
    expect(screen.getByText(/priority/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should populate form with task data when editing', () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <UnifiedForm
        type="task"
        task={mockTasks[0]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update task/i })).toBeInTheDocument();
  });

  it('should call onSubmit when form is submitted', () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <UnifiedForm
        type="task"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Task',
      }),
      'task'
    );
  });

  it('should call onCancel when cancel button is clicked', () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <UnifiedForm
        type="task"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should add subtasks', () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <UnifiedForm
        type="task"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const subtaskInput = screen.getByPlaceholderText(/add subtask/i);
    fireEvent.change(subtaskInput, { target: { value: 'New Subtask' } });

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(screen.getByText('New Subtask')).toBeInTheDocument();
  });
});

describe('TaskList', () => {
  it('should render task list with title and count', () => {
    const mockOnTaskClick = jest.fn();
    const mockOnTaskToggle = jest.fn();
    const mockOnTaskDelete = jest.fn();

    render(
      <TaskList
        tasks={mockTasks}
        title="Test Tasks"
        onTaskClick={mockOnTaskClick}
        onTaskToggle={mockOnTaskToggle}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('Test Tasks')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Task count badge
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should show empty state when no tasks', () => {
    const mockOnTaskClick = jest.fn();
    const mockOnTaskToggle = jest.fn();
    const mockOnTaskDelete = jest.fn();

    render(
      <TaskList
        tasks={[]}
        title="No Tasks"
        onTaskClick={mockOnTaskClick}
        onTaskToggle={mockOnTaskToggle}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('No tasks found')).toBeInTheDocument();
  });

  it('should call onTaskToggle when checkbox is clicked', () => {
    const mockOnTaskClick = jest.fn();
    const mockOnTaskToggle = jest.fn();
    const mockOnTaskDelete = jest.fn();

    render(
      <TaskList
        tasks={mockTasks}
        title="Test Tasks"
        onTaskClick={mockOnTaskClick}
        onTaskToggle={mockOnTaskToggle}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnTaskToggle).toHaveBeenCalledWith('1');
  });

  it('should call onTaskClick when task is clicked', () => {
    const mockOnTaskClick = jest.fn();
    const mockOnTaskToggle = jest.fn();
    const mockOnTaskDelete = jest.fn();

    render(
      <TaskList
        tasks={mockTasks}
        title="Test Tasks"
        onTaskClick={mockOnTaskClick}
        onTaskToggle={mockOnTaskToggle}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const taskContent = screen.getByText('Test Task').closest('.flex-1');
    fireEvent.click(taskContent!);

    expect(mockOnTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('should display task metadata correctly', () => {
    const mockOnTaskClick = jest.fn();
    const mockOnTaskToggle = jest.fn();
    const mockOnTaskDelete = jest.fn();

    render(
      <TaskList
        tasks={mockTasks}
        title="Test Tasks"
        onTaskClick={mockOnTaskClick}
        onTaskToggle={mockOnTaskToggle}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('work')).toBeInTheDocument(); // Category
    expect(screen.getByText('medium')).toBeInTheDocument(); // Priority
    expect(screen.getByText('Jan 25, 2024')).toBeInTheDocument(); // Due date
    expect(screen.getByText('Jan 22, 2024 at 10:00')).toBeInTheDocument(); // Scheduled date and time
    expect(screen.getByText('60min')).toBeInTheDocument(); // Duration
    expect(screen.getByText('Subtasks (1/2)')).toBeInTheDocument(); // Subtasks count
  });
});