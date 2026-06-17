import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../types/task';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

export function Column({ id, title, tasks }: ColumnProps) {
  // This hook makes the column itself a drop target
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2 text-slate-500">
        <h2 className="font-black uppercase text-[11px] tracking-[0.1em]">{title}</h2>
        <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-lg font-bold">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef} // Critical: Connects the droppable area
        className="bg-slate-200/40 p-3 rounded-3xl border border-slate-200/60 min-h-[600px] space-y-4"
      >
        <SortableContext 
          items={tasks.map(t => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="h-20 flex items-center justify-center text-slate-400 text-xs italic border-2 border-dashed border-slate-300 rounded-2xl">
            Drop tasks here
          </div>
        )}
      </div>
    </section>
  );
}