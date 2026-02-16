# Cal.com Calendar Embed Implementation Plan

**Created**: 2026-02-16 03:40 PST  
**Status**: Planning  
**Target**: FooterCTA section ("Ready to bring your vision to life?")

---

## Project Context

### Current State
- **Location**: [`src/components/layout/FooterCTA.tsx`](src/components/layout/FooterCTA.tsx:1)
- **Current Design**: Section with heading, description, and two buttons:
  - Primary: "Schedule a Call" (links to `/contact`)
  - Secondary: "Explore Services" (links to `/services`)
- **Positioning**: Appears above the actual footer, last section on homepage

### Cal.com MCP Configuration
- **API Key**: Configured in [`.kilocode/mcp.json`](.kilocode/mcp.json:1)
- **Environment Variable**: `NEXT_PUBLIC_CALCOM_USERNAME` (from [`.env.example`](.env.example:12))
- **Event Types**: Currently empty (need to verify Cal.com account setup)

---

## Implementation Approach

### Option 1: Cal.com Embed Script (Recommended)
Cal.com provides an official embed script that creates an inline calendar widget.

**Pros**:
- Official Cal.com solution
- Handles all booking logic
- Auto-updates with Cal.com changes
- Built-in responsive design

**Cons**:
- Requires client-side JavaScript
- Less control over styling
- External dependency

### Option 2: Cal.com API Integration
Use the Cal.com MCP to build a custom booking interface.

**Pros**:
- Full control over UI/UX
- Custom styling to match FNA.WTF design
- No external scripts

**Cons**:
- More development effort
- Manual updates needed
- Need to handle edge cases

**Decision**: Go with **Option 1** (Embed Script) for faster implementation and reliability, with custom styling applied via CSS.

---

## Technical Implementation Plan

### 1. Cal.com Account Setup

**Prerequisites**:
- Verify Cal.com account is active
- Create "Intro Call" event type (if not exists)
- Configure event duration (e.g., 30 minutes)
- Set availability schedule
- Customize booking form fields

**Event Type Configuration**:
```
Event Name: Intro Call
Duration: 30 minutes
Description: Let's discuss your project and how we can help
Location: Google Meet / Zoom (auto-generated)
Booking Fields: Name, Email, Company, Project Brief
```

### 2. Component Architecture

```
FooterCTA (Server Component)
  └── CalEmbed (Client Component)
        ├── Cal.com embed script
        ├── Loading state
        └── Error boundary
```

### 3. File Structure

**New Files**:
- [`src/components/homepage/CalEmbed.tsx`](src/components/homepage/CalEmbed.tsx) - Client component for calendar embed
- [`src/lib/cal/config.ts`](src/lib/cal/config.ts) - Cal.com configuration constants

**Modified Files**:
- [`src/components/layout/FooterCTA.tsx`](src/components/layout/FooterCTA.tsx:1) - Add calendar embed
- [`.env.example`](.env.example:1) - Document Cal.com variables

### 4. Implementation Steps

#### Step 1: Create Cal.com Configuration
```typescript
// src/lib/cal/config.ts
export const CAL_CONFIG = {
  username: process.env.NEXT_PUBLIC_CALCOM_USERNAME || '',
  eventType: 'intro-call', // Event type slug
  theme: 'dark', // Match FNA.WTF theme
};
```

#### Step 2: Create CalEmbed Component
```typescript
// src/components/homepage/CalEmbed.tsx
'use client';

import { useEffect } from 'react';

export function CalEmbed() {
  useEffect(() => {
    // Load Cal.com embed script
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div 
      className="cal-embed-container"
      data-cal-link={`${username}/${eventType}`}
      data-cal-config='{"theme":"dark"}'
      style={{ minHeight: '600px' }}
    />
  );
}
```

