---
description: Modern React development patterns and performance optimization
globs: "**/*.{tsx,jsx}"
---

# React Development Excellence

## Next.js App Router Patterns

### App Router Structure
- Use the `app` directory for routing (Next.js 14+)
- Each folder in `app` represents a route segment
- Routes are only accessible when `page.tsx` or `route.ts` files are added
- Project files can be safely colocated in route segments without being routable

```tsx
// Good: App Router structure
app/
  (dashboard)/
    events/
      page.tsx          // Route: /events
      [id]/
        page.tsx        // Route: /events/[id]
    layout.tsx          // Layout for dashboard routes
  api/
    events/
      route.ts          // API route: /api/events
```

### Server Components First (Next.js App Router)
- Default to Server Components for static content and data fetching
- Use Client Components only when interactivity is needed
- Mark Client Components with `'use client'` directive at the top of the file
- Server Components can be async and fetch data directly

```tsx
// Good: Server Component for data display (Next.js App Router)
// app/events/page.tsx
export default async function EventsPage() {
  const events = await fetchEvents(); // Server-side data fetching
  return (
    <div>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

// Good: Client Component only when needed
// components/InteractiveCounter.tsx
'use client';
import { useState } from 'react';

export function InteractiveCounter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Colocation in App Router
- Files can be colocated in route segments without being accessible
- Keep related components, utilities, and types near their routes
- Use feature-based organization within the `app` directory

```tsx
// Good: Colocated files in route segment
app/
  events/
    page.tsx                    // Route accessible
    components/
      EventCard.tsx            // Not routable, but colocated
    utils.ts                   // Not routable, but colocated
```

### Component Composition Over Inheritance
- Favor composition patterns for reusable logic
- Use render props or children for flexible APIs
- Implement compound components for complex UIs

```tsx
// Good: Compound component pattern
const Accordion = ({ children }: { children: React.ReactNode }) => (
  <div className="accordion">{children}</div>
);

const AccordionItem = ({ title, children }: AccordionItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>{title}</button>
      {isOpen && <div>{children}</div>}
    </div>
  );
};

// Usage
<Accordion>
  <AccordionItem title="Section 1">Content 1</AccordionItem>
  <AccordionItem title="Section 2">Content 2</AccordionItem>
</Accordion>
```

## Performance Optimization

### Memoization Strategy
- Use `React.memo` for components with stable props
- Apply `useMemo` for expensive calculations only
- Implement `useCallback` to stabilize function references

```tsx
// Good: Strategic memoization
interface ListItemProps {
  item: Item;
  onSelect: (id: string) => void;
}

const ListItem = React.memo(({ item, onSelect }: ListItemProps) => {
  const handleClick = useCallback(() => {
    onSelect(item.id);
  }, [item.id, onSelect]);

  // Expensive calculation only when item changes
  const processedData = useMemo(() => {
    return heavyProcessing(item.data);
  }, [item.data]);

  return (
    <div onClick={handleClick}>
      {item.name} - {processedData}
    </div>
  );
});

// Bad: Over-memoization
const SimpleComponent = React.memo(({ text }: { text: string }) => (
  <span>{text}</span> // Simple rendering doesn't need memoization
));
```

### Code Splitting and Lazy Loading
- Implement route-based code splitting
- Lazy load heavy components below the fold
- Use Suspense boundaries for loading states

```tsx
import { lazy, Suspense } from 'react';

// Good: Route-based code splitting
const Dashboard = lazy(() => import('./Dashboard'));
const Analytics = lazy(() => import('./Analytics'));

const App = () => (
  <Router>
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  </Router>
);
```

## State Management Best Practices

### Local State First
- Keep state as local as possible
- Lift state only when sharing between components
- Use compound components to avoid prop drilling

```tsx
// Good: Local state for component-specific data
const UserForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '' });
  // Form state stays local unless shared
};

// Good: Lifted state when sharing needed
const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  return (
    <>
      <UserList onUserSelect={setSelectedUser} />
      <UserDetails user={selectedUser} />
    </>
  );
};
```

## Error Handling and Resilience

### Error Boundaries
- Implement error boundaries for component trees
- Provide fallback UIs for graceful degradation
- Log errors for monitoring and debugging

```tsx
class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    // Send to error monitoring service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}
```

## Performance Anti-Patterns to Avoid

### Common Mistakes
- Creating objects/functions in render
- Inline styles that recreate objects
- Missing dependency arrays in hooks
- Overusing useEffect for derived state

```tsx
// Bad: Performance anti-patterns
const BadComponent = ({ items, filter }) => {
  // Creates new object every render
  const style = { color: 'red', fontSize: '14px' };
  
  // Creates new function every render
  const handleClick = () => console.log('clicked');
  
  // useEffect for derived state
  const [filteredItems, setFilteredItems] = useState([]);
  useEffect(() => {
    setFilteredItems(items.filter(item => item.type === filter));
  }, [items, filter]);

  return (
    <div style={style}>
      {filteredItems.map(item => (
        <div key={item.id} onClick={handleClick}>
          {item.name}
        </div>
      ))}
    </div>
  );
};

// Good: Optimized version
const style = { color: 'red', fontSize: '14px' }; // Outside component

const GoodComponent = ({ items, filter }) => {
  // Derived state with useMemo
  const filteredItems = useMemo(() => 
    items.filter(item => item.type === filter), 
    [items, filter]
  );
  
  // Stable function reference
  const handleClick = useCallback(() => console.log('clicked'), []);

  return (
    <div style={style}>
      {filteredItems.map(item => (
        <div key={item.id} onClick={handleClick}>
          {item.name}
        </div>
      ))}
    </div>
  );
};
```
