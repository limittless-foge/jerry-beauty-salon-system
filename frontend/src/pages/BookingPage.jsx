import axios from 'axios'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Scissors,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const services = [
  { id: 'hair-cut-style', name: 'Cut & signature styling', category: 'Hair', duration: 60, price: 65 },
  { id: 'hair-color-gloss', name: 'Color & gloss refresh', category: 'Hair', duration: 120, price: 145 },
  { id: 'nail-manicure', name: 'Classic manicure', category: 'Nails', duration: 45, price: 38 },
  { id: 'nail-gel', name: 'Gel manicure', category: 'Nails', duration: 75, price: 58 },
  { id: 'henna-design', name: 'Custom henna design', category: 'Henna', duration: 60, price: 55 },
  { id: 'henna-bridal', name: 'Bridal henna artistry', category: 'Henna', duration: 150, price: 180 },
  { id: 'makeup-event', name: 'Event makeup', category: 'Makeup', duration: 75, price: 95 },
  { id: 'makeup-bridal', name: 'Bridal makeup', category: 'Makeup', duration: 120, price: 165 },
  { id: 'brow-shaping', name: 'Eyebrow shaping', category: 'Eyebrow / Halal', duration: 30, price: 28 },
  { id: 'brow-halal', name: 'Halal-friendly brow treatment', category: 'Eyebrow / Halal', duration: 45, price: 42 },
]

