import axios from 'axios'
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  LoaderCircle,
  Scissors,
  Sparkles,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const emptyForm = {
  clientName: '',
  serviceIds: [],
  payment: '',
  paymentMethod: 'cash',
  notes: '',
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function responseList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.data)) return data.data
  return []
}

function localDayStart() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function isToday(value) {
  if (!value) return false
  const date = new Date(value)
  const today = localDayStart()
  return date >= today && date < new Date(today.getTime() + 24 * 60 * 60 * 1000)
}

function appointmentDate(appointment) {
  return appointment.scheduled_at ?? appointment.scheduledAt ?? appointment.date
}

function appointmentServices(appointment) {
  const values = appointment.services ?? appointment.service_names ?? []
  if (!Array.isArray(values)) return String(values)
  return values.map((service) => typeof service === 'string' ? service : service.name).filter(Boolean).join(', ')
}

function statusClass(status) {
  const normalized = String(status ?? 'Pending').toLowerCase()
  if (normalized === 'confirmed') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
  if (normalized === 'completed') return 'border-sky-400/20 bg-sky-400/10 text-sky-200'
  if (normalized === 'cancelled') return 'border-rose-400/20 bg-rose-400/10 text-rose-200'
  return 'border-amber-400/20 bg-amber-400/10 text-amber-200'
}

function apiError(error, fallback) {
  const data = error.response?.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const detail = data.detail ?? data.error
    if (detail) return String(detail)
    const fields = Object.values(data).flat().filter(Boolean)
    if (fields.length) return fields.join(' ')
  }
  return fallback
}

