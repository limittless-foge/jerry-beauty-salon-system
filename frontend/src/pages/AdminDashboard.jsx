import axios from 'axios'
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleAlert,
  DollarSign,
  Eye,
  EyeOff,
  LoaderCircle,
  Plus,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'

const blankAnalytics = {
  total_revenue: 0,
  total_expenses: 0,
  net_profit: 0,
  pending_salaries: null,
  revenue_expense_trend: [],
  employee_performance: [],
}

const initialForm = {
  transaction_type: 'expense',
  amount: '',
  description: '',
}

const initialEmployeeForm = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function listFrom(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.transactions)) return data.transactions
  return []
}

function getError(error, fallback) {
  const data = error.response?.data
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    if (data.detail || data.error) return String(data.detail ?? data.error)
    const messages = Object.values(data).flat().filter(Boolean)
    if (messages.length) return messages.join(' ')
  }
  return fallback
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatType(type) {
  const value = String(type ?? 'unknown')
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function transactionTypeClass(type) {
  if (type === 'income') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
  if (type === 'salary') return 'border-violet-400/20 bg-violet-400/10 text-violet-200'
  return 'border-amber-400/20 bg-amber-400/10 text-amber-200'
}

function normalizeAnalytics(data) {
  const overview = data?.overview ?? data?.summary ?? data ?? {}
  return {
    total_revenue: Number(firstDefined(overview.total_revenue, overview.totalRevenue, overview.revenue, 0)) || 0,
    total_expenses: Number(firstDefined(overview.total_expenses, overview.totalExpenses, overview.expenses, 0)) || 0,
    net_profit: Number(firstDefined(overview.net_profit, overview.netProfit, overview.profit, 0)) || 0,
    pending_salaries: firstDefined(overview.pending_salaries, overview.pendingSalaries, overview.salary_pending) == null
      ? null
      : Number(firstDefined(overview.pending_salaries, overview.pendingSalaries, overview.salary_pending)) || 0,
    revenue_expense_trend: firstDefined(
      data?.revenue_expense_trend,
      data?.revenue_expenses,
      data?.monthly_trends,
      data?.trends,
      [],
    ),
    employee_performance: firstDefined(data?.employee_performance, data?.employees, []),
  }
}

function normalizeTrendRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => ({
    period: row.period ?? row.month ?? row.week ?? row.label ?? '',
    revenue: Number(row.revenue ?? row.total_revenue ?? 0) || 0,
    expenses: Number(row.expenses ?? row.total_expenses ?? row.expense ?? 0) || 0,
  }))
}

function normalizeEmployeeRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => ({
    employee: row.employee_name ?? row.employee ?? row.name ?? 'Employee',
    clients: Number(row.clients_served ?? row.clients ?? row.client_count ?? 0) || 0,
    revenue: Number(row.revenue_generated ?? row.revenue ?? row.total_revenue ?? 0) || 0,
  }))
}

