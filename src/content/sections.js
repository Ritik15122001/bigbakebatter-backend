/**
 * Registry of every admin-editable storefront section.
 *
 * Each entry: { key, group, label, fields, defaults }
 *   key       unique id, "<page>.<section>" (e.g. "home.trust")
 *   group     admin grouping (Homepage, Layout, About page, ...)
 *   label     human name shown in the admin
 *   fields    form schema, each { name, label, type, hint?, fields?, itemLabel? }
 *             type: text | textarea | richtext | number | bool | image | icon | link | list
 *             "list" is an array of objects described by its own `fields`
 *   defaults  the content the storefront shipped with — must match what the
 *             storefront renders when nothing has been saved, so an empty DB
 *             looks exactly like the original design.
 *
 * The storefront keeps a mirror of every `defaults` object in
 * src/data/siteDefaults.js (used when the API is unreachable) — keep the two
 * in sync when changing a default here.
 *
 * GET /api/content/schema returns this array; GET /api/content returns
 * { [key]: defaults merged with saved overrides }.
 */

// ---- field helpers -------------------------------------------------------
const f = (type) => (name, label, hint) => ({ name, label, type, ...(hint ? { hint } : {}) });
const text = f('text');
const textarea = f('textarea');
const richtext = f('richtext');
const number = f('number');
const image = f('image');
const icon = f('icon');
const link = f('link');
const list = (name, label, fields, itemLabel, hint) => ({
  name, label, type: 'list', fields, itemLabel, ...(hint ? { hint } : {}),
});

