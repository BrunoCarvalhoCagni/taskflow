import { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DndContext, 
  type DragEndEvent, 
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor, 
  useSensor, 
  useSensors, 
  closestCorners 
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';

import { TaskCard } from './components/TaskCard';
import { CreateTaskModal } from './components/CreateTaskModal';
import type { Task, TaskStatus } from './types/task';
import { Column } from './components/Column';

// API Base Configuration
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null); // Tracks the dragged card ID
  const queryClient = useQueryClient();

  // 1. Fetch Tasks from Go Backend
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data;
    },
  });

  // 2. Mutation to Create Task
  const createTaskMutation = useMutation({
    mutationFn: (newTask: Partial<Task>) => api.post('/tasks', newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // 3. Mutation to Update Status (Persistent sync)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => 
      api.patch(`/tasks/${id}/status`, { status }),
      
    // Step 1: When mutate is called
    onMutate: async (updatedTask) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
  
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
  
      // Optimistically update to the new value
      queryClient.setQueryData<Task[]>(['tasks'], (old) => {
        return old?.map(t => t.id === updatedTask.id ? { ...t, status: updatedTask.status } : t);
      });
  
      // Return a context object with the snapshotted value
      return { previousTasks };
    },
  
    // Step 2: If the mutation fails, use the context we returned above to roll back
    onError: (err, updatedTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      console.error("Failed to update task position:", err);
    },
  
    // Step 3: Always refetch after error or success to keep server in sync
    onSettled: () => {
      // Wait a bit before invalidating to ensure DB has finished the write
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }, 500); 
    },
  });

  // DnD Sensors setup (3px tolerance allows clicking card buttons without dragging)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  // Triggered the exact moment the user clicks and drags a card
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Triggered live while the card is moving across the screen (Optimistic UI update)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const draggedTask = tasks.find(t => t.id === activeId);
    if (!draggedTask) return;

    const isOverAColumn = ['todo', 'in_progress', 'done'].includes(overId);

    let targetStatus: TaskStatus | undefined;

    // Detect if we hovered over an empty column OR over another card inside a column
    if (isOverAColumn) {
      targetStatus = overId as TaskStatus;
    } else {
      const hoveredTask = tasks.find(t => t.id === overId);
      if (hoveredTask) targetStatus = hoveredTask.status;
    }

    // If the status changed, we force TanStack Query's cache to update instantly in memory
    if (targetStatus && draggedTask.status !== targetStatus) {
      queryClient.setQueryData<Task[]>(['tasks'], (oldTasks) => {
        if (!oldTasks) return [];
        return oldTasks.map(t => 
          t.id === activeId ? { ...t, status: targetStatus! } : t
        );
      });
    }
  };

  // Triggered when the user releases the mouse button
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null); // Hide the floating overlay
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const finalTask = tasks.find(t => t.id === activeId);

    if (finalTask) {
      // Send the final position to Golang
      updateStatusMutation.mutate({ 
        id: finalTask.id, 
        status: finalTask.status 
      });
    }
  };

  const columns: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ];

  // Find the complete task object for the floating overlay preview
  const activeTask = tasks.find(t => t.id === activeId);

  if (isLoading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 mb-8 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-tight">
            TaskFlow System
          </h1>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            + New Task
          </button>
        </div>
      </nav>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
          {columns.map((column) => (
            <Column
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasks.filter((t) => t.status === column.id)}
            />
          ))}
        </main>

        {/* Floating component that glues to the mouse during the drag */}
        {createPortal(
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={(data) => {
          createTaskMutation.mutate({
            ...data,
            id: crypto.randomUUID(),
          });
        }}
      />
    </div>
  );
}

export default App;