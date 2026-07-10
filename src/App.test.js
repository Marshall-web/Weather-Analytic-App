import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            latitude: 51.5072,
            longitude: -0.1276,
            name: 'London',
            country: 'United Kingdom',
            feature_code: 'PPLC',
          },
        ],
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        current: {
          time: '2026-06-12T10:00',
          temperature_2m: 21,
          apparent_temperature: 22,
          relative_humidity_2m: 62,
          weather_code: 1,
          wind_speed_10m: 12,
          surface_pressure: 1012,
        },
        hourly: {
          time: Array.from({ length: 24 }, (_, hour) => `2026-06-12T${String(hour).padStart(2, '0')}:00`),
          temperature_2m: Array.from({ length: 24 }, () => 21),
          apparent_temperature: Array.from({ length: 24 }, () => 22),
          relative_humidity_2m: Array.from({ length: 24 }, () => 62),
          precipitation_probability: Array.from({ length: 24 }, () => 10),
        },
      }),
    });
});

test('renders weather dashboard search', async () => {
  render(<App />);
  expect(screen.getByText(/weather analytics/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/search for a city/i)).toBeInTheDocument();
  expect(await screen.findByText(/london, united kingdom/i)).toBeInTheDocument();
});