export default function EmployeePortal() {
  const [todayLabel] = useState(() => new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }))
  const [services, setServices] = useState([])
  const [appointments, setAppointments] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [serviceError, setServiceError] = useState('')
  const [scheduleError, setScheduleError] = useState('')
  const [logsError, setLogsError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const options = { signal: controller.signal }

    async function loadPortalData() {
      const [serviceResult, scheduleResult, logResult] = await Promise.allSettled([
        axios.get('/api/services/', options),
        axios.get('/api/appointments/', options),
        axios.get('/api/employee-logs/', options),
      ])

      if (controller.signal.aborted) return

      if (serviceResult.status === 'fulfilled') {
        setServices(responseList(serviceResult.value.data))
      } else {
        setServiceError(apiError(serviceResult.reason, 'Unable to load salon services.'))
      }

      if (scheduleResult.status === 'fulfilled') {
        const entries = responseList(scheduleResult.value.data)
        const now = Date.now()
        setAppointments(entries
          .filter((appointment) => {
            const scheduled = new Date(appointmentDate(appointment)).getTime()
            return Number.isFinite(scheduled) && scheduled >= now
          })
          .sort((a, b) => new Date(appointmentDate(a)) - new Date(appointmentDate(b))))
      } else {
        setScheduleError(apiError(scheduleResult.reason, 'Unable to load your appointment schedule.'))
      }

      if (logResult.status === 'fulfilled') {
        setLogs(responseList(logResult.value.data))
      } else {
        setLogsError(apiError(logResult.reason, 'Unable to load today’s employee logs.'))
      }
      setLoading(false)
    }

    void loadPortalData()
    return () => controller.abort()
  }, [])

  const todayLogs = useMemo(() => logs.filter((log) => isToday(log.created_at ?? log.createdAt)), [logs])
  const totalCollected = todayLogs.reduce(
    (total, log) => total + (Number(log.payment_collected ?? log.paymentCollected) || 0),
    0,
  )

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setSubmitError('')
    setSuccessMessage('')
  }

  function toggleService(serviceId) {
    setForm((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(serviceId)
        ? current.serviceIds.filter((id) => id !== serviceId)
        : [...current.serviceIds, serviceId],
    }))
    setSubmitError('')
    setSuccessMessage('')
  }

  async function submitWalkIn(event) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    setSuccessMessage('')

    const payload = {
      client_name: form.clientName.trim(),
      services_rendered: form.serviceIds,
      payment_collected: form.payment,
      payment_method: form.paymentMethod,
      notes: form.notes.trim(),
    }

    try {
      const response = await axios.post('/api/employee-logs/', payload)
      const newLog = response.data && typeof response.data === 'object'
        ? response.data
        : {
          ...payload,
          created_at: new Date().toISOString(),
        }
      setLogs((current) => [newLog, ...current])
      setForm(emptyForm)
      setSuccessMessage('Walk-in client and payment saved successfully.')
    } catch (error) {
      setSubmitError(apiError(error, 'Could not save this walk-in entry. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#120d14] px-4 py-6 text-stone-50 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-xs uppercase tracking-[0.25em] text-[#d3a075] transition hover:text-[#f2cfac]">
              Jerry Beauty Salon
            </Link>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Employee portal</h1>
            <p className="mt-2 text-sm text-stone-400">Your day, appointments, and walk-in records in one place.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-stone-300">
            <CalendarDays size={16} className="text-[#d3a075]" />
            {todayLabel}
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#211720] to-[#171016] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-stone-400">Clients served today</p>
                <p className="mt-3 text-4xl font-semibold">{todayLogs.length}</p>
              </div>
              <div className="rounded-2xl bg-[#f2cfac]/10 p-3 text-[#f2cfac]"><UserRound size={22} /></div>
            </div>
            <p className="mt-4 text-xs text-stone-500">Based on saved walk-in and client service logs</p>
          </article>
          <article className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#211720] to-[#171016] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-stone-400">Payments collected today</p>
                <p className="mt-3 text-4xl font-semibold text-[#f2cfac]">{currency.format(totalCollected)}</p>
              </div>
              <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-200"><Wallet size={22} /></div>
            </div>
            <p className="mt-4 text-xs text-stone-500">Total recorded from today’s employee logs</p>
          </article>
        </section>

        {loading && (
          <div className="mt-6 flex items-center gap-2 text-sm text-stone-400" role="status">
            <LoaderCircle size={16} className="animate-spin" /> Loading employee portal…
          </div>
        )}

        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[30px] border border-white/10 bg-[#1a121a] p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#f2cfac]/10 p-3 text-[#f2cfac]"><Clock3 size={20} /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#d3a075]">Daily schedule</p>
                <h2 className="mt-1 text-2xl font-semibold">Upcoming appointments</h2>
              </div>
            </div>

            {scheduleError ? (
              <p role="alert" className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{scheduleError}</p>
            ) : appointments.length ? (
              <ul className="mt-6 space-y-3">
                {appointments.map((appointment) => {
                  const scheduled = appointmentDate(appointment)
                  const status = appointment.status ?? 'Pending'
                  return (
                    <li key={appointment.id ?? `${scheduled}-${appointment.client_name ?? appointment.client?.name}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{appointment.client_name ?? appointment.client?.name ?? appointment.client?.username ?? 'Client appointment'}</p>
                          <p className="mt-1 text-sm text-stone-400">{appointmentServices(appointment) || 'Services to be confirmed'}</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs ${statusClass(status)}`}>{status}</span>
                      </div>
                      <p className="mt-4 flex items-center gap-2 text-xs text-stone-400">
                        <CalendarDays size={14} />
                        {scheduled ? new Date(scheduled).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Time to be confirmed'}
                      </p>
                    </li>
                  )
                })}
              </ul>
            ) : !loading && (
              <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-stone-400">
                No upcoming appointments were returned for your schedule.
              </p>
            )}
            <p className="mt-4 text-xs leading-5 text-stone-500">
              The schedule should be scoped to the authenticated employee by the API.
            </p>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-[#1a121a] p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#f2cfac]/10 p-3 text-[#f2cfac]"><Sparkles size={20} /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#d3a075]">Walk-in & payment logger</p>
                <h2 className="mt-1 text-2xl font-semibold">Record a client</h2>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={submitWalkIn}>
              <label className="block text-sm font-medium" htmlFor="walkin-name">
                Client name
                <input
                  id="walkin-name"
                  required
                  maxLength={150}
                  value={form.clientName}
                  onChange={(event) => updateForm('clientName', event.target.value)}
                  placeholder="Client’s full name"
                  className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white placeholder:text-stone-600 focus:border-[#f2cfac] focus:outline-none"
                />
              </label>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">Services performed</legend>
                {serviceError ? (
                  <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{serviceError}</p>
                ) : services.length ? (
                  <div className="grid max-h-56 gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#100b12] p-3 sm:grid-cols-2">
                    {services.map((service) => (
                      <label key={service.id} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-stone-300 hover:bg-white/5">
                        <input
                          type="checkbox"
                          checked={form.serviceIds.includes(service.id)}
                          onChange={() => toggleService(service.id)}
                          className="h-4 w-4 accent-[#d9a77d]"
                        />
                        <span>{service.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-[#100b12] p-4 text-sm text-stone-500">
                    Services will be available when the salon catalog endpoint is connected.
                  </p>
                )}
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr]">
                <label className="block text-sm font-medium" htmlFor="walkin-payment">
                  Payment collected
                  <div className="mt-2 flex rounded-2xl border border-white/10 bg-[#100b12] focus-within:border-[#f2cfac]">
                    <span className="flex items-center pl-4 text-stone-500">$</span>
                    <input
                      id="walkin-payment"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={form.payment}
                      onChange={(event) => updateForm('payment', event.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-2xl bg-transparent px-3 py-3 text-white placeholder:text-stone-600 focus:outline-none"
                    />
                  </div>
                </label>
                <label className="block text-sm font-medium" htmlFor="payment-method">
                  Payment method
                  <span className="relative mt-2 block">
                    <CreditCard size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <select
                      id="payment-method"
                      value={form.paymentMethod}
                      onChange={(event) => updateForm('paymentMethod', event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/10 bg-[#100b12] py-3 pl-9 pr-3 text-white focus:border-[#f2cfac] focus:outline-none"
                    >
                      <option value="cash">Cash</option>
                      <option value="digital_transfer">Digital transfer</option>
                    </select>
                  </span>
                </label>
              </div>

              <label className="block text-sm font-medium" htmlFor="walkin-notes">
                Notes <span className="font-normal text-stone-500">(optional)</span>
                <textarea
                  id="walkin-notes"
                  rows={3}
                  maxLength={1000}
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                  placeholder="Treatment details or follow-up notes"
                  className="mt-2 block w-full resize-y rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white placeholder:text-stone-600 focus:border-[#f2cfac] focus:outline-none"
                />
              </label>

              {submitError && (
                <p role="alert" className="flex gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
                  <CircleAlert size={17} className="mt-0.5 shrink-0" /> {submitError}
                </p>
              )}
              {successMessage && (
                <p role="status" className="flex gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> {successMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !services.length || !form.serviceIds.length}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f2cfac] px-6 py-3 text-sm font-semibold text-[#211814] transition hover:bg-[#f8d8bf] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Scissors size={16} />}
                {submitting ? 'Saving entry…' : 'Save walk-in entry'}
              </button>
            </form>
          </section>
        </div>

        {!loading && logsError && (
          <p role="alert" className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
            <CircleAlert size={16} className="mr-2 inline-block" /> Daily totals may be incomplete: {logsError}
          </p>
        )}
      </div>
    </main>
  )
}