#### Step 3: Update FooterCTA Component
```typescript
// src/components/layout/FooterCTA.tsx
import { CalEmbed } from '@/components/homepage/CalEmbed';

export async function FooterCTA() {
  return (
    <section className="py-16 px-6 border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-display">
            Ready to bring your vision to life?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Schedule a free intro call to discuss your project
          </p>
        </div>

        {/* Calendar Embed */}
        <div className="max-w-4xl mx-auto">
          <CalEmbed />
        </div>

        {/* Alternative CTA */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">
            Prefer to explore first?
          </p>
          <NavButton href="/services">View Our Services</NavButton>
        </div>
      </div>
    </section>
  );
}
```

### 5. Styling Integration

**Cal.com Embed Customization**:
```css
/* Add to src/app/globals.css */

/* Cal.com embed dark theme customization */
.cal-embed-container {
  --cal-brand-color: hsl(var(--primary));
  --cal-bg-color: hsl(var(--background));
  --cal-text-color: hsl(var(--foreground));
  --cal-border-color: hsl(var(--border));
}

/* Override Cal.com styles to match FNA.WTF design */
.cal-embed-container [data-cal-embed] {
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  overflow: hidden;
}
```

### 6. Environment Variables

Update [`.env.example`](.env.example:11):
```bash
# Cal.com Configuration
NEXT_PUBLIC_CALCOM_USERNAME=your_calcom_username_here
```

**Required Actions**:
1. Create `.env.local` file (if not exists)
2. Add actual Cal.com username
3. Verify username matches Cal.com account

---

## Cal.com MCP Integration

### Available MCP Tools

Based on the Cal.com MCP server, we have these tools available:
- `getEventTypes` - List all event types
- `getEventTypeById` - Get specific event type details
- `createBooking` - Create a new booking (for API-based approach)
- `getBookings` - Retrieve bookings

### MCP Use Cases

**During Development**:
- Verify event types exist: `getEventTypes`
- Check event configuration: `getEventTypeById`

**Future Enhancements**:
- Custom booking confirmations
- Booking analytics dashboard
- Automated follow-ups

---

## Design Considerations

### Layout Options

**Option A: Full-Width Calendar** (Recommended)
```
┌─────────────────────────────────────────┐
│     Ready to bring your vision...       │
│     Schedule a free intro call          │
├─────────────────────────────────────────┤
│                                         │
│          [CALENDAR EMBED]               │
│        (Time slot picker)               │
│                                         │
├─────────────────────────────────────────┤
│     Prefer to explore first?            │
│       [View Our Services]               │
└─────────────────────────────────────────┘
```

**Option B: Side-by-Side Layout**
```
┌─────────────────────────────────────────┐
│     Ready to bring your vision...       │
├──────────────────┬──────────────────────┤
│                  │                      │
│  Why schedule?   │  [CALENDAR EMBED]    │
│  • Bullet 1      │                      │
│  • Bullet 2      │                      │
│                  │                      │
└──────────────────┴──────────────────────┘
```

**Recommendation**: Start with **Option A** for simplicity and mobile-friendliness.

### Mobile Responsiveness

- **Desktop**: Full calendar with monthly view
- **Tablet**: Compact calendar with weekly view
- **Mobile**: List view of available time slots

Cal.com embed handles this automatically, but we should test across devices.

---

## Testing Plan

### Functional Testing
- [ ] Calendar loads correctly
- [ ] Time slots display available times
- [ ] Booking flow completes successfully
- [ ] Confirmation emails sent
- [ ] Calendar updates with new bookings

### Visual Testing
- [ ] Matches FNA.WTF dark theme
- [ ] Proper spacing and alignment
- [ ] Responsive on all screen sizes
- [ ] Animations smooth (if any)

### Edge Cases
- [ ] No available slots (all booked)
- [ ] JavaScript disabled (fallback message)
- [ ] Slow network (loading state)
- [ ] Booking conflicts (double bookings)

---

## Alternative Approaches

### If Cal.com Embed Doesn't Work

**Plan B: Modal/Popup Embed**
- Keep "Schedule a Call" button
- Open Cal.com embed in modal overlay
- Use Cal.com's popup embed mode

**Plan C: Direct Link**
- Button links directly to Cal.com booking page
- Opens in new tab
- Simplest fallback option

