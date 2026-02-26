import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative flex items-start gap-2 bg-white rounded-md">
      <div 
        {...attributes} 
        {...listeners} 
        className="mt-4 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
      >
        <GripVertical size={20} />
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
