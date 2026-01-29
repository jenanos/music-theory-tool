
"use client";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Section } from "../data";

interface TimelineItem {
    id: string; // Unique ID for dnd (e.g. "verse-0", "verse-1")
    sectionId: string;
}

interface TimelineProps {
    items: TimelineItem[]; // The arrangement with unique IDs
    sections: Section[]; // To look up labels
    onReorder: (newItems: TimelineItem[]) => void;
    onSelect?: (videoTime: number) => void; // Placeholder
}

function SortableItem(props: {
    id: string;
    sectionId: string;
    label: string;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex-shrink-0 cursor-grab rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-400 active:cursor-grabbing ${isDragging ? "opacity-50 z-50 ring-2 ring-indigo-500" : ""
                }`}
        >
            {props.label}
        </div>
    );
}

export function Timeline({ items, sections, onReorder }: TimelineProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            onReorder(arrayMove(items, oldIndex, newIndex));
        }
    }

    // Helper to find label
    const getLabel = (sectionId: string) => {
        return sections.find((s) => s.id === sectionId)?.label || sectionId;
    };

    return (
        <div className="flex flex-col h-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex-none p-4 border-b border-slate-200">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Arrangement
                </h3>
                <div className="mt-1 text-xs text-slate-400">
                    Dra og slipp for å endre rekkefølge.
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map((i) => i.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-2">
                            {items.map((item) => (
                                <SortableItem
                                    key={item.id}
                                    id={item.id}
                                    sectionId={item.sectionId}
                                    label={getLabel(item.sectionId)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