---

## Success Metrics

### Implementation Complete When:
1. ✅ Calendar embed displays correctly in FooterCTA
2. ✅ Users can book intro calls successfully
3. ✅ Design matches FNA.WTF aesthetic
4. ✅ Mobile responsive and accessible
5. ✅ Loading states handle gracefully
6. ✅ Error boundaries prevent crashes

---

## Next Steps

### Immediate Actions Required:

1. **Verify Cal.com Account Setup**
   - Log into Cal.com dashboard
   - Check if "Intro Call" event type exists
   - Note the exact event type slug
   - Confirm Cal.com username

2. **Get Event Type Information**
   - Use MCP to query event types
   - Document event type ID and slug
   - Verify configuration matches requirements

3. **Set Up Environment Variables**
   - Create `.env.local` if needed
   - Add `NEXT_PUBLIC_CALCOM_USERNAME`
   - Test environment variable access

4. **Implementation Order**
   1. Create [`src/lib/cal/config.ts`](src/lib/cal/config.ts)
   2. Create [`src/components/homepage/CalEmbed.tsx`](src/components/homepage/CalEmbed.tsx)
   3. Update [`src/components/layout/FooterCTA.tsx`](src/components/layout/FooterCTA.tsx:1)
   4. Add CSS customization to [`src/app/globals.css`](src/app/globals.css:1)
   5. Update [`.env.example`](.env.example:1)
   6. Test and refine

---

## Resources

### Cal.com Documentation
- **Embed Guide**: https://cal.com/docs/integrations/embed
- **Embed Examples**: https://github.com/calcom/cal.com/tree/main/packages/embeds
- **API Reference**: https://cal.com/docs/api-reference

### Cal.com Embed Modes
- `inline` - Embedded directly in page (recommended)
- `popup` - Opens in modal overlay
- `drawer` - Slides in from side

### Embed Configuration Options
```javascript
{
  theme: 'dark',              // Match FNA.WTF theme
  hideEventTypeDetails: false, // Show event description
  layout: 'month_view',       // Monthly calendar layout
  emailRequired: true,        // Require email for booking
  styles: {
    branding: {
      brandColor: '#yourcolor'
    }
  }
}
```

---

## Questions to Answer

Before implementation, we need to clarify:

1. **Cal.com Account**:
   - What is your Cal.com username?
   - Is the "Intro Call" event type created?
   - What's the desired call duration?

2. **Design Preferences**:
   - Full-width calendar or side-by-side layout?
   - Show/hide event description in embed?
   - Custom branding colors?

3. **Booking Flow**:
   - Required fields beyond name/email?
   - Confirmation page redirect?
   - Custom success message?

4. **Integration Scope**:
   - Just homepage or other pages too?
   - Want booking analytics dashboard?
   - Need webhook integration for automation?

---

## Risk Assessment

### Low Risk
- Cal.com embed is well-documented and stable
- Simple integration with minimal code
- No complex backend logic required

### Medium Risk
- Styling Cal.com embed to match dark theme
- Mobile responsiveness (handled by Cal.com but needs testing)
- Loading performance (external script dependency)

### Mitigation Strategies
- Implement loading skeleton UI
- Add error boundary for graceful failures
- Test extensively on mobile devices
- Have fallback link to Cal.com booking page

---

## Estimated Effort

- **Planning**: ✅ Complete
- **Cal.com Setup**: 15-30 minutes
- **Component Development**: 30-45 minutes
- **Styling & Customization**: 30-60 minutes
- **Testing & Refinement**: 30-45 minutes

**Total**: 2-3 hours including testing

---

## Notes

- Cal.com MCP returns empty event types currently - need to verify account setup
- The MCP API key is configured: `cal_live_df7e83eb05ae47d1d9771f38f39d9562`
- Environment variable `NEXT_PUBLIC_CALCOM_USERNAME` needs to be set in `.env.local`
- Consider adding analytics to track booking conversion rates
- May want to add a "What to expect" section above the calendar

---

**This plan will be updated as we gather more information and implement the solution.**