const categories = [...new Set(services.map(({ category }) => category))]
const timeSlots = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM']
const steps = [
  { title: 'Services', icon: Sparkles },
  { title: 'Date & time', icon: CalendarDays },
  { title: 'Your details', icon: UserRound },
  { title: 'Review', icon: Check },
]

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function localDateString(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(date) {
  if (!date) return ''
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getApiError(error) {
  const data = error.response?.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    return Object.values(data).flat().filter(Boolean).join(' ') || 'We could not submit your booking. Please try again.'
  }
  return 'We could not reach the booking service. Please try again in a moment.'
}

export default function BookingPage() {
  const [minimumDate] = useState(() => localDateString(new Date()))
  const [step, setStep] = useState(0)
  const [selectedServices, setSelectedServices] = useState([])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [booking, setBooking] = useState(null)

  const chosenServices = useMemo(
    () => services.filter((service) => selectedServices.includes(service.id)),
    [selectedServices],
  )
  const totalPrice = chosenServices.reduce((total, service) => total + service.price, 0)
  const totalDuration = chosenServices.reduce((total, service) => total + service.duration, 0)
  const durationLabel = totalDuration >= 60
    ? `${Math.floor(totalDuration / 60)} hr${Math.floor(totalDuration / 60) > 1 ? 's' : ''}${totalDuration % 60 ? ` ${totalDuration % 60} min` : ''}`
    : `${totalDuration} min`

  function toggleService(id) {
    setSelectedServices((current) => (
      current.includes(id) ? current.filter((serviceId) => serviceId !== id) : [...current, id]
    ))
  }

  function canContinue() {
    if (step === 0) return selectedServices.length > 0
    if (step === 1) return Boolean(date && time)
    if (step === 2) return Boolean(clientName.trim() && phone.trim())
    return true
  }

  function continueStep(event) {
    event.preventDefault()
    setErrorMessage('')
    if (canContinue()) setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  async function submitBooking() {
    setSubmitting(true)
    setErrorMessage('')

    const scheduledAt = new Date(`${date}T${time === '9:00 AM' ? '09:00' : time === '11:00 AM' ? '11:00' : time === '2:00 PM' ? '14:00' : '16:00'}:00`)
    const payload = {
      services: chosenServices.map(({ id, name, category, duration, price }) => ({
        id,
        name,
        category,
        duration_minutes: duration,
        price,
      })),
      service_names: chosenServices.map(({ name }) => name),
      scheduled_at: scheduledAt.toISOString(),
      date,
      time,
      client: { name: clientName.trim(), phone: phone.trim() },
      client_name: clientName.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      estimated_total: totalPrice,
      estimated_duration_minutes: totalDuration,
    }

    try {
      const response = await axios.post('/api/appointments/', payload)
      setBooking({
        ...payload,
        confirmation: response.data?.id ?? response.data?.confirmation_code ?? 'Received',
      })
    } catch (error) {
      setErrorMessage(getApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (booking) {
    return (
      <main className="min-h-screen bg-[#120d14] px-4 py-12 text-stone-50 sm:px-6">
        <section className="mx-auto max-w-2xl rounded-[36px] border border-white/10 bg-[#1a121a] p-7 text-center shadow-2xl sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 size={34} />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.28em] text-[#d3a075]">Your request is in</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Thank you, {booking.client_name}.</h1>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-stone-300">
            Your appointment request has been sent to Jerry Beauty Salon. We’ll contact you to confirm your visit.
          </p>
          <div className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-black/20 p-5 text-left">
            <p><span className="text-stone-400">Reference:</span> {booking.confirmation}</p>
            <p><span className="text-stone-400">When:</span> {formatDate(booking.date)} at {booking.time}</p>
            <p><span className="text-stone-400">Treatments:</span> {booking.service_names.join(', ')}</p>
            <p><span className="text-stone-400">Estimate:</span> {money.format(booking.estimated_total)} · {booking.estimated_duration_minutes} minutes</p>
          </div>
          <Link to="/" className="mt-8 inline-flex rounded-full bg-[#f2cfac] px-6 py-3 font-medium text-[#211814] transition hover:bg-[#f8d8bf]">
            Return to salon
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#120d14] px-4 py-6 text-stone-50 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-stone-300 transition hover:text-white">
          <ArrowLeft size={16} /> Back to Jerry Beauty
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <section className="rounded-[32px] border border-white/10 bg-[#1a121a] p-5 sm:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#d3a075]">Your beauty appointment</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Let’s make it yours.</h1>
            </div>

            <ol className="my-8 grid grid-cols-4 gap-2" aria-label="Booking progress">
              {steps.map(({ title, icon: Icon }, index) => (
                <li key={title} className={`flex flex-col items-center gap-2 text-center text-xs sm:flex-row sm:text-sm ${step >= index ? 'text-[#f2cfac]' : 'text-stone-500'}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${step === index ? 'border-[#f2cfac] bg-[#f2cfac]/10' : 'border-white/10'}`}>
                    <Icon size={16} />
                  </span>
                  <span>{title}</span>
                </li>
              ))}
            </ol>

            <form onSubmit={step === 3 ? (event) => { event.preventDefault(); void submitBooking() } : continueStep}>
              {step === 0 && (
                <div className="space-y-7">
                  <div>
                    <h2 className="text-xl font-semibold">Choose your treatments</h2>
                    <p className="mt-1 text-sm text-stone-400">Select one or more services. Prices and durations are estimates.</p>
                  </div>
                  {categories.map((category) => (
                    <fieldset key={category}>
                      <legend className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-[#d3a075]">{category}</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {services.filter((service) => service.category === category).map((service) => {
                          const selected = selectedServices.includes(service.id)
                          return (
                            <label key={service.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${selected ? 'border-[#f2cfac] bg-[#f2cfac]/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleService(service.id)}
                                className="mt-1 h-4 w-4 accent-[#d9a77d]"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium">{service.name}</span>
                                <span className="mt-1 flex items-center gap-3 text-xs text-stone-400">
                                  <span className="inline-flex items-center gap-1"><Clock3 size={12} /> {service.duration} min</span>
                                </span>
                              </span>
                              <span className="font-medium text-[#f2cfac]">{money.format(service.price)}</span>
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>
                  ))}
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-xl font-semibold">Pick a date and time</h2>
                  <p className="mt-1 text-sm text-stone-400">Choose a preferred appointment time. We’ll confirm availability with you.</p>
                  <label className="mt-6 block text-sm font-medium" htmlFor="appointment-date">Preferred date</label>
                  <input
                    id="appointment-date"
                    type="date"
                    min={minimumDate}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                    className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white scheme-dark focus:border-[#f2cfac] focus:outline-none"
                  />
                  <fieldset className="mt-7">
                    <legend className="mb-3 text-sm font-medium">Available time slots</legend>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {timeSlots.map((slot) => (
                        <button key={slot} type="button" onClick={() => setTime(slot)} className={`rounded-2xl border px-3 py-3 text-sm transition ${time === slot ? 'border-[#f2cfac] bg-[#f2cfac]/10 text-[#f2cfac]' : 'border-white/10 bg-white/[0.03] text-stone-300 hover:border-white/20'}`}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-xl font-semibold">How can we reach you?</h2>
                  <p className="mt-1 text-sm text-stone-400">We’ll use these details to confirm your preferred appointment.</p>
                  <div className="mt-6 grid gap-5">
                    <label className="text-sm font-medium" htmlFor="client-name">
                      Full name
                      <input id="client-name" value={clientName} onChange={(event) => setClientName(event.target.value)} autoComplete="name" required maxLength={150} className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white placeholder:text-stone-600 focus:border-[#f2cfac] focus:outline-none" placeholder="Your name" />
                    </label>
                    <label className="text-sm font-medium" htmlFor="client-phone">
                      Phone number
                      <input id="client-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required maxLength={40} className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white placeholder:text-stone-600 focus:border-[#f2cfac] focus:outline-none" placeholder="+1 (555) 123-4567" />
                    </label>
                    <label className="text-sm font-medium" htmlFor="booking-notes">
                      Notes <span className="font-normal text-stone-500">(optional)</span>
                      <textarea id="booking-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} rows={4} className="mt-2 block w-full resize-y rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white placeholder:text-stone-600 focus:border-[#f2cfac] focus:outline-none" placeholder="Share preferences, accessibility needs, halal treatment requests, or bridal henna details." />
                    </label>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-xl font-semibold">Review your appointment</h2>
                  <p className="mt-1 text-sm text-stone-400">Check your details before sending the request.</p>
                  <div className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[#d3a075]">Treatments</p>
                      <ul className="mt-2 space-y-2">
                        {chosenServices.map((service) => (
                          <li key={service.id} className="flex justify-between gap-4 text-sm">
                            <span>{service.name} <span className="text-stone-500">· {service.duration} min</span></span>
                            <span>{money.format(service.price)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-t border-white/10 pt-4 text-sm">
                      <p><span className="text-stone-400">Appointment:</span> {formatDate(date)} at {time}</p>
                      <p className="mt-2"><span className="text-stone-400">Name:</span> {clientName}</p>
                      <p className="mt-2"><span className="text-stone-400">Phone:</span> {phone}</p>
                      {notes && <p className="mt-2"><span className="text-stone-400">Notes:</span> {notes}</p>}
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-4 font-semibold">
                      <span>Estimated total · {durationLabel}</span>
                      <span className="text-[#f2cfac]">{money.format(totalPrice)}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-stone-500">This is a booking request. The salon will contact you to confirm availability and final pricing.</p>
                </div>
              )}

              {errorMessage && (
                <p role="alert" className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {errorMessage}
                </p>
              )}

              <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
                {step > 0 ? (
                  <button type="button" onClick={() => { setErrorMessage(''); setStep((current) => current - 1) }} className="rounded-full border border-white/15 px-5 py-3 text-sm text-stone-200 transition hover:bg-white/5">
                    Back
                  </button>
                ) : <span />}
                {step < 3 ? (
                  <button type="submit" disabled={!canContinue()} className="inline-flex items-center gap-2 rounded-full bg-[#f2cfac] px-6 py-3 text-sm font-semibold text-[#211814] transition hover:bg-[#f8d8bf] disabled:cursor-not-allowed disabled:opacity-40">
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-[#f2cfac] px-6 py-3 text-sm font-semibold text-[#211814] transition hover:bg-[#f8d8bf] disabled:cursor-wait disabled:opacity-60">
                    {submitting ? 'Sending request…' : 'Request appointment'} <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </form>
          </section>

          <aside className="h-fit rounded-[32px] border border-white/10 bg-[#1a121a] p-6 lg:sticky lg:top-8">
            <p className="text-xs uppercase tracking-[0.23em] text-[#d3a075]">Your selection</p>
            <h2 className="mt-2 text-xl font-semibold">Appointment summary</h2>
            {chosenServices.length ? (
              <ul className="mt-5 space-y-3">
                {chosenServices.map((service) => (
                  <li key={service.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-stone-300">{service.name}</span>
                    <span>{money.format(service.price)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-500">Your selected services will appear here.</p>
            )}
            <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
              <p className="flex justify-between"><span className="text-stone-400">Duration</span><span>{durationLabel}</span></p>
              <p className="flex justify-between font-semibold"><span>Estimated total</span><span className="text-[#f2cfac]">{money.format(totalPrice)}</span></p>
            </div>
            <p className="mt-5 rounded-2xl bg-white/[0.04] p-4 text-xs leading-5 text-stone-400">
              <Scissors size={14} className="mb-2 text-[#d3a075]" />
              The salon will confirm your appointment and final service details by phone.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
