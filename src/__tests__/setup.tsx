import '@testing-library/jest-dom'

// Silence Next.js internals that aren't relevant to unit tests
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, fill: _fill, sizes: _sizes, ...props }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img src={src as string} alt={alt as string} {...props} />
  ),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock next/dynamic so dynamic imports resolve immediately in tests
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    let Component: React.ComponentType | null = null
    fn().then((mod) => { Component = mod.default })
    return (props: Record<string, unknown>) => Component ? <Component {...props} /> : <div data-testid="dynamic-placeholder" />
  },
}))

// Suppress console.error for expected React warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0])
    if (
      msg.includes('Warning: An update to') ||
      msg.includes('act(') ||
      msg.includes('ReactDOM.render')
    ) return
    originalError(...args)
  }
})
afterAll(() => {
  console.error = originalError
})
