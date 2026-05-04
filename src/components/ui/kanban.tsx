"use client"

import * as React from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Modifier,
} from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { CSS } from "@dnd-kit/utilities"
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"

// =============================================================================
// Types
// =============================================================================

export interface KanbanColumn {
  id: string
  title: string
  /** Background tint class (e.g. "bg-pastel-purple") */
  toneClass?: string
  /** Optional subtitle next to count (e.g. "WIP 3/5") */
  subtitle?: React.ReactNode
}

export interface KanbanCardData {
  id: string
  columnId: string
}

interface KanbanBoardProps<TCard extends KanbanCardData> {
  columns: KanbanColumn[]
  cards: TCard[]
  /** Render a card body */
  renderCard: (card: TCard) => React.ReactNode
  /** Optional drag-overlay renderer (defaults to renderCard) */
  renderOverlay?: (card: TCard) => React.ReactNode
  /** Fired when a card is dropped to a different column */
  onCardMove?: (cardId: string, fromColumnId: string, toColumnId: string) => void | Promise<void>
  /** Show empty-column placeholder text */
  emptyText?: string
  /** Disable drag interactions */
  disabled?: boolean
  className?: string
}

// =============================================================================
// Board
// =============================================================================

const modifiers: Modifier[] = [restrictToWindowEdges]

export function KanbanBoard<TCard extends KanbanCardData>({
  columns,
  cards,
  renderCard,
  renderOverlay,
  onCardMove,
  emptyText = "ไม่มีงานในคอลัมน์นี้",
  disabled,
  className,
}: KanbanBoardProps<TCard>) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  // Local override for optimistic moves so the UI reacts instantly while the
  // mutation flies. Map of cardId → columnId.
  const [optimistic, setOptimistic] = React.useState<Record<string, string>>({})

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  )

  // Apply optimistic columnId
  const effectiveCards = React.useMemo(
    () =>
      cards.map((c) => {
        const override = optimistic[c.id]
        return override ? { ...c, columnId: override } : c
      }),
    [cards, optimistic],
  )

  // Reconcile: if upstream data confirms the optimistic state, drop the override
  React.useEffect(() => {
    setOptimistic((prev) => {
      const next: Record<string, string> = {}
      for (const [id, colId] of Object.entries(prev)) {
        const upstream = cards.find((c) => c.id === id)
        if (upstream && upstream.columnId !== colId) next[id] = colId
      }
      return next
    })
  }, [cards])

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const cardId = String(e.active.id)
    const overId = e.over?.id ? String(e.over.id) : null
    if (!overId) return

    const card = effectiveCards.find((c) => c.id === cardId)
    if (!card) return

    // Drop target may be a column id or another card id (sortable list)
    let toColumnId = overId
    const overCard = effectiveCards.find((c) => c.id === overId)
    if (overCard) toColumnId = overCard.columnId

    if (toColumnId === card.columnId) return
    const fromColumnId = card.columnId

    // Optimistic update
    setOptimistic((prev) => ({ ...prev, [cardId]: toColumnId }))

    try {
      await onCardMove?.(cardId, fromColumnId, toColumnId)
    } catch {
      // Revert on failure
      setOptimistic((prev) => {
        const next = { ...prev }
        delete next[cardId]
        return next
      })
    }
  }

  const activeCard = activeId
    ? effectiveCards.find((c) => c.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={modifiers}
    >
      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-2",
          // Mobile gives 85% column width to hint at scroll
          "[&>div]:w-[85vw] [&>div]:shrink-0 sm:[&>div]:w-72 lg:[&>div]:w-80",
          className,
        )}
        role="list"
      >
        {columns.map((col) => {
          const colCards = effectiveCards.filter((c) => c.columnId === col.id)
          return (
            <BoardColumn
              key={col.id}
              column={col}
              cards={colCards}
              renderCard={renderCard}
              emptyText={emptyText}
              disabled={disabled}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="rotate-1 cursor-grabbing">
            {(renderOverlay ?? renderCard)(activeCard)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// =============================================================================
// Column (droppable wrapper)
// =============================================================================

interface BoardColumnProps<TCard extends KanbanCardData> {
  column: KanbanColumn
  cards: TCard[]
  renderCard: (card: TCard) => React.ReactNode
  emptyText: string
  disabled?: boolean
}

function BoardColumn<TCard extends KanbanCardData>({
  column,
  cards,
  renderCard,
  emptyText,
  disabled,
}: BoardColumnProps<TCard>) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, disabled })

  return (
    <div
      role="listitem"
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-2xl border border-border p-2 transition-colors",
        column.toneClass || "bg-muted/40",
        isOver && "ring-2 ring-primary/40",
      )}
    >
      <header className="flex items-center justify-between gap-2 px-2 pb-2">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {column.title}
        </h3>
        <span className="inline-flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          {column.subtitle}
          <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-bold text-foreground">
            {cards.length}
          </span>
        </span>
      </header>

      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto px-1 pb-2">
          {cards.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border/60 bg-card/40 px-3 py-8 text-center text-xs text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            cards.map((card) => (
              <SortableCard key={card.id} id={card.id} disabled={disabled}>
                {renderCard(card)}
              </SortableCard>
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// =============================================================================
// Sortable card wrapper
// =============================================================================

function SortableCard({
  id,
  disabled,
  children,
}: {
  id: string
  disabled?: boolean
  children: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none rounded-xl bg-card shadow-[var(--shadow-resting)] ring-1 ring-border/60 transition-opacity",
        isDragging && "opacity-30",
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

// Re-export so consumers can build custom card layouts that respond to drag
export { useDraggable, useDroppable }