function SummaryCard({ title, amount, description, icon: Icon, tone }) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-gradient-to-br from-[#211720] to-[#171016] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-stone-400">{title}</p>
          <p className={`mt-3 text-3xl font-semibold ${tone}`}>{amount == null ? 'Not tracked' : currency.format(amount)}</p>
        </div>
        <span className="rounded-2xl bg-white/[0.06] p-3 text-[#e9c09b]"><Icon size={20} /></span>
      </div>
      <p className="mt-4 text-xs text-stone-500">{description}</p>
    </article>
  )
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(blankAnalytics)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState('')
  const [transactionsError, setTransactionsError] = useState('')
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [employeeForm, setEmployeeForm] = useState(initialEmployeeForm)
  const [employeePasswordVisible, setEmployeePasswordVisible] = useState(false)
  const [creatingEmployee, setCreatingEmployee] = useState(false)
  const [employeeError, setEmployeeError] = useState('')
  const [employeeSuccess, setEmployeeSuccess] = useState('')

  const loadDashboard = useCallback(async (signal) => {
    const options = signal ? { signal } : undefined
    const [transactionsResult, analyticsResult] = await Promise.allSettled([
      axios.get('/api/transactions/', options),
      axios.get('/api/transactions/analytics/', options),
    ])

    if (signal?.aborted) return
    if (transactionsResult.status === 'fulfilled') {
      setTransactions(listFrom(transactionsResult.value.data))
      setTransactionsError('')
    } else {
      setTransactionsError(getError(transactionsResult.reason, 'Could not load transactions.'))
    }

    if (analyticsResult.status === 'fulfilled') {
      setAnalytics(normalizeAnalytics(analyticsResult.value.data))
      setAnalyticsError('')
    } else {
      setAnalyticsError(getError(analyticsResult.reason, 'Could not load financial analytics.'))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void Promise.resolve().then(() => loadDashboard(controller.signal))
    return () => controller.abort()
  }, [loadDashboard])

  const trendRows = useMemo(() => normalizeTrendRows(analytics.revenue_expense_trend), [analytics.revenue_expense_trend])
  const employeeRows = useMemo(() => normalizeEmployeeRows(analytics.employee_performance), [analytics.employee_performance])

  async function submitTransaction(event) {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')
    setSuccessMessage('')

    try {
      const response = await axios.post('/api/transactions/', {
        transaction_type: form.transaction_type,
        amount: form.amount,
        description: form.description.trim(),
      })
      const transaction = response.data && typeof response.data === 'object'
        ? response.data
        : {
          transaction_type: form.transaction_type,
          amount: form.amount,
          description: form.description.trim(),
          date: new Date().toISOString(),
        }
      setTransactions((current) => [transaction, ...current])
      setForm(initialForm)
      setSuccessMessage(`${formatType(form.transaction_type)} transaction saved.`)
      await loadDashboard()
    } catch (error) {
      setFormError(getError(error, 'Could not save this transaction. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function createEmployee(event) {
    event.preventDefault()
    setCreatingEmployee(true)
    setEmployeeError('')
    setEmployeeSuccess('')
    try {
      const response = await axios.post('/api/employees/create/', employeeForm)
      const createdUser = response.data
      setEmployeeSuccess(`Employee account for ${createdUser.username} was created.`)
      setEmployeeForm(initialEmployeeForm)
      setEmployeePasswordVisible(false)
    } catch (error) {
      setEmployeeError(getError(error, 'Could not create the employee account. Please try again.'))
    } finally {
      setCreatingEmployee(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#120d14] px-4 py-6 text-stone-50 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/" className="text-xs uppercase tracking-[0.25em] text-[#d3a075] transition hover:text-[#f2cfac]">
              Jerry Beauty Salon
            </Link>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Financial dashboard</h1>
            <p className="mt-2 text-sm text-stone-400">A clear view of salon performance and transactions.</p>
          </div>
          {loading && (
            <span role="status" className="inline-flex items-center gap-2 text-sm text-stone-400">
              <LoaderCircle size={16} className="animate-spin" /> Updating
            </span>
          )}
        </header>

        {(analyticsError || transactionsError) && (
          <div role="alert" className="mt-6 space-y-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
            {analyticsError && <p><CircleAlert size={16} className="mr-2 inline-block" />Analytics unavailable: {analyticsError}</p>}
            {transactionsError && <p><CircleAlert size={16} className="mr-2 inline-block" />Transactions unavailable: {transactionsError}</p>}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Financial overview">
          <SummaryCard title="Total revenue" amount={analytics.total_revenue} description="Recorded income" icon={ArrowUpRight} tone="text-emerald-200" />
          <SummaryCard title="Total expenses" amount={analytics.total_expenses} description="Recorded operating expenses" icon={ArrowDownRight} tone="text-amber-200" />
          <SummaryCard title="Net profit" amount={analytics.net_profit} description="Revenue less expenses" icon={DollarSign} tone={analytics.net_profit >= 0 ? 'text-[#f2cfac]' : 'text-rose-200'} />
          <SummaryCard title="Pending salaries" amount={analytics.pending_salaries} description="Not tracked in the current transaction model" icon={Wallet} tone="text-violet-200" />
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-2">
          <article className="rounded-[28px] border border-white/10 bg-[#1a121a] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-[#d3a075]">Revenue & expenses</p>
              <h2 className="mt-1 text-xl font-semibold">Financial trends</h2>
            </div>
            {trendRows.length ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendRows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d8a277" stopOpacity={0.36} />
                        <stop offset="95%" stopColor="#d8a277" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#ffffff12" vertical={false} />
                    <XAxis dataKey="period" tick={{ fill: '#a8a29e', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(value) => currency.format(value)} tick={{ fill: '#a8a29e', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip
                      formatter={(value, name) => [currency.format(Number(value)), name]}
                      contentStyle={{ background: '#211720', border: '1px solid #ffffff20', borderRadius: 12, color: '#fafaf9' }}
                      labelStyle={{ color: '#d6d3d1' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#d8a277" strokeWidth={2.5} fill="url(#revenueFill)" isAnimationActive />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#a78bfa" strokeWidth={2.5} fill="url(#expenseFill)" isAnimationActive />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-sm text-stone-500">
                {analyticsError ? 'Trend data is unavailable.' : 'Trend data will appear when available.'}
              </div>
            )}
          </article>

          <article className="rounded-[28px] border border-white/10 bg-[#1a121a] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-[#d3a075]">Team performance</p>
              <h2 className="mt-1 text-xl font-semibold">Clients served & revenue</h2>
            </div>
            {employeeRows.length ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeRows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="#ffffff12" vertical={false} />
                    <XAxis dataKey="employee" tick={{ fill: '#a8a29e', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="clients" tick={{ fill: '#a8a29e', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="revenue" orientation="right" tickFormatter={(value) => currency.format(value)} tick={{ fill: '#a8a29e', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip
                      formatter={(value, name) => [name === 'Revenue' ? currency.format(Number(value)) : value, name]}
                      contentStyle={{ background: '#211720', border: '1px solid #ffffff20', borderRadius: 12, color: '#fafaf9' }}
                    />
                    <Legend />
                    <Bar yAxisId="clients" dataKey="clients" name="Clients served" fill="#a78bfa" radius={[5, 5, 0, 0]} isAnimationActive />
                    <Bar yAxisId="revenue" dataKey="revenue" name="Revenue" fill="#d8a277" radius={[5, 5, 0, 0]} isAnimationActive />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-sm text-stone-500">
                {analyticsError ? 'Employee performance data is unavailable.' : 'Employee performance data will appear when available.'}
              </div>
            )}
          </article>
        </section>

        <section className="mt-7 grid items-start gap-6 xl:grid-cols-[1fr_360px]">
          <article className="min-w-0 rounded-[28px] border border-white/10 bg-[#1a121a] p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#d3a075]">Money tracer</p>
                <h2 className="mt-1 text-xl font-semibold">Recent transactions</h2>
              </div>
              <span className="text-xs text-stone-500">{transactions.length} records</span>
            </div>
            {transactionsError ? (
              <p className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{transactionsError}</p>
            ) : transactions.length ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-stone-500">
                      <th className="pb-3 pr-4 font-medium">Type</th>
                      <th className="pb-3 pr-4 font-medium">Description</th>
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => {
                      const type = String(transaction.transaction_type ?? transaction.type ?? 'expense').toLowerCase()
                      const amount = Number(transaction.amount) || 0
                      return (
                        <tr key={transaction.id ?? `${transaction.date}-${index}`} className="border-b border-white/[0.06] last:border-0">
                          <td className="py-4 pr-4">
                            <span className={`rounded-full border px-2.5 py-1 text-xs ${transactionTypeClass(type)}`}>{formatType(type)}</span>
                          </td>
                          <td className="max-w-[260px] truncate py-4 pr-4 text-stone-200">{transaction.description || '—'}</td>
                          <td className="whitespace-nowrap py-4 pr-4 text-stone-400">{formatDate(transaction.date ?? transaction.created_at)}</td>
                          <td className={`whitespace-nowrap py-4 text-right font-medium ${type === 'income' ? 'text-emerald-200' : 'text-stone-200'}`}>
                            {type === 'income' ? '+' : '−'}{currency.format(amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-5 flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-stone-500">
                {loading ? 'Loading transactions…' : 'No transactions returned yet.'}
              </div>
            )}
          </article>

          <aside className="rounded-[28px] border border-white/10 bg-[#1a121a] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-[#f2cfac]/10 p-3 text-[#f2cfac]"><Plus size={19} /></span>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#d3a075]">Quick entry</p>
                <h2 className="mt-1 text-xl font-semibold">Log a transaction</h2>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={submitTransaction}>
              <label className="block text-sm font-medium" htmlFor="transaction-type">
                Transaction type
                <select
                  id="transaction-type"
                  value={form.transaction_type}
                  onChange={(event) => { setForm((current) => ({ ...current, transaction_type: event.target.value })); setFormError(''); setSuccessMessage('') }}
                  className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white focus:border-[#f2cfac] focus:outline-none"
                >
                  <option value="expense">Expense</option>
                  <option value="salary">Salary payout</option>
                </select>
              </label>
              <label className="block text-sm font-medium" htmlFor="transaction-amount">
                Amount
                <span className="relative mt-2 block">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                  <input
                    id="transaction-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(event) => { setForm((current) => ({ ...current, amount: event.target.value })); setFormError(''); setSuccessMessage('') }}
                    placeholder="0.00"
                    className="block w-full rounded-2xl border border-white/10 bg-[#100b12] py-3 pl-8 pr-4 text-white placeholder:text-stone-600 focus:border-[#f2cfac] focus:outline-none"
                  />
                </span>
              </label>
              <label className="block text-sm font-medium" htmlFor="transaction-description">
                Description
                <textarea
                  id="transaction-description"
                  required
                  maxLength={1000}
                  rows={3}
                  value={form.description}
                  onChange={(event) => { setForm((current) => ({ ...current, description: event.target.value })); setFormError(''); setSuccessMessage('') }}
                  placeholder={form.transaction_type === 'salary' ? 'Employee name and payout period' : 'What was this expense for?'}
                  className="mt-2 block w-full resize-y rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white placeholder:text-stone-600 focus:border-[#f2cfac] focus:outline-none"
                />
              </label>
              {formError && <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{formError}</p>}
              {successMessage && <p role="status" className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{successMessage}</p>}
              <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f2cfac] px-5 py-3 text-sm font-semibold text-[#211814] transition hover:bg-[#f8d8bf] disabled:cursor-wait disabled:opacity-60">
                {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
                {submitting ? 'Saving transaction…' : 'Save transaction'}
              </button>
            </form>
          </aside>
        </section>

        <section className="mt-7 rounded-[28px] border border-white/10 bg-[#1a121a] p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-[#f2cfac]/10 p-3 text-[#f2cfac]"><UserPlus size={20} /></span>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#d3a075]">Team management</p>
              <h2 className="mt-1 text-xl font-semibold">Create employee account</h2>
            </div>
          </div>

          <form className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={createEmployee}>
            <label className="block text-sm font-medium" htmlFor="employee-username">
              Username
              <input
                id="employee-username"
                required
                maxLength={150}
                autoComplete="username"
                value={employeeForm.username}
                onChange={(event) => setEmployeeForm((current) => ({ ...current, username: event.target.value }))}
                className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white focus:border-[#f2cfac] focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium" htmlFor="employee-email">
              Email
              <input
                id="employee-email"
                type="email"
                required
                autoComplete="email"
                value={employeeForm.email}
                onChange={(event) => setEmployeeForm((current) => ({ ...current, email: event.target.value }))}
                className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white focus:border-[#f2cfac] focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium" htmlFor="employee-password">
              Temporary password
              <span className="relative mt-2 block">
                <input
                  id="employee-password"
                  type={employeePasswordVisible ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={employeeForm.password}
                  onChange={(event) => setEmployeeForm((current) => ({ ...current, password: event.target.value }))}
                  className="block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 pr-12 text-white focus:border-[#f2cfac] focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={employeePasswordVisible ? 'Hide employee password' : 'Show employee password'}
                  aria-pressed={employeePasswordVisible}
                  onClick={() => setEmployeePasswordVisible((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:bg-white/10 hover:text-white"
                >
                  {employeePasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <label className="block text-sm font-medium" htmlFor="employee-first-name">
              First name
              <input
                id="employee-first-name"
                required
                autoComplete="given-name"
                value={employeeForm.first_name}
                onChange={(event) => setEmployeeForm((current) => ({ ...current, first_name: event.target.value }))}
                className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white focus:border-[#f2cfac] focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium" htmlFor="employee-last-name">
              Last name
              <input
                id="employee-last-name"
                required
                autoComplete="family-name"
                value={employeeForm.last_name}
                onChange={(event) => setEmployeeForm((current) => ({ ...current, last_name: event.target.value }))}
                className="mt-2 block w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-white focus:border-[#f2cfac] focus:outline-none"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creatingEmployee}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f2cfac] px-5 py-3 text-sm font-semibold text-[#211814] transition hover:bg-[#f8d8bf] disabled:cursor-wait disabled:opacity-60"
              >
                {creatingEmployee ? <LoaderCircle size={16} className="animate-spin" /> : <UserPlus size={16} />}
                {creatingEmployee ? 'Creating account…' : 'Create employee'}
              </button>
            </div>
            {(employeeError || employeeSuccess) && (
              <p role={employeeError ? 'alert' : 'status'} className={`sm:col-span-2 lg:col-span-3 rounded-2xl border p-3 text-sm ${employeeError ? 'border-rose-400/20 bg-rose-400/10 text-rose-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'}`}>
                {employeeError || employeeSuccess}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  )
}
