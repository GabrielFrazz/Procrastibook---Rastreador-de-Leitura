export function ReadingJourneyArtwork() {
  return (
    <svg
      aria-hidden="true"
      className="auth-story__artwork"
      fill="none"
      viewBox="0 0 520 390"
    >
      <path
        className="auth-story__sun"
        d="M87 289c0-114 77-206 173-206s173 92 173 206H87Z"
      />

      <g className="auth-story__shelf-books">
        <rect height="114" rx="5" width="43" x="67" y="206" />
        <rect height="90" rx="5" width="46" x="114" y="230" />
        <rect height="126" rx="5" width="38" x="164" y="194" />
        <path d="m193 194 30 126h39l-30-134-39 8Z" />
        <rect height="102" rx="5" width="43" x="365" y="218" />
        <rect height="122" rx="5" width="41" x="412" y="198" />
      </g>

      <path
        className="auth-story__page"
        d="M151 130c42-13 82-6 109 18v151c-27-24-67-30-109-18V130Z"
      />
      <path
        className="auth-story__page"
        d="M369 130c-42-13-82-6-109 18v151c27-24 67-30 109-18V130Z"
      />
      <path
        className="auth-story__page-fold"
        d="M151 130c42-13 82-6 109 18v151M369 130c-42-13-82-6-109 18v151"
      />
      <path
        className="auth-story__bookmark"
        d="M320 131h25v70l-12.5-11-12.5 11v-70Z"
      />

      <g className="auth-story__page-lines">
        <path d="M177 171c20-5 38-4 55 2M177 193c20-5 38-4 55 2M177 215c17-4 33-4 48 1" />
        <path d="M288 173c17-6 34-7 54-3M288 195c17-6 34-7 54-3M288 217c15-5 30-6 45-4" />
      </g>

      <path className="auth-story__shelf" d="M45 320h430M76 339h368" />
      <circle className="auth-story__dot" cx="87" cy="158" r="7" />
      <circle className="auth-story__dot" cx="421" cy="154" r="5" />
      <path
        className="auth-story__spark"
        d="m407 93 5 12 12 5-12 5-5 12-5-12-12-5 12-5 5-12Z"
      />
    </svg>
  );
}
