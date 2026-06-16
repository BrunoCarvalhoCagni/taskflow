import { useState } from 'react';
import { TaskCard } from './components/TaskCard';
import { CreateTaskModal } from './components/CreateTaskModal';
import type { Task } from './types/task';

function App() {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // For now, we'll use local state to simulate adding tasks
  // Later we will replace this with TanStack Query and the Go API
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Initialize Backend API',
      description: 'Setup Golang with Gin framework and PostgreSQL connection.',
      status: 'done',
      priority: 'high',
      createdAt: new Date().toISOString(),
    }
  ]);

  const handleCreateTask = (data: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
    console.log('Task created locally:', newTask);
  };

  const columns = [
    { id: 'todo', title: 'To Do', tasks: tasks.filter(t => t.status === 'todo') },
    { id: 'in_progress', title: 'In Progress', tasks: tasks.filter(t => t.status === 'in_progress') },
    { id: 'done', title: 'Done', tasks: tasks.filter(t => t.status === 'done') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 mb-8 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TaskFlow System
          </h1>
          <button 
            onClick={() => setIsModalOpen(true)} // Open Modal
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            + New Task
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {columns.map((column) => (
          <section key={column.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2 text-slate-500">
              <h2 className="font-bold uppercase text-xs tracking-wider">{column.title}</h2>
              <span className="bg-slate-200 text-xs px-2 py-0.5 rounded-full font-bold">
                {column.tasks.length}
              </span>
            </div>

            <div className="bg-slate-100/50 p-3 rounded-2xl border border-slate-200/50 min-h-[500px] space-y-4">
              {column.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Modal Component */}
      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateTask}
      />
    </div>
  );
}

export default App;