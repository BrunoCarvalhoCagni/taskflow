import { Clock, MoreVertical, CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import type { Task, TaskPriority } from '../types/task';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  // Map priority levels to specific Tailwind CSS classes
  const priorityStyles: Record<TaskPriority, string> = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-rose-100 text-rose-700',
  };

  // Render status icon based on current task state
  const renderStatusIcon = () => {
    switch (task.status) {
      case 'in_progress':
        return <PlayCircle size={16} className="text-amber-500" />;
      case 'done':
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      default:
        return <Circle size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group">
      {/* Header: Priority Badge & Options */}
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Content: Title & Description */}
      <h3 className="font-semibold text-slate-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors">
        {task.title}
      </h3>
      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
        {task.description}
      </p>

      {/* Footer: Status & Metadata */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2 text-slate-600">
          {renderStatusIcon()}
          <span className="text-xs font-medium capitalize">
            {task.status.replace('_', ' ')}
          </span>
        </div>
        
        <div className="flex items-center text-slate-400 gap-1">
          <Clock size={12} />
          <span className="text-[10px]">Just now</span>
        </div>
      </div>
    </div>
  );
}