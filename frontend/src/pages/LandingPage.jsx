import { ArrowRight, ChevronDown, Palette, Scissors, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ShopCanvas from '../components/ShopCanvas'
import LoginModal from '../components/LoginModal'
import useAuth from '../auth/useAuth'

const services = [
  'Hair artistry',
  'Nail refresh',
  'Henna & bridal glam',
  'Makeup finishing',
  'Eyebrow design',
  'Halal beauty rituals',
]

const stats = [
  { value: '8+', label: 'Years experience' },
  { value: '4.9/5', label: 'Client rating' },
  { value: '1500+', label: 'Treatments delivered' },
]

const treatmentGuidelines = {
  hair: {
    title: 'Hair care',
    description: 'Our signature finishes are designed to protect your hair while enhancing texture, shine, and healthy movement.',
    dos: [
      'Use a gentle, sulfate-free wash routine',
      'Protect your scalp with regular hydration masks',
      'Keep heat styling to a minimum and use a thermal protectant',
    ],
    donts: [
      'Avoid over-washing after treatment',
      'Do not sleep with wet hair tied tightly',
      'Skip harsh chemical overlap between sessions',
    ],
  },
  nails: {
    title: 'Nails & gel care',
    description: 'Healthy nails need balance between styling and recovery. We focus on long wear without compromising nail strength.',
    dos: [
      'Keep cuticles hydrated with rich oil',
      'Use gloves for cleaning and dishwashing',
      'Schedule soak-off and renewal at recommended intervals',
    ],
    donts: [
      'Avoid peeling off gel or acrylic',
      'Do not file aggressively on a weakened nail',
      'Skip repeated harsh buffing before recovery',
    ],
  },
  brow: {
    title: 'Eyebrow & embryo care',
    description: 'Precision and comfort are key. Gentle aftercare keeps delicate shaping smooth and long-lasting.',
    dos: [
      'Follow the aftercare balm routine for 7–10 days',
      'Keep the area clean and dry for the first few days',
      'Book touch-ups only when skin is fully healed',
    ],
    donts: [
      'Avoid direct water pressure, heavy scrubbing, or saunas',
      'Do not pick flaking skin while healing',
      'Skip makeup directly over fresh treatment zones',
    ],
  },
}

const tikTokVideos = [
  {
    title: 'Luxury transformation',
    src: 'https://www.tiktok.com/embed/v2/7245909266037437190',
  },
  {
    title: 'Glossy brunette finish',
    src: 'https://www.tiktok.com/embed/v2/7306668249389344031',
  },
  {
    title: 'Fresh nail glow-up',
    src: 'https://www.tiktok.com/embed/v2/7344179569093513509',
  },
]

export default function LandingPage() {
  const [activeGuideline, setActiveGuideline] = useState('hair')
  const [loginOpen, setLoginOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const activeTreatment = treatmentGuidelines[activeGuideline]

  return (
    <div className="min-h-screen bg-[#120d14] text-stone-50">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="mb-10 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f8d7bc] via-[#d8a277] to-[#8f5d49] text-sm font-semibold text-[#221712]">
                J
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#e8c4a6]">Jerry Beauty</p>
                <p className="text-sm text-stone-300">Salon & Spa</p>
              </div>
            </div>
            <nav className="hidden items-center gap-6 text-sm text-stone-300 md:flex">
              <a href="#experience" className="transition hover:text-white">Experience</a>
              <a href="#proof" className="transition hover:text-white">Proof</a>
              <a href="#guidelines" className="transition hover:text-white">Guidelines</a>
            </nav>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(user.role === 'admin' ? '/admin' : user.role === 'employee' ? '/employee' : '/book')}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-200 transition hover:bg-white/10"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f2cfac] text-xs font-semibold uppercase text-[#211814]">
                      {(user.username || 'J').slice(0, 1)}
                    </span>
                    <span className="hidden sm:inline">{user.username} · {user.role}</span>
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-stone-300 transition hover:border-white/25 hover:text-white"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Sign in
                </button>
              )}
              <Link to="/book" className="rounded-full border border-[#f3caa8] bg-[#f3caa8] px-5 py-2 text-sm font-medium text-[#201813] transition hover:bg-[#f7d5b6]">
                Book a consultation
              </Link>
            </div>
          </div>
        </header>

        <main className="space-y-10">
          <section className="overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1a121a] via-[#120d14] to-[#1c1714] p-6 shadow-[0_30px_90px_rgba(17,10,15,0.5)] md:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#eab68b]/25 bg-[#eab68b]/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#f4d6b7]">
                  <Sparkles size={14} />
                  Premium self-care studio
                </div>

                <h1 className="max-w-xl text-4xl font-semibold leading-none tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                  Beauty rituals designed to glow naturally.
                </h1>

                <p className="mt-5 max-w-lg text-base leading-7 text-stone-300">
                  Hair, nails, henna, makeup, and precision eyebrow treatments for clients who want polished, confident results with a luxurious salon experience.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/book" className="inline-flex items-center gap-2 rounded-full bg-[#f4d4b3] px-6 py-3 text-sm font-medium text-[#1f1713] transition hover:bg-[#f4deb9]">
                    Reserve your session
                    <ArrowRight size={16} />
                  </Link>
                  <button className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/10">
                    Explore services
                  </button>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <p className="text-2xl font-semibold text-[#f6d4ad]">{stat.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
              </div>

              <div className="rounded-[32px] border border-white/10 bg-[#181118] p-5 shadow-[0_30px_80px_rgba(56,28,24,0.28)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#d8b18b]">Featured treatments</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">More than beauty</h2>
                  </div>
                  <div className="rounded-full border border-[#f6d4ad]/30 bg-[#f6d4ad]/10 p-2 text-[#f6d4ad]">
                    <Star size={18} fill="currentColor" />
                  </div>
                </div>

                <div className="space-y-3">
                  {services.map((service, index) => (
                    <div key={service} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8d7bc]/15 text-[#f8d7bc]">
                          {index === 0 ? <Scissors size={16} /> : index === 1 ? <Sparkles size={16} /> : index === 2 ? <Palette size={16} /> : <ShieldCheck size={16} />}
                        </div>
                        <span className="text-sm text-stone-200">{service}</span>
                      </div>
                      <span className="text-xs uppercase tracking-[0.2em] text-[#d9ad88]">Signature</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="experience" className="rounded-[32px] border border-white/10 bg-[#171016] p-6 md:p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#d3a075]">3D salon tour</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Step inside the studio.</h2>
              </div>
              <p className="max-w-md text-sm text-stone-400">
                Drop your salon .glb model into the public folder to replace this preview with your own branded 3D shop experience.
              </p>
            </div>
            <ShopCanvas />
          </section>

          <section id="proof" className="rounded-[32px] border border-white/10 bg-[#171016] p-6 md:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.24em] text-[#d3a075]">TikTok evidence</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Before & after transformations</h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {tikTokVideos.map((video) => (
                <div key={video.title} className="overflow-hidden rounded-[26px] border border-white/10 bg-[#0f0a11] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                  <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#0b090d]">
                    <iframe
                      src={video.src}
                      title={video.title}
                      allow="encrypted-media; accelerometer; clipboard-write; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-[450px] w-full border-0"
                    />
                  </div>
                  <p className="px-2 pb-2 pt-4 text-sm font-medium text-stone-200">{video.title}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="guidelines" className="rounded-[32px] border border-white/10 bg-[#171016] p-6 md:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.24em] text-[#d3a075]">Treatment guidelines</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Do’s and don’ts aftercare</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
              <div className="space-y-3">
                {Object.entries(treatmentGuidelines).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveGuideline(key)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      activeGuideline === key
                        ? 'border-[#e9bf9c] bg-[#f5d8ba]/10 text-white'
                        : 'border-white/10 bg-white/5 text-stone-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="font-medium">{item.title}</span>
                    <ChevronDown size={16} className={activeGuideline === key ? 'rotate-180' : ''} />
                  </button>
                ))}
              </div>

              <div className="rounded-[26px] border border-white/10 bg-[#0f0a11] p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-[#d3a075]">{activeTreatment.title}</p>
                <p className="mt-3 max-w-lg text-base leading-7 text-stone-300">{activeTreatment.description}</p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-emerald-200">Do</h3>
                    <ul className="space-y-2 text-sm text-stone-200">
                      {activeTreatment.dos.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-rose-200">Don’t</h3>
                    <ul className="space-y-2 text-sm text-stone-200">
                      {activeTreatment.donts.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-[#171016] p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#d3a075]">Ready to begin?</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Create your next signature look.</h2>
              </div>
              <Link to="/book" className="rounded-full bg-[#f2cfac] px-6 py-3 text-sm font-medium text-[#211814] transition hover:bg-[#f8d8bf]">
                Book your appointment
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