const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=72`;

const LINK_HINT = 'A page on this site such as /shop or /contact, or a full https:// web address.';
const RICH_HINT =
  'Leave a blank line between paragraphs. Start a line with "## " to make it a heading, and with "- " to make it a bullet point.';
const KICKER_HINT = 'The small handwritten-style line above the heading.';
const ALT_HINT = 'A short description of the photo, read out by screen readers.';

/** Kicker / heading / optional sub-line, used by most homepage sections. */
const headFields = ({ sub = false, linkBtn = false } = {}) => [
  text('kicker', 'Small heading', KICKER_HINT),
  text('title', 'Heading'),
  ...(sub ? [textarea('sub', 'Sub-heading')] : []),
  ...(linkBtn ? [text('linkLabel', 'Button text'), link('linkTo', 'Button link', LINK_HINT)] : []),
];

const linkItem = [text('label', 'Text'), link('to', 'Goes to', LINK_HINT)];
const iconLinkItem = [text('label', 'Text'), link('to', 'Goes to', LINK_HINT), icon('icon', 'Icon')];
const labelItem = [text('label', 'Text')];

export const SECTIONS = [
  // ======================================================================
  // Homepage
  // ======================================================================
  {
    key: 'home.merch',
    group: 'Homepage',
    label: 'Quick-shop tiles (under the hero)',
    fields: [
      text('occasionTitle', 'Tile 1 — heading'),
      list(
        'occasionTiles', 'Tile 1 — categories shown',
        [
          text('category', 'Category name', 'Must match a category name exactly, e.g. Birthday. The first cake in that category is shown.'),
          text('label', 'Caption', 'Leave blank to show the category name.'),
        ],
        'category',
        'Up to 4 categories.'
      ),
      text('occasionLink', 'Tile 1 — link text'),
      link('occasionLinkTo', 'Tile 1 — link goes to', LINK_HINT),
      text('bestTitle', 'Tile 2 (bestsellers) — heading'),
      text('bestLink', 'Tile 2 — link text'),
      link('bestLinkTo', 'Tile 2 — link goes to', LINK_HINT),
      text('valueTitle', 'Tile 3 (value picks) — heading', 'If you change the price limit below, update the price in this heading too.'),
      number('valueMaxPrice', 'Tile 3 — show cakes priced under (₹)'),
      text('valueLink', 'Tile 3 — link text'),
      link('valueLinkTo', 'Tile 3 — link goes to', LINK_HINT),
      text('vegTitle', 'Tile 4 (pure veg) — heading'),
      text('vegLink', 'Tile 4 — link text'),
      link('vegLinkTo', 'Tile 4 — link goes to', LINK_HINT),
    ],
    defaults: {
      occasionTitle: 'Shop by occasion',
      occasionTiles: [
        { category: 'Birthday', label: '' },
        { category: 'Anniversary', label: '' },
        { category: 'Cupcakes', label: '' },
        { category: 'Cheesecakes', label: '' },
      ],
      occasionLink: 'Browse all occasions',
      occasionLinkTo: '/shop',
      bestTitle: 'Bestsellers this week',
      bestLink: 'See all bestsellers',
      bestLinkTo: '/shop',
      valueTitle: 'Under ₹650 · everyday bakes',
      valueMaxPrice: 650,
      valueLink: 'See more value picks',
      valueLinkTo: '/shop',
      vegTitle: '100% pure veg, no exceptions',
      vegLink: 'Explore the full menu',
      vegLinkTo: '/shop',
    },
  },
  {
    key: 'home.trust',
    group: 'Homepage',
    label: 'Trust strip (under the hero)',
    fields: [
      {
        name: 'items', label: 'Items', type: 'list', itemLabel: 'title',
        fields: [
          { name: 'icon', label: 'Icon', type: 'icon', hint: 'Use "veg" for the pure-veg mark.' },
          { name: 'title', label: 'Title', type: 'text' },
          { name: 'sub', label: 'Subtitle', type: 'text' },
        ],
      },
    ],
    defaults: {
      items: [
        { icon: 'truck', title: 'Same-day delivery', sub: 'Order before 2 PM' },
        { icon: 'sparkles', title: 'Baked fresh daily', sub: 'No preservatives, ever' },
        { icon: 'veg', title: '100% Pure Veg & Eggless', sub: 'Every single cake, always' },
        { icon: 'star', title: '4.9 average rating', sub: 'From 2,400+ orders' },
      ],
    },
  },
  {
    key: 'home.featured',
    group: 'Homepage',
    label: 'Featured cakes — heading',
    fields: headFields({ sub: true, linkBtn: true }),
    defaults: {
      kicker: 'Handpicked',
      title: "This week's featured cakes",
      sub: 'Four bakes our kitchen is particularly proud of right now.',
      linkLabel: 'View all cakes',
      linkTo: '/shop',
    },
  },
  {
    key: 'home.occasions',
    group: 'Homepage',
    label: 'Occasions — heading',
    fields: headFields(),
    defaults: { kicker: 'Shop by occasion', title: 'Every celebration, covered' },
  },
  {
    key: 'home.categories',
    group: 'Homepage',
    label: 'Category rail — heading',
    fields: headFields(),
    defaults: { kicker: 'Browse', title: 'Shop by category' },
  },
  {
    key: 'home.bestsellers',
    group: 'Homepage',
    label: 'Bestsellers — heading',
    fields: headFields({ sub: true }),
    defaults: { kicker: 'Loved most', title: 'Bestsellers this month', sub: 'Ranked by what actually left the kitchen.' },
  },
  {
    key: 'home.flavours',
    group: 'Homepage',
    label: 'Flavours — heading',
    fields: headFields(),
    defaults: { kicker: 'Signature flavours', title: "Pick a flavour, we'll do the rest" },
  },
  {
    key: 'home.customBand',
    group: 'Homepage',
    label: 'Custom cakes banner',
    fields: [
      text('kicker', 'Small heading', KICKER_HINT),
      text('title', 'Heading'),
      textarea('text', 'Text'),
      list('points', 'Highlights', [icon('icon', 'Icon'), text('text', 'Text')], 'text'),
      text('primaryLabel', 'Main button text'),
      link('primaryLink', 'Main button link', LINK_HINT),
      text('secondaryLabel', 'Second button text', 'Leave blank to hide the second button.'),
      link('secondaryLink', 'Second button link', LINK_HINT),
      image('image', 'Photo'),
      text('imageAlt', 'Photo description', ALT_HINT),
    ],
    defaults: {
      kicker: 'Custom cakes',
      title: 'Your idea, built by our bakers',
      text: 'Send a sketch, a screenshot or a sentence describing the celebration. We come back within 24 hours with a design and a fixed quote — no obligation.',
      points: [
        { icon: 'camera', text: 'Reference photos' },
        { icon: 'clock', text: '24-hour quote' },
        { icon: 'gift', text: 'Tiers & fondant' },
      ],
      primaryLabel: 'Create your cake',
      primaryLink: '/custom',
      secondaryLabel: 'See a wedding build',
      secondaryLink: '/blog',
      image: IMG('photo-1535254973040-607b474cb50d'),
      imageAlt: 'Custom wedding cake',
    },
  },
  {
    key: 'home.corporateBand',
    group: 'Homepage',
    label: 'Corporate cakes banner',
    fields: [
      text('kicker', 'Small heading', KICKER_HINT),
      text('title', 'Heading'),
      textarea('text', 'Text'),
      list('points', 'Highlights', [icon('icon', 'Icon'), text('text', 'Text')], 'text'),
      text('buttonLabel', 'Button text'),
      link('buttonLink', 'Button link', LINK_HINT),
      image('image', 'Photo'),
      text('imageAlt', 'Photo description', ALT_HINT),
    ],
    defaults: {
      kicker: 'For your workplace',
      title: 'Corporate cakes & bulk gifting',
      text: 'Office birthdays, team milestones, festive hampers or a client thank-you — order in bulk with company branding, a dedicated account manager and a GST invoice, delivered on your schedule.',
      points: [
        { icon: 'pkg', text: 'Bulk & recurring orders' },
        { icon: 'gem', text: 'Logo & branded toppers' },
        { icon: 'news', text: 'GST invoicing' },
      ],
      buttonLabel: 'Explore corporate cakes',
      buttonLink: '/corporate-cakes',
      image: IMG('photo-1733119673475-c7a31c393d42'),
      imageAlt: 'Office team celebrating with cake',
    },
  },
  {
    key: 'home.steps',
    group: 'Homepage',
    label: 'How it works (steps)',
    fields: [
      ...headFields(),
      list('steps', 'Steps', [text('title', 'Title'), textarea('text', 'Text')], 'title', 'Steps are numbered 01, 02, … automatically.'),
    ],
    defaults: {
      kicker: 'How it works',
      title: 'From cart to candles in four steps',
      steps: [
        { title: 'Pick your cake', text: 'Thirty-two signature bakes across twelve categories.' },
        { title: 'Choose weight & date', text: 'Add a message, pick a date and a two-hour slot.' },
        { title: 'Pay securely', text: 'UPI, card or net banking.' },
        { title: 'Freshly delivered', text: 'Baked that morning, boxed cold, on time.' },
      ],
    },
  },
  {
    key: 'home.reviews',
    group: 'Homepage',
    label: 'Reviews — heading',
    fields: headFields({ sub: true }),
    defaults: { kicker: 'Reviews', title: 'What people say after the party', sub: '2,417 delivered orders and counting.' },
  },
  {
    key: 'home.journal',
    group: 'Homepage',
    label: 'Blog highlights — heading',
    fields: headFields({ linkBtn: true }),
    defaults: { kicker: 'From the journal', title: 'Cake notes & kitchen stories', linkLabel: 'Read the blog', linkTo: '/blog' },
  },
  {
    key: 'home.faq',
    group: 'Homepage',
    label: 'FAQ — heading',
    fields: [
      text('kicker', 'Small heading', KICKER_HINT),
      text('title', 'Heading'),
      text('intro', 'Text before the phone number'),
      text('callPrefix', 'Words just before the phone number', 'The phone number itself comes from Settings.'),
      text('outro', 'Text after the phone number'),
      text('buttonLabel', 'Button text'),
      link('buttonLink', 'Button link', LINK_HINT),
    ],
    defaults: {
      kicker: 'Questions',
      title: 'Everything you might ask before ordering',
      intro: 'Still unsure?',
      callPrefix: 'Call us on',
      outro: '— a human answers between 9 AM and 9 PM.',
      buttonLabel: 'Contact us',
      buttonLink: '/contact',
    },
  },
  {
    key: 'home.newsletter',
    group: 'Homepage',
    label: 'Newsletter sign-up',
    fields: [text('kicker', 'Small heading', KICKER_HINT), text('title', 'Heading'), textarea('text', 'Text')],
    defaults: {
      kicker: 'Stay in the loop',
      title: 'Seasonal bakes, first',
      text: 'One email a month: new flavours, festival specials and the occasional discount code.',
    },
  },

  // ======================================================================
  // Layout (header & footer)
  // ======================================================================
  {
    key: 'layout.nav',
    group: 'Layout (header & footer)',
    label: 'Menu links (header & mobile menu)',
    fields: [
      list('headerBefore', 'Header — links before "Shop"', linkItem, 'label'),
      text('shopLabel', 'Header — "Shop" menu text'),
      text('shopAllLabel', 'Shop menu — "view all" link text'),
      list('headerAfter', 'Header — links after "Shop"', linkItem, 'label'),
      list('mobileBefore', 'Mobile menu — links before "Shop"', iconLinkItem, 'label'),
      list('mobileAfter', 'Mobile menu — links after "Shop"', iconLinkItem, 'label'),
      text('mobileButton', 'Mobile menu — bottom button text', 'This button opens the shop.'),
    ],
    defaults: {
      headerBefore: [{ label: 'Home', to: '/' }],
      shopLabel: 'Shop',
      shopAllLabel: 'View all cakes',
      headerAfter: [
        { label: 'Custom Cakes', to: '/custom' },
        { label: 'Corporate Cakes', to: '/corporate-cakes' },
        { label: 'About', to: '/about' },
        { label: 'Blog', to: '/blog' },
        { label: 'Track Order', to: '/track' },
      ],
      mobileBefore: [{ label: 'Home', to: '/', icon: 'home' }],
      mobileAfter: [
        { label: 'Custom Cakes', to: '/custom', icon: 'sparkles' },
        { label: 'Corporate Cakes', to: '/corporate-cakes', icon: 'pkg' },
        { label: 'About', to: '/about', icon: 'info' },
        { label: 'Blog', to: '/blog', icon: 'news' },
        { label: 'Account', to: '/account', icon: 'user' },
        { label: 'Wishlist', to: '/wishlist', icon: 'heart' },
        { label: 'FAQ', to: '/faq', icon: 'msg' },
        { label: 'Contact', to: '/contact', icon: 'phone' },
      ],
      mobileButton: 'Shop all cakes',
    },
  },
  {
    key: 'layout.footer',
    group: 'Layout (header & footer)',
    label: 'Footer',
    fields: [
      textarea('blurb', 'About text', 'Use {since} to insert the "since" year from Settings.'),
      text('address', 'Short address', 'Keep it to one line — the full address lives in Settings.'),
      text('shopHeading', '"Shop" column heading', 'This column lists your categories automatically.'),
      text('shopAllLabel', '"Shop" column — last link text'),
      text('companyHeading', 'Second column heading'),
      list('companyLinks', 'Second column links', linkItem, 'label'),
      text('helpHeading', 'Third column heading'),
      list('helpLinks', 'Third column links', linkItem, 'label'),
      text('copyright', 'Copyright line'),
      list('paymentMarks', 'Payment methods shown', labelItem, 'label'),
    ],
    defaults: {
      blurb: "Delhi-NCR's homemade cake specialists since {since} — design-led birthday cakes, muffins and more, baked hot-n-fresh and delivered with 100% freshness intact.",
      address: 'Bisrakh Jalalpur, Greater Noida West, UP 201306',
      shopHeading: 'Shop',
      shopAllLabel: 'All cakes',
      companyHeading: 'Company',
      companyLinks: [
        { label: 'About us', to: '/about' },
        { label: 'Blog', to: '/blog' },
        { label: 'Custom cakes', to: '/custom' },
        { label: 'Corporate cakes', to: '/corporate-cakes' },
        { label: 'Contact', to: '/contact' },
        { label: 'FAQ', to: '/faq' },
      ],
      helpHeading: 'Help',
      helpLinks: [
        { label: 'Track your order', to: '/track' },
        { label: 'My orders', to: '/orders' },
        { label: 'Privacy policy', to: '/privacy' },
        { label: 'Terms & conditions', to: '/terms' },
      ],
      copyright: '© 2026 BigBakeBatter. All rights reserved.',
      paymentMarks: [{ label: 'UPI' }, { label: 'VISA' }, { label: 'Mastercard' }, { label: 'Net Banking' }],
    },
  },

  // ======================================================================
  // Shop & product page
  // ======================================================================
  {
    key: 'shop.head',
    group: 'Shop page',
    label: 'Shop page heading',
    fields: [text('title', 'Heading'), text('sub', 'Sub-heading', 'Use {count} to insert the number of cakes.')],
    defaults: { title: 'All cakes & desserts', sub: '100% pure veg, always eggless — {count} bakes to choose from.' },
  },
  {
    key: 'product.page',
    group: 'Product page',
    label: 'Product page text',
    fields: [
      text('vegLabel', 'Pure-veg badge text'),
      text('categoryLabel', 'Details — "Category" label'),
      list('specs', 'Details — fixed rows', [text('label', 'Label'), text('value', 'Value')], 'label', 'Shown between Category and Availability for every cake.'),
      text('availabilityLabel', 'Details — "Availability" label'),
      text('descriptionTab', 'Tab 1 name', "Shows the cake's own description."),
      text('ingredientsTab', 'Tab 2 name'),
      richtext('ingredients', 'Tab 2 text', RICH_HINT),
      text('deliveryTab', 'Tab 3 name'),
      richtext('delivery', 'Tab 3 text', RICH_HINT),
      text('reviewsTab', 'Tab 4 name', "Shows your customer reviews (from Reviews) next to the cake's rating."),
      text('relatedKicker', '"More cakes" small heading', KICKER_HINT),
      text('relatedTitle', '"More cakes" heading'),
      text('notFoundTitle', 'Cake not found — heading'),
      textarea('notFoundText', 'Cake not found — text'),
      text('notFoundButton', 'Cake not found — button text'),
    ],
    defaults: {
      vegLabel: '100% Pure Veg',
      categoryLabel: 'Category',
      specs: [
        { label: 'Dietary', value: 'Eggless · Pure veg' },
        { label: 'Delivery', value: 'Same-day before 2 PM' },
      ],
      availabilityLabel: 'Availability',
      descriptionTab: 'Description',
      ingredientsTab: 'Ingredients & care',
      ingredients:
        'Made with refined flour, dairy cream, sugar and natural flavouring — completely eggless. Baked without preservatives.\n\nRefrigerate until an hour before serving. Best enjoyed within 24 hours of delivery.',
      deliveryTab: 'Delivery',
      delivery:
        "Order before 2 PM for same-day delivery in serviceable areas. Pick a slot at checkout — we'll text you when the rider is on the way.\n\nCash on delivery is not available; pay securely online via UPI, card or net banking.",
      reviewsTab: 'Reviews',
      relatedKicker: 'You may also like',
      relatedTitle: 'More from this category',
      notFoundTitle: 'Cake not found',
      notFoundText: 'That one may have sold out for good. Have a look at the rest of the menu.',
      notFoundButton: 'Back to shop',
    },
  },

  // ======================================================================
  // About page
  // ======================================================================
  {
    key: 'about.page',
    group: 'About page',
    label: 'About page',
    fields: [
      text('kicker', 'Top — small heading', KICKER_HINT),
      text('title', 'Top — heading'),
      textarea('intro', 'Top — intro', 'Use {since} to insert the "since" year from Settings.'),
      image('image', 'Story photo'),
      text('imageAlt', 'Story photo description', ALT_HINT),
      text('storyKicker', 'Story — small heading', KICKER_HINT),
      text('storyTitle', 'Story — heading'),
      richtext('storyText', 'Story — text', RICH_HINT),
      list('badges', 'Story — badges', [icon('icon', 'Icon'), text('label', 'Text')], 'label'),
      list('stats', 'Numbers row', [text('value', 'Number', 'Use {products} to insert how many cakes are on the menu.'), text('label', 'Label')], 'label'),
      text('valuesKicker', 'Promises — small heading', KICKER_HINT),
      text('valuesTitle', 'Promises — heading'),
      list('values', 'Promises', [icon('icon', 'Icon'), text('title', 'Title'), textarea('text', 'Text')], 'title'),
      text('reviewsKicker', 'Reviews — small heading', KICKER_HINT),
      text('reviewsTitle', 'Reviews — heading'),
      text('visitKicker', 'Visit us — small heading', KICKER_HINT),
      text('visitTitle', 'Visit us — heading'),
      textarea('visitText', 'Visit us — text', 'Use {address} for the full address (Settings) and {hours} for the opening hours (Settings, or the Contact page hours).'),
      text('visitButton', 'Visit us — button text'),
      link('visitButtonLink', 'Visit us — button link', LINK_HINT),
      image('visitImage', 'Visit us — photo'),
      text('visitImageAlt', 'Visit us — photo description', ALT_HINT),
    ],
    defaults: {
      kicker: 'Our story',
      title: 'A small kitchen that refuses to bake ahead',
      intro: 'BigBakeBatter started in {since} with one oven, one recipe book and a stubborn rule we still keep: nothing leaves the kitchen that was not baked that morning.',
      image: IMG('photo-1556910103-1c02745aae4d'),
      imageAlt: 'Our kitchen',
      storyKicker: 'Why we exist',
      storyTitle: 'Fresh is a schedule, not a slogan',
      storyText:
        'Most cake shops bake in bulk and hold stock for days. We bake to order, in small batches, starting at five in the morning. It makes the operation harder and the cake better — and it is the whole reason we cap how many orders we take in a day.\n\nEverything is made in-house: sponges, fillings, ganache, even the praline in the butterscotch. No mixes, no preservatives, no shortcuts we would not tell you about.',
      badges: [
        { icon: 'cake', label: 'Baked in-house' },
        { icon: 'leaf', label: 'No preservatives' },
        { icon: 'truck', label: 'Delivered chilled' },
      ],
      stats: [
        { value: '{products}+', label: 'Signature cakes' },
        { value: '2,417', label: 'Orders delivered' },
        { value: '4.9', label: 'Average rating' },
        { value: '5 AM', label: 'Ovens on' },
      ],
      valuesKicker: 'What we promise',
      valuesTitle: 'Three things we will not compromise on',
      values: [
        { icon: 'leaf', title: 'Fresh ingredients', text: 'Real cream, real butter, real fruit. If an ingredient is out of season, the cake comes off the menu until it is back.' },
        { icon: 'sun', title: 'Same-day baking', text: "Every order is assembled from that morning's bake. Nothing is frozen and nothing is held over to the next day." },
        { icon: 'check', title: 'Customer promise', text: 'If a cake arrives damaged or late, we re-bake it or refund it. No forms, no argument — just tell us.' },
      ],
      reviewsKicker: 'In their words',
      reviewsTitle: 'What customers say',
      visitKicker: 'Visit us',
      visitTitle: 'Come by the bakehouse',
      visitText: '{address}. Open {hours}.',
      visitButton: 'Contact us',
      visitButtonLink: '/contact',
      visitImage: IMG('photo-1517686469429-8bdb88b9f907'),
      visitImageAlt: 'Bakehouse',
    },
  },

  // ======================================================================
  // Corporate cakes page
  // ======================================================================
  {
    key: 'corporate.page',
    group: 'Corporate cakes page',
    label: 'Corporate cakes page',
    fields: [
      list('heroImages', 'Slideshow photos', [image('image', 'Photo'), text('alt', 'Photo description', ALT_HINT)], 'alt'),
      text('kicker', 'Slideshow — small heading', KICKER_HINT),
      text('title', 'Slideshow — heading'),
      textarea('text', 'Slideshow — text'),
      list('perks', 'Slideshow — highlights', [icon('icon', 'Icon'), text('text', 'Text')], 'text'),
      text('formTitle', 'Form — heading'),
      text('formText', 'Form — intro'),
      list('budgets', 'Form — budget options', labelItem, 'label'),
      text('submitLabel', 'Form — button text'),
      text('formNote', 'Form — small print under the button'),
      text('thanksTitle', 'After sending — heading', "Use {name} to insert the customer's first name."),
      textarea('thanksText', 'After sending — text'),
      list('features', 'Feature cards', [icon('icon', 'Icon'), text('title', 'Title'), textarea('text', 'Text')], 'title'),
      text('productsKicker', 'Cakes for offices — small heading', KICKER_HINT),
      text('productsTitle', 'Cakes for offices — heading'),
      textarea('productsText', 'Cakes for offices — text', 'This row shows the cakes marked as corporate in Products.'),
    ],
    defaults: {
      heroImages: [
        { image: IMG('photo-1733119673501-20e57711ef84'), alt: 'Office team celebrating with cake' },
        { image: IMG('photo-1733119673475-c7a31c393d42'), alt: 'Colleagues gathered around a birthday cake' },
        { image: IMG('photo-1758520144658-c87be518b87e'), alt: 'Office workers celebrating with cake and gifts' },
      ],
      kicker: 'For teams & businesses',
      title: 'Corporate cakes & bulk gifting, done properly',
      text: 'Office birthdays, festive hampers, launches and client thank-yous — ordered in bulk, branded, and delivered across Delhi-NCR on your schedule.',
      perks: [
        { icon: 'pkg', text: 'Bulk & recurring orders' },
        { icon: 'gem', text: 'Branded & custom toppers' },
        { icon: 'user', text: 'A dedicated account manager' },
        { icon: 'news', text: 'GST invoicing on every order' },
      ],
      formTitle: 'Get a bulk quote',
      formText: 'Share a rough brief — we’ll come back with pricing within one business day.',
      budgets: [{ label: 'Under ₹10,000' }, { label: '₹10,000 – ₹25,000' }, { label: '₹25,000 – ₹50,000' }, { label: '₹50,000+' }],
      submitLabel: 'Send enquiry',
      formNote: 'No obligation — we reply with a quote, you decide after.',
      thanksTitle: 'Thanks, {name}!',
      thanksText: 'Your corporate enquiry has been sent. Our team will reach out with options and a quote within one business day.',
      features: [
        { icon: 'pkg', title: 'Bulk & recurring orders', text: 'From a dozen desk-side cupcakes to a 200-box festive hamper drop — scaled without compromising on freshness.' },
        { icon: 'gem', title: 'Branded & custom toppers', text: 'Company logo toppers, branded packaging and personalised messaging for launches, milestones and client gifting.' },
        { icon: 'user', title: 'A dedicated account manager', text: 'One point of contact for every order, quote and delivery — no re-explaining your requirement each time.' },
        { icon: 'news', title: 'GST invoicing', text: 'Proper GST-compliant invoices for every order, so your finance team never has to chase paperwork.' },
      ],
      productsKicker: 'Popular for offices',
      productsTitle: 'Built for sharing',
      productsText: 'Boxes, jars and towers that travel well and split cleanly for a desk or a boardroom.',
    },
  },

  // ======================================================================
  // Custom cake page
  // ======================================================================
  {
    key: 'custom.page',
    group: 'Custom cake page',
    label: 'Custom cake enquiry',
    fields: [
      text('title', 'Heading'),
      text('intro', 'Intro'),
      list(
        'steps', 'Steps',
        [text('label', 'Step name'), text('question', 'Question shown on this step')],
        'label',
        'There are always 7 steps in this order: Occasion, Date, Guests, Budget, Requirements, Inspiration, Review. Only the wording can change; the Review step has no question.'
      ),
      list('occasions', 'Occasion options', labelItem, 'label'),
      list('guestRanges', 'Guest count options', labelItem, 'label'),
      list('budgets', 'Budget options', labelItem, 'label'),
      text('briefPlaceholder', 'Requirements box — example text'),
      text('uploadText', 'Inspiration — upload box text'),
      text('thanksTitle', 'After sending — heading', "Use {name} to insert the customer's first name."),
      textarea('thanksText', 'After sending — text'),
    ],
    defaults: {
      title: 'Create your custom cake',
      intro: 'Tell us your idea — our bakers design and quote it within 24 hours.',
      steps: [
        { label: 'Occasion', question: "What's the occasion?" },
        { label: 'Date', question: 'When do you need it delivered?' },
        { label: 'Guests', question: 'How many guests?' },
        { label: 'Budget', question: "What's your budget?" },
        { label: 'Requirements', question: 'Describe what you have in mind' },
        { label: 'Inspiration', question: 'Inspiration photos (optional)' },
        { label: 'Review', question: '' },
      ],
      occasions: [
        { label: 'Birthday' }, { label: 'Anniversary' }, { label: 'Wedding' },
        { label: 'Baby Shower' }, { label: 'Corporate' }, { label: 'Other' },
      ],
      guestRanges: [{ label: 'Under 10' }, { label: '10–20' }, { label: '20–40' }, { label: '40–60' }, { label: '60+' }],
      budgets: [
        { label: 'Under ₹1,500' }, { label: '₹1,500 – ₹3,000' }, { label: '₹3,000 – ₹5,000' },
        { label: '₹5,000 – ₹8,000' }, { label: '₹8,000+' },
      ],
      briefPlaceholder: 'Flavour, size, theme, colours, message on the cake...',
      uploadText: 'Click to upload reference photos',
      thanksTitle: 'Thanks, {name}!',
      thanksText: 'Your custom cake enquiry has been sent. Our bakers will get back to you with a design and a quote within 24 hours.',
    },
  },

  // ======================================================================
  // Contact page
  // ======================================================================
  {
    key: 'contact.page',
    group: 'Contact page',
    label: 'Contact page',
    fields: [
      text('title', 'Heading'),
      text('intro', 'Intro'),
      text('formTitle', 'Form — heading'),
      text('formSubtitle', 'Form — small text'),
      text('sentText', 'After sending — text'),
      text('infoTitle', 'Details box — heading', 'Address, phone and email come from Settings.'),
      text('hours', 'Opening hours', 'Used on the Contact and About pages when Settings → Opening hours is empty.'),
      text('directionsLabel', 'Directions button text'),
      textarea('deliveryNote', 'Delivery areas note (under the map)'),
    ],
    defaults: {
      title: 'Get in touch',
      intro: "Questions about an order, a custom cake, or anything else — we're here.",
      formTitle: 'Send us a message',
      formSubtitle: 'We usually reply within a few hours.',
      sentText: "We've received your message and will reply soon.",
      infoTitle: 'Our bakehouse',
      hours: '9 AM – 9 PM, all days',
      directionsLabel: 'Get directions',
      deliveryNote: 'We deliver same-day across Greater Noida West, Noida, Delhi and Ghaziabad — order before 2 PM.',
    },
  },

  // ======================================================================
  // Login page
  // ======================================================================
  {
    key: 'login.page',
    group: 'Login page',
    label: 'Sign in / sign up page',
    fields: [
      image('image', 'Side photo'),
      text('imageAlt', 'Side photo description', ALT_HINT),
      text('title', 'Side heading'),
      list('perks', 'Side — benefits', [text('text', 'Text')], 'text'),
      text('signinTitle', 'Sign in — heading'),
      text('signinText', 'Sign in — text'),
      text('signupTitle', 'Create account — heading'),
      text('signupText', 'Create account — text'),
    ],
    defaults: {
      image: IMG('photo-1578985545062-69928b1d9587'),
      imageAlt: 'Fresh cakes',
      title: 'Fresh cakes, delivered right',
      perks: [
        { text: 'Track orders in real time' },
        { text: 'Save addresses for faster checkout' },
        { text: 'Reorder favourites in one tap' },
      ],
      signinTitle: 'Welcome back',
      signinText: 'Sign in to track orders and checkout faster.',
      signupTitle: 'Create your account',
      signupText: 'Join to save addresses and track your orders.',
    },
  },

  // ======================================================================
  // FAQ page
  // ======================================================================
  {
    key: 'faq.page',
    group: 'FAQ page',
    label: 'FAQ page text',
    fields: [
      text('title', 'Heading'),
      text('intro', 'Intro', 'The questions themselves are edited under FAQs.'),
      text('ctaTitle', 'Bottom box — heading'),
      text('ctaText', 'Bottom box — text'),
      text('ctaButton', 'Bottom box — button text'),
      link('ctaLink', 'Bottom box — button link', LINK_HINT),
    ],
    defaults: {
      title: 'Frequently asked questions',
      intro: 'Everything about ordering, delivery and our eggless kitchen.',
      ctaTitle: 'Still stuck?',
      ctaText: 'Our team replies within a day, usually much sooner.',
      ctaButton: 'Contact us',
      ctaLink: '/contact',
    },
  },

  // ======================================================================
  // Blog
  // ======================================================================
  {
    key: 'blog.page',
    group: 'Blog',
    label: 'Blog list page',
    fields: [
      text('kicker', 'Small heading', KICKER_HINT),
      text('title', 'Heading'),
      text('intro', 'Intro'),
      text('allLabel', '"All posts" filter text'),
      text('readLabel', 'Top article — button text'),
      text('emptyText', 'Text when a category has no posts'),
      text('loadMoreLabel', '"Load more" button text'),
    ],
    defaults: {
      kicker: 'Our journal',
      title: 'Cake notes & kitchen stories',
      intro: 'Baking guides, behind-the-scenes and everything cake care.',
      allLabel: 'All posts',
      readLabel: 'Read article',
      emptyText: 'No posts in this category yet.',
      loadMoreLabel: 'Load More Blogs',
    },
  },
  {
    key: 'blog.article',
    group: 'Blog',
    label: 'Article page',
    fields: [
      text('author', 'Author name'),
      text('authorInitials', 'Author initials (avatar)'),
      textarea('closing', 'Closing paragraph (after every article)', 'Write [link text](/page) to add a link, e.g. [contact page](/contact).'),
      text('shareLabel', '"Share" text'),
      text('commentsEmpty', 'Text when there are no comments'),
      text('relatedKicker', 'Related posts — small heading', KICKER_HINT),
      text('relatedTitle', 'Related posts — heading'),
      text('relatedLinkLabel', 'Related posts — button text'),
      text('notFoundTitle', 'Article not found — heading'),
      text('notFoundButton', 'Article not found — button text'),
    ],
    defaults: {
      author: 'BigBakeBatter Kitchen',
      authorInitials: 'BB',
      closing:
        'If you have questions about a specific cake or occasion, our team is always happy to help — reach out through the [contact page](/contact) or start a [custom cake enquiry](/custom).',
      shareLabel: 'Share this article',
      commentsEmpty: 'Be the first to share your thoughts on this article.',
      relatedKicker: 'The journal',
      relatedTitle: 'Keep reading',
      relatedLinkLabel: 'All articles',
      notFoundTitle: 'Article not found',
      notFoundButton: 'Back to blog',
    },
  },

  // ======================================================================
  // Track order page
  // ======================================================================
  {
    key: 'track.page',
    group: 'Track order page',
    label: 'Track order page',
    fields: [
      text('title', 'Heading'),
      text('intro', 'Intro'),
      text('placeholder', 'Search box — example text'),
      text('buttonLabel', 'Search button text'),
      text('notFoundTitle', 'Order not found — heading'),
      text('notFoundText', 'Order not found — text'),
      list(
        'steps', 'Status steps',
        [text('label', 'Title'), text('text', 'Text')],
        'label',
        'Always 4 steps, matching the order statuses in this order: New, Baking, Out for delivery, Delivered.'
      ),
      text('cancelledLabel', 'Cancelled order — text'),
      text('detailsTitle', 'Delivery details box — heading'),
    ],
    defaults: {
      title: 'Track your order',
      intro: 'Enter your order ID to see live status.',
      placeholder: 'e.g. #BB1048',
      buttonLabel: 'Track',
      notFoundTitle: 'Order not found',
      notFoundText: 'Double check the order ID and try again.',
      steps: [
        { label: 'Order placed', text: 'We have received your order and it is queued for baking.' },
        { label: 'In the kitchen', text: 'Your cake is being freshly baked and decorated.' },
        { label: 'Out for delivery', text: 'Your rider has picked up the order and is on the way.' },
        { label: 'Delivered', text: 'Delivered — enjoy!' },
      ],
      cancelledLabel: 'Order cancelled',
      detailsTitle: 'Delivery details',
    },
  },

  // ======================================================================
  // Legal pages
  // ======================================================================
  {
    key: 'legal.privacy',
    group: 'Legal pages',
    label: 'Privacy policy',
    fields: [text('title', 'Heading'), text('updated', '"Last updated" line'), richtext('body', 'Policy text', RICH_HINT)],
    defaults: {
      title: 'Privacy policy',
      updated: 'Last updated: 1 August 2026',
      body: [
        '## What we collect',
        "When you place an order or create an account, we collect your name, email, phone number and delivery address — only what's needed to bake, pack and deliver your order.",
        '## How we use it',
        '- To process and deliver your orders\n- To send order updates via email or SMS\n- To respond to enquiries and custom cake requests\n- To improve our menu and service, in aggregate and anonymised form',
        '## Payment information',
        'All payments are processed by our secure payment gateway partner. We never store your card, UPI or net-banking credentials on our servers.',
        '## Sharing your information',
        'We share delivery details with our riders solely to complete your delivery. We do not sell your personal information to third parties.',
        '## Your choices',
        'You can update or delete your account information at any time from your account page, or by writing to hello@bigbakebatter.com.',
      ].join('\n\n'),
    },
  },
  {
    key: 'legal.terms',
    group: 'Legal pages',
    label: 'Terms & conditions',
    fields: [text('title', 'Heading'), text('updated', '"Last updated" line'), richtext('body', 'Terms text', RICH_HINT)],
    defaults: {
      title: 'Terms & conditions',
      updated: 'Last updated: 1 August 2026',
      body: [
        '## Orders',
        'Orders are confirmed once payment is received. Orders placed before 2 PM qualify for same-day delivery within our serviceable areas; orders after the cut-off are scheduled for the next available slot.',
        '## Payments',
        'We accept UPI, credit and debit cards, and net banking through our secure payment partner. Cash on delivery is not available on any order.',
        '## Cancellations & refunds',
        '- Orders can be cancelled free of charge up to 4 hours before the scheduled delivery slot.\n- Custom cake enquiries can be withdrawn any time before the advance payment is made.\n- Approved refunds are processed to the original payment method within 5–7 business days.',
        '## Product information',
        'Every item on our menu is 100% eggless and vegetarian. Photos are for illustration — actual designs may vary slightly, especially for custom orders.',
        '## Liability',
        'We take care to package every order for safe transit but cannot be held responsible for damage caused after delivery is accepted.',
      ].join('\n\n'),
    },
  },

  // ======================================================================
  // Other pages
  // ======================================================================
  {
    key: 'notFound.page',
    group: 'Other pages',
    label: 'Page not found (404)',
    fields: [
      text('title', 'Heading'),
      textarea('text', 'Text'),
      text('homeLabel', 'Home button text'),
      text('shopLabel', 'Shop button text'),
    ],
    defaults: {
      title: 'Page not found',
      text: "Sorry, we couldn't find that page. It may have moved, or the link may be mistyped — but there are plenty of fresh cakes waiting.",
      homeLabel: 'Back to home',
      shopLabel: 'Browse cakes',
    },
  },
];

export const SECTION_MAP = new Map(SECTIONS.map((s) => [s.key, s]));
