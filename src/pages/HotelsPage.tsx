import { useState, type FormEvent } from 'react'
import { useApp } from '../context/AppContext'
import type { Hotel } from '../types'
import {
  Button,
  EmptyState,
  Fab,
  Field,
  Input,
  Modal,
  PageHeader,
  TextArea,
} from '../components/ui'

const emptyHotel = (): Omit<Hotel, 'id'> => ({
  name: '',
  address: '',
  checkIn: '',
  checkOut: '',
  confirmation: '',
  phone: '',
  notes: '',
})

export function HotelsPage() {
  const { state, canEdit, addHotel, updateHotel, deleteHotel } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Hotel | null>(null)
  const [form, setForm] = useState(emptyHotel())

  function openAdd() {
    setEditing(null)
    setForm(emptyHotel())
    setModalOpen(true)
  }

  function openEdit(hotel: Hotel) {
    setEditing(hotel)
    setForm({
      name: hotel.name,
      address: hotel.address,
      checkIn: hotel.checkIn,
      checkOut: hotel.checkOut,
      confirmation: hotel.confirmation,
      phone: hotel.phone,
      notes: hotel.notes,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) await updateHotel(editing.id, form)
    else await addHotel(form)
    setModalOpen(false)
  }

  if (!state) return null

  return (
    <>
      <PageHeader
        title={state.settings.pageTitles.hotels}
        subtitle={`${state.hotels.length} reservation${state.hotels.length === 1 ? '' : 's'}`}
      />

      {state.hotels.length === 0 ? (
        <EmptyState
          icon="🏨"
          title="No hotel reservations"
          description="Tap + to save your bookings — confirmation numbers, dates, and contact info."
        />
      ) : (
        <ul className="space-y-4">
          {state.hotels.map((hotel) => (
            <li key={hotel.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-semibold text-teal-900">{hotel.name}</h3>
                {canEdit && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(hotel)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Remove this hotel?')) deleteHotel(hotel.id)
                      }}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {hotel.address && (
                <p className="mt-2 text-sm text-teal-800">📍 {hotel.address}</p>
              )}
              {(hotel.checkIn || hotel.checkOut) && (
                <p className="mt-2 text-sm text-teal-800">
                  📅 {hotel.checkIn || '?'} → {hotel.checkOut || '?'}
                </p>
              )}
              {hotel.confirmation && (
                <p className="mt-2 rounded-lg bg-teal-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-teal-800">Confirmation:</span>{' '}
                  {hotel.confirmation}
                </p>
              )}
              {hotel.phone && (
                <p className="mt-2 text-sm">
                  <a href={`tel:${hotel.phone}`} className="font-medium text-teal-700 underline">
                    📞 {hotel.phone}
                  </a>
                </p>
              )}
              {hotel.notes && (
                <p className="mt-2 text-xs text-teal-600/80">{hotel.notes}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && <Fab onClick={openAdd} label="Add hotel" />}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit hotel' : 'Add hotel reservation'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Hotel name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Oceanview Resort"
              required
            />
          </Field>
          <Field label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Beach Road"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in">
              <Input
                type="date"
                value={form.checkIn}
                onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
              />
            </Field>
            <Field label="Check-out">
              <Input
                type="date"
                value={form.checkOut}
                onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Confirmation number">
            <Input
              value={form.confirmation}
              onChange={(e) => setForm({ ...form, confirmation: e.target.value })}
              placeholder="ABC-12345"
            />
          </Field>
          <Field label="Phone">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555 0100"
            />
          </Field>
          <Field label="Notes">
            <TextArea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Late check-in requested…"
            />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {editing ? 'Save' : 'Add hotel'}
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
