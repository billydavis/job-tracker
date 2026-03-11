import React from 'react'

// ShadeButton always renders a native <button>. Shadow DOM buttons cannot submit
// a <form> in the light DOM (different form-owner tree), so we never use the
// custom element here.
export const ShadeButton = React.forwardRef(({ children, ...props }, ref) => (
    <button ref={ref} {...props}>{children}</button>
))

// ShadeInput always renders a native <input>. React controlled inputs rely on
// e.target.value from a real HTMLInputElement; events from inside shadow DOM
// have the custom element as target, breaking onChange reliably.
export const ShadeInput = React.forwardRef(({ ...props }, ref) => (
    <input ref={ref} {...props} />
))

export const ShadeCard = ({ children, ...props }) => {
    if (typeof window !== 'undefined' && window.customElements && customElements.get('shade-card')) {
        return React.createElement('shade-card', { ...props }, children)
    }
    return <div {...props} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fff' }}>{children}</div>
}

export const ShadeList = ({ children, ...props }) => {
    if (typeof window !== 'undefined' && window.customElements && customElements.get('shade-list')) {
        return React.createElement('shade-list', { ...props }, children)
    }
    return <ul {...props}>{children}</ul>
}

export const ShadeHeader = ({ title, subtitle, children, ...props }) => {
    if (typeof window !== 'undefined' && window.customElements && customElements.get('shade-header')) {
        return React.createElement('shade-header', { title, subtitle, ...props }, children)
    }
    return (
        <header {...props} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
                <h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>
                {subtitle && <div style={{ color: '#6b7280', fontSize: 13 }}>{subtitle}</div>}
            </div>
            {children}
        </header>
    )
}

export const ShadeLabel = ({ children, ...props }) => {
    if (typeof window !== 'undefined' && window.customElements && customElements.get('shade-label')) {
        return React.createElement('shade-label', { ...props }, children)
    }
    return <label {...props} style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>{children}</label>
}

// Always native — custom element shadow roots break form submission and onSubmit.
export const ShadeForm = ({ children, ...props }) => <form {...props}>{children}</form>

export const ShadeTextarea = React.forwardRef(({ ...props }, ref) => <textarea ref={ref} {...props} />)

export const ShadeContainer = ({ children, ...props }) => {
    if (typeof window !== 'undefined' && window.customElements && customElements.get('shade-container')) {
        return React.createElement('shade-container', { ...props }, children)
    }
    return <div {...props} style={{ maxWidth: 960, margin: '0 auto' }}>{children}</div>
}
