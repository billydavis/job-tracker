export function loadShade(url) {
    if (typeof window === 'undefined') return Promise.resolve(false)
    if (window.__shade_loaded__) return Promise.resolve(true)

    return new Promise((resolve, reject) => {
        try {
            const s = document.createElement('script')
            s.src = url
            s.async = true
            s.onload = () => {
                window.__shade_loaded__ = true
                resolve(true)
            }
            s.onerror = (e) => reject(new Error('Failed to load ShadeCDN script'))
            document.head.appendChild(s)
        } catch (err) {
            reject(err)
        }
    })
}

export function isShadeLoaded() {
    return typeof window !== 'undefined' && !!window.__shade_loaded__
}
