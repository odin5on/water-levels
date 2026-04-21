import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
          ← Back to Map
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">About</h1>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-gray-900 mb-2">Data Source</h2>
            <p>
              All data comes from the{' '}
              <a
                href="https://api.waterdata.usgs.gov/ogcapi/v0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                USGS Modernized Water Data API (OGC)
              </a>
              , which provides real-time and historical streamflow data for
              monitoring stations across the United States. Only river/stream stations
              (site type ST) in Iowa are shown.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">Parameters</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Streamflow (Discharge)</strong> — Parameter 00060, measured in cubic feet per
                second (cfs). Indicates the volume of water moving through the channel per unit time.
              </li>
              <li>
                <strong>Gage Height</strong> — Parameter 00065, measured in feet (ft). The height of
                the water surface above the gage datum — a local reference elevation.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">Marker Colors</h2>
            <p className="mb-2">
              Map markers are colored by streamflow percentile relative to all daily mean
              values over the past 5 years — not adjusted for time of year.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-red-600">Red</span> — Much below normal (&lt;10th percentile)</li>
              <li><span className="font-medium text-orange-500">Orange</span> — Below normal (10–25th)</li>
              <li><span className="font-medium text-green-500">Green</span> — Normal (25–75th)</li>
              <li><span className="font-medium text-blue-500">Blue</span> — Above normal (75–90th)</li>
              <li><span className="font-medium text-purple-500">Purple</span> — Much above normal (&gt;90th)</li>
              <li><span className="font-medium text-gray-400">Gray</span> — No current data</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">Provisional Data</h2>
            <p>
              Data marked <strong>Provisional</strong> has not yet been reviewed and approved by USGS
              hydrographers. It may be inaccurate or subject to revision. Approved data has been
              reviewed and is suitable for most purposes.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">API Status</h2>
            <p>
              The USGS OGC API is currently in alpha. Schema or endpoint changes are possible.
              All API calls are isolated in a single module (
              <code className="bg-gray-100 px-1 rounded text-xs">src/api/usgs.ts</code>).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-2">Links</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <a
                  href="https://waterdata.usgs.gov/nwis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  USGS National Water Information System
                </a>
              </li>
              <li>
                <a
                  href="https://dashboard.waterdata.usgs.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  USGS National Water Dashboard
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
