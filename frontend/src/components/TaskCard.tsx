import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, CheckCircle2, Circle} from 'lucide-react';
import type { Task, TaskPriority } from '../types/task';

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

export function TaskCard({ task, isOverlay }: TaskCardProps) {
  // dnd-kit hook for sortable items
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, disabled: isOverlay });

  const style = {
    // CSS.Translate is generally smoother than CSS.Transform for simple dragging
    transform: CSS.Translate.toString(transform),
    // Disable transition while dragging to keep the card "glued" to the cursor
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : undefined,
    position: 'relative' as const,
  };

  const priorityStyles: Record<TaskPriority, string> = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-rose-100 text-rose-700',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border border-slate-200 p-4 rounded-xl shadow-sm transition-shadow cursor-grab active:cursor-grabbing group touch-none select-none ${
        isDragging ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      <h3 className="font-semibold text-slate-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors">
        {task.title}
      </h3>
      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
        {task.description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2 text-slate-600">
          {task.status === 'done' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-slate-400" />}
          <span className="text-xs font-medium capitalize">{task.status.replace('_', ' ')}</span>
        </div>
      </div>
    </div>
  );
}