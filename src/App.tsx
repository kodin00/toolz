import { useMemo, useState } from 'react'
import { Icon } from './components/Icon'
import { getTool, tools } from './tools/registry'

function Sidebar({
  activeToolId,
  onHome,
  onOpenTool,
}: {
  activeToolId: string | null
  onHome: () => void
  onOpenTool: (id: string) => void
}) {
  return (
    <aside className="sidebar">
      <button className="brand" onClick={onHome} type="button">
        <span className="brand-mark"><Icon name="bolt" size={18} /></span>
        <span>TOOLROOM</span>
      </button>

      <nav className="side-nav" aria-label="Main navigation">
        <p className="nav-label">Workspace</p>
        <button className={!activeToolId ? 'nav-item active' : 'nav-item'} onClick={onHome} type="button">
          <Icon name="layers" size={18} />
          All tools
          <span className="nav-count">{tools.length}</span>
        </button>

        <p className="nav-label nav-label-spaced">Your tools</p>
        {tools.map((tool) => (
          <button
            className={activeToolId === tool.id ? 'nav-item active' : 'nav-item'}
            key={tool.id}
            onClick={() => onOpenTool(tool.id)}
            type="button"
          >
            <Icon name={tool.icon} size={18} />
            <span>{tool.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="privacy-note">
          <span className="privacy-icon"><Icon name="shield" size={16} /></span>
          <div>
            <strong>Private by design</strong>
            <span>Your files stay on this device.</span>
          </div>
        </div>
        <div className="profile">
          <span className="avatar">K</span>
          <div>
            <strong>My workspace</strong>
            <span>Personal collection</span>
          </div>
          <Icon name="more" size={18} />
        </div>
      </div>
    </aside>
  )
}

function Home({ onOpenTool }: { onOpenTool: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [showGuide, setShowGuide] = useState(false)
  const filteredTools = useMemo(
    () => tools.filter((tool) => `${tool.name} ${tool.description}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  return (
    <main className="main-content">
      <header className="topbar">
        <div className="search-wrap">
          <Icon name="search" size={18} />
          <input
            aria-label="Search tools"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your tools..."
            value={query}
          />
          <kbd>⌘ K</kbd>
        </div>
        <button className="add-button" onClick={() => setShowGuide(true)} type="button">
          <Icon name="plus" size={17} />
          Add a tool
        </button>
      </header>

      <div className="home-shell">
        <section className="hero">
          <div>
            <span className="eyebrow"><i /> YOUR WORKSPACE</span>
            <h1>Small tools.<br /><em>Big shortcuts.</em></h1>
            <p>A calm home for the utilities you use every day. No sign-ins, no uploads, no clutter.</p>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="orbit-core"><Icon name="bolt" size={30} /></span>
          </div>
        </section>

        <section className="tools-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">COLLECTION</span>
              <h2>Your tools</h2>
            </div>
            <span>{filteredTools.length} ready to use</span>
          </div>

          <div className="tool-grid">
            {filteredTools.map((tool) => (
              <button className="tool-card" key={tool.id} onClick={() => onOpenTool(tool.id)} type="button">
                <span className="tool-card-top">
                  <span className="tool-icon" style={{ background: tool.accent }}>
                    <Icon name={tool.icon} size={25} />
                  </span>
                  <span className="card-badge">READY</span>
                </span>
                <span className="tool-card-copy">
                  <span className="tool-category">{tool.category} utility</span>
                  <strong>{tool.name}</strong>
                  <span>{tool.description}</span>
                </span>
                <span className="card-action">Open tool <Icon name="arrow" size={17} /></span>
              </button>
            ))}
            <div className="empty-tool-card">
              <span className="dashed-plus"><Icon name="plus" size={22} /></span>
              <strong>Your next shortcut</strong>
              <span>Drop a new module into the registry whenever you need it.</span>
            </div>
          </div>
        </section>
      </div>
      {showGuide && (
        <div className="modal-backdrop" onMouseDown={() => setShowGuide(false)}>
          <section
            aria-labelledby="module-guide-title"
            aria-modal="true"
            className="module-guide"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button aria-label="Close module guide" className="modal-close" onClick={() => setShowGuide(false)} type="button">×</button>
            <span className="eyebrow"><i /> MODULAR BY DESIGN</span>
            <h2 id="module-guide-title">Add your next tool.</h2>
            <p>Every utility lives in its own folder and only meets the platform through one registry entry.</p>
            <ol>
              <li><b>01</b><span><strong>Create the module</strong><small>Add a self-contained component under <code>src/tools</code>.</small></span></li>
              <li><b>02</b><span><strong>Register its details</strong><small>Add its name, icon, category, and component to <code>registry.ts</code>.</small></span></li>
              <li><b>03</b><span><strong>That’s it</strong><small>The dashboard and navigation update automatically.</small></span></li>
            </ol>
            <button className="primary-button modal-done" onClick={() => setShowGuide(false)} type="button">Got it</button>
          </section>
        </div>
      )}
    </main>
  )
}

export default function App() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null)
  const activeTool = activeToolId ? getTool(activeToolId) : undefined
  const ActiveTool = activeTool?.component

  return (
    <div className="app-shell">
      <Sidebar activeToolId={activeToolId} onHome={() => setActiveToolId(null)} onOpenTool={setActiveToolId} />
      {ActiveTool && activeTool ? (
        <main className="main-content tool-page">
          <header className="tool-topbar">
            <button className="back-button" onClick={() => setActiveToolId(null)} type="button">
              <Icon name="back" size={18} />
              All tools
            </button>
            <span className="tool-breadcrumb">Image utilities <Icon name="chevron" size={13} /> {activeTool.name}</span>
          </header>
          <ActiveTool />
        </main>
      ) : (
        <Home onOpenTool={setActiveToolId} />
      )}
    </div>
  )
}
