# Google Maps & Places API Setup

This guide covers setting up Google Maps for the call sheet location embeds and the (future) nearest-hospital auto-suggest feature.

## 1. Create a Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Create a new project (or use an existing one)
3. Enable billing (required for Maps APIs)

## 2. Enable APIs

Enable these APIs in the Google Cloud Console under "APIs & Services > Library":

- **Maps Embed API** -- for embedding maps on the published call sheet
- **Places API (New)** -- for nearest-hospital search (future feature)

## 3. Create API Keys

### Client-side key (Maps Embed)
1. Go to "APIs & Services > Credentials"
2. Create an API key
3. Restrict it:
   - Application restriction: HTTP referrers
   - Add your domains: `*.fna.wtf/*`, `localhost:3000/*`
   - API restriction: Maps Embed API only

### Server-side key (Places API)
1. Create a second API key
2. Restrict it:
   - Application restriction: IP addresses (your server IPs)
   - API restriction: Places API only

## 4. Environment Variables

Add to `.env.local`:

```
# Client-side: used in iframe embeds on the published call sheet
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Server-side: used by server actions for hospital lookup
GOOGLE_PLACES_API_KEY=AIza...
```

## 5. Usage

### Maps Embed (current)
The call sheet uses a Google Maps embed iframe with the location address:
```
https://www.google.com/maps/embed/v1/place?key=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(address)}
```

### Nearest Hospital Search (future)
A server action will call the Places API Nearby Search:
```
POST https://places.googleapis.com/v1/places:searchNearby
{
  "includedTypes": ["hospital"],
  "maxResultCount": 5,
  "locationRestriction": {
    "circle": {
      "center": { "latitude": lat, "longitude": lng },
      "radius": 16000
    }
  }
}
```
Header: `X-Goog-Api-Key: ${GOOGLE_PLACES_API_KEY}`

## 6. Billing Notes

- Maps Embed API: Free (no charge)
- Places API: $0.032 per Nearby Search request (first $200/month free)
- At typical usage (a few call sheets per week), costs should be negligible
