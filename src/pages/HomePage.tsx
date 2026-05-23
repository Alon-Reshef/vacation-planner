import { useMemo, useState, type FormEvent } from 'react'
import { useApp } from '../context/AppContext'
import type { TravelDay } from '../types'
import {
  Button,
  EmptyState,
  Fab,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  TextArea,
} from '../components/ui'

const emptyDay = (): Omit<TravelDay, 'id'> => ({
  date: new Date().toISOString().slice(0, 10),
  hotelId: null,
  activities: '',
  travelToNext: '',
  notes: '',
})

function formatDate(dateStr: string) {
  if (!dateStr) return 'No date'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function HomePage() {
  const { state, canEdit, addDay, updateDay, deleteDay } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TravelDay | null>(null)
  const [form, setForm] = useState(emptyDay())

  const hotelMap = useMemo(
    () => new Map((state?.hotels ?? []).map((h) => [h.id, h])),
    [state?.hotels],
  )

  const daysUntilTrip = useMemo(() => {
    const first = state?.days[0]?.date
    if (!first) return null
    const diff = Math.ceil(
      (new Date(first + 'T12:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )
    return diff
  }, [state?.days])

  if (!state) return null

  function openAdd() {
    setEditing(null)
    setForm(emptyDay())
    setModalOpen(true)
  }

  function openEdit(day: TravelDay) {
    setEditing(day)
    setForm({
      date: day.date,
      hotelId: day.hotelId,
      activities: day.activities,
      travelToNext: day.travelToNext,
      notes: day.notes,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) await updateDay(editing.id, form)
    else await addDay(form)
    setModalOpen(false)
  }

  return (
    <>
      <PageHeader
        title={state.settings.pageTitles.home}
        subtitle={
          daysUntilTrip !== null && daysUntilTrip > 0
            ? `${daysUntilTrip} days until your adventure begins`
            : 'Your day-by-day itinerary'
        }
      />

      {state.days.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title="No travel days yet"
          description="Tap + to add your first day — date, hotel, activities, and how you get to the next stop."
        />
      ) : (
        <ul className="space-y-4">
          {state.days.map((day, index) => {
            const hotel = day.hotelId ? hotelMap.get(day.hotelId) : null
            return (
              <li key={day.id} className="glass-card animate-fade-up rounded-2xl p-4" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
                      Day {index + 1}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-teal-900">
                      {formatDate(day.date)}
                    </h3>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(day)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Remove this day?')) deleteDay(day.id)
                        }}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {hotel && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-teal-800">
                    <span aria-hidden>🏨</span>
                    <span>
                      <strong>Hotel:</strong> {hotel.name}
                    </span>
                  </p>
                )}

                {day.activities && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-teal-600">Activities</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-teal-900/90">{day.activities}</p>
                  </div>
                )}

                {day.travelToNext && (
                  <div className="mt-3 rounded-xl bg-amber-50/80 px-3 py-2">
                    <p className="text-xs font-semibold text-amber-800">Travel to next destination</p>
                    <p className="mt-0.5 text-sm text-amber-900/90">{day.travelToNext}</p>
                  </div>
                )}

                {day.notes && (
                  <p className="mt-2 text-xs italic text-teal-600/80">{day.notes}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {canEdit && <Fab onClick={openAdd} label="Add travel day" />}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit travel day' : 'Add travel day'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Date" hint="When does this day happen?">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </Field>
          <Field label="Hotel for the night">
            <Select
              value={form.hotelId ?? ''}
              onChange={(e) =>
                setForm({ ...form, hotelId: e.target.value || null })
              }
            >
              <option value="">— No hotel / not staying —</option>
              {state.hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          </Field>
          {state.hotels.length === 0 && (
            <p className="text-xs text-amber-700">
              Add hotels on the Hotels page to link them here.
            </p>
          )}
          <Field label="Day activities" hint="One activity per line works well">
            <TextArea
              value={form.activities}
              onChange={(e) => setForm({ ...form, activities: e.target.value })}
              placeholder="Morning: beach&#10;Afternoon: snorkeling tour"
            />
          </Field>
          <Field label="Travel to next destination">
            <Input
              value={form.travelToNext}
              onChange={(e) => setForm({ ...form, travelToNext: e.target.value })}
              placeholder="Flight to Bali, 2h drive to Ubud…"
            />
          </Field>
          <Field label="Notes (optional)">
            <TextArea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Reservation codes, reminders…"
            />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {editing ? 'Save changes' : 'Add day'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
