module.exports = {
  indiehackers: {
    url: 'https://www.indiehackers.com/products',
    selectors: {
      startupCard: 'div.product-card',            // ✅ this wraps each startup
      name: 'span.product-card__name',            // ✅ confirmed
      pitch: 'span.product-card__tagline',        // ✅ confirmed
      link: null,                                 // No external link available
      founder: null
    },
    maxStartups: 10
  }
};
