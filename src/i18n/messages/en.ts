/**
 * English - the source dictionary.
 *
 * Its shape IS the `Messages` type: every other language is checked against it
 * at compile time, so a missing or misspelled key in a translation fails the
 * build instead of rendering blank text.
 *
 * Messages are plain strings. `{name}` is a placeholder filled by `fmt()`;
 * `{ one, other }` pairs are plural forms picked by `plural()`.
 */
export const en = {
  common: {
    loading: "Loading",
    close: "Close",
    cancel: "Cancel",
    save: "Save",
    remove: "Remove",
    tryAgain: "Try again",
    back: "Back",
    previous: "Previous",
    next: "Next",
    page: "Page {page}",
    required: "Required",
    optional: "optional",
    search: "Search",
    viewAll: "View all",
    goHome: "Go to the home page",
    browseShop: "Browse the shop",
    skipToContent: "Skip to content",
    calculatedAtCheckout: "Calculated at checkout",
    unreachable: "We could not reach the store right now. Please try again.",
    somethingWentWrong: "Something went wrong. Please try again.",
  },

  ui: {
    close: "Close",
    quantity: "Quantity",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    pagination: "Pagination",
    previous: "Previous",
    next: "Next",
    pageN: "Page {page}",
    showing: "Showing {from}–{to} of {total}",
    rated: {
      one: "Rated {average} out of 5 from {count} review",
      other: "Rated {average} out of 5 from {count} reviews",
    },
    starBucket: "{bucket} stars: {count} of {total} reviews",
    errorUnreachableTitle: "We could not reach the store",
    errorUnreachableBody:
      "The store is not responding right now. Nothing has been lost - please try again in a moment.",
    errorGenericTitle: "Something went wrong",
    errorGenericBody:
      "Please try again. If it keeps happening, contact us and we will look into it.",
    reference: "Reference: {reference}",
  },

  language: {
    label: "Language",
    choose: "Choose a language",
    current: "Current language",
  },

  header: {
    searchProducts: "Search products",
    searchPlaceholder: "Search products",
    signIn: "Sign in",
    account: "Account",
    orders: "Orders",
    admin: "Admin",
    signOut: "Sign out",
    signingOut: "Signing out…",
    openMenu: "Open menu",
    more: "More",
    moreLinks: "More navigation links",
    shop: "Shop",
    browseAll: "Browse all products",
    viewAllIn: "View all {name}",
    allIn: "All {name}",
    categories: "Categories",
    all: "All",
    cartEmpty: "Cart, empty",
    cartItems: { one: "Cart, {count} item", other: "Cart, {count} items" },
    homeLabel: "{store} home",
    main: "Main",
    pricesIn: "Prices in {currency}",
  },

  nav: {
    primary: "Primary",
    home: "Home",
    shop: "Shop",
    search: "Search",
    cart: "Cart",
    account: "Account",
    items: { one: "{count} item", other: "{count} items" },
  },

  footer: {
    categories: "Categories",
    pages: "Pages",
    allPages: "All pages",
    contact: "Contact",
    shipping: "Shipping",
    returns: "Returns",
    pricesIn: "Prices in {currency}",
    testMode: "test mode",
    card: "Card",
    paypal: "PayPal",
    socialOn: "{store} on {network}",
    payments: "Accepted payment methods",
    rights: "All rights reserved.",
  },

  breadcrumb: {
    label: "Breadcrumb",
    home: "Home",
    shop: "Shop",
  },

  home: {
    notSetUpTitle: "The homepage has not been set up yet",
    notSetUpBody: "Once the store adds homepage content it will appear here.",
    productCount: { one: "{count} product", other: "{count} products" },
    heroSlides: "Featured images",
    heroPrevious: "Previous image",
    heroNext: "Next image",
    heroGoTo: "Show image {index} of {total}",
  },

  listing: {
    shopTitle: "Shop",
    searchTitle: "Search",
    searchMeta: "Search: {term}",
    resultsFor: "Results for",
    categoryFallbackTitle: "Category",
    subcategories: "Subcategories",
    count: { one: "{count} product", other: "{count} products" },
    reload: "Reload",
    clearFilters: "Clear filters",
    emptyTitle: "No products match these filters",
    emptyBody: "Try removing a filter or widening the price range.",
    searchEmptyTitle: "Nothing found for \u201c{term}\u201d",
    searchEmptyBody:
      "Check the spelling, or try a shorter or more general term.",
    searchPromptTitle: "Enter a search term",
    searchPromptBody: "Search by product name, SKU or description.",
    categoryEmptyTitle: "No products in this category yet",
    categoryEmptyBody:
      "Once products are published here they will appear in this list.",
  },

  filters: {
    title: "Filters",
    form: "Product filters",
    search: "Search",
    searchPlaceholder: "Product name or SKU",
    category: "Category",
    allCategories: "All categories",
    price: "Price",
    minPrice: "Minimum price",
    maxPrice: "Maximum price",
    min: "Min",
    max: "Max",
    inStock: "In stock only",
    sortBy: "Sort by",
    sortDefault: "Default",
    sort: {
      relevance: "Relevance",
      newest: "Newest",
      price_asc: "Price: low to high",
      price_desc: "Price: high to low",
      name_asc: "Name: A to Z",
      name_desc: "Name: Z to A",
    },
    apply: "Apply filters",
    clear: "Clear",
  },

  productCard: {
    noImage: "No image available",
    soldOut: "Sold out",
  },

  availability: {
    in_stock: "In stock",
    low_stock: "Low stock",
    out_of_stock: "Out of stock",
    preorder: "Available to pre-order",
    unavailable: "Unavailable",
    left: "{count} left",
  },

  price: {
    reduced: "reduced from {from} to {to}",
  },

  product: {
    metaFallbackTitle: "Product",
    sku: "SKU {sku}",
    quantityFor: "Quantity for {name}",
    addToCart: "Add to cart",
    added: "Added",
    addedToCart: "Added to cart",
    addedNotice: "Added to your cart.",
    viewCart: "View cart",
    combinationUnavailable:
      "That combination is not available. Choose a different option.",
    combinationAlert:
      "That combination is not available. Pick a different option to continue.",
    chooseOption: "Choose an option to continue.",
    notAvailable: "This item is not available to buy.",
    outOfStock: "This item is currently out of stock.",
    returnsDays: "{days}-day returns",
    freeShippingOver: "Free shipping over {amount}",
    valueNotAvailable: "{value} - not available",
    video: "{name} video",
    viewLarger: "View larger image",
    media: "Product media",
    showImage: "Show image {n}",
    showVideo: "Show video {n}",
    sections: {
      valueProps: "Why you might like it",
      inUse: "In use",
      included: "What's in the box",
      details: "Product details",
      specifications: "Specifications",
      shipping: "Shipping & delivery",
      freeShippingOn: "Free shipping on orders over {amount}.",
      returns: "Returns & warranty",
      returnsWindow: "{days}-day returns window.",
      questions: "Questions",
      related: "You might also like",
    },
    reviews: {
      title: "Reviews",
      outOf5: "out of 5",
      count: { one: "{count} review", other: "{count} reviews" },
      verified: "Verified purchase",
      storeReply: "Store reply",
      showing: "Showing {shown} of {total} reviews.",
    },
  },

  cart: {
    metaTitle: "Cart",
    title: "Your cart",
    emptyTitle: "Your cart is empty",
    emptyBody: "Items you add will be saved here while you browse.",
    checkFailedTitle: "We could not check your cart",
    sku: "SKU {sku}",
    quantityFor: "Quantity for {name}",
    remove: "Remove",
    each: "{price} each",
    continueShopping: "Continue shopping",
    clear: "Clear cart",
    summary: "Order summary",
    subtotal: "Subtotal",
    discount: "Discount",
    shipping: "Shipping",
    tax: "Tax",
    total: "Total",
    totalsUnavailable: "Totals are unavailable right now.",
    checkingPrices: "Checking prices…",
    notCalculatedHint:
      "Shipping and tax show as \u201c{label}\u201d until a delivery address and method are chosen.",
    checkout: "Checkout",
    signInRequired: "You will need to sign in to complete your order.",
    notices: {
      removed: "Some items were removed",
      adjusted: "Some quantities changed",
      quantityReduced: "Quantity reduced from {from} to {to}.",
      check: "Please check these items",
    },
  },

  address: {
    firstName: "First name",
    lastName: "Last name",
    company: "Company",
    line1: "Address",
    line2: "Apartment, suite, etc.",
    city: "City",
    region: "State or region",
    postalCode: "Postal code",
    country: "Country",
    selectCountry: "Select a country",
    phone: "Phone",
    optional: "Optional",
    phoneHint: "Optional. Used only if there is a delivery problem.",
    errors: {
      firstName: "Enter a first name.",
      lastName: "Enter a last name.",
      line1: "Enter a street address.",
      city: "Enter a city.",
      postalCode: "Enter a postal code.",
      country: "Select a country.",
    },
  },

  checkout: {
    metaTitle: "Checkout",
    emptyTitle: "Your cart is empty",
    emptyBody: "Add something to your cart before checking out.",
    signInTitle: "Sign in to check out",
    signInBody: "This store requires an account to place an order.",
    signIn: "Sign in",
    emailRequired: "Enter your email address.",
    emailInvalid: "Enter a valid email address.",
    steps: {
      contact: "Contact",
      contactBody: "We use this to send your order confirmation.",
      address: "Delivery address",
      method: "Delivery method",
      methodBody: "Rates come from the store's configured shipping zones.",
      payment: "Payment",
    },
    orderN: "Order {number}",
    email: "Email address",
    phone: "Phone",
    phoneOptional: "Optional.",
    guestPrefix: "Checking out as a guest.",
    guestSignIn: "Sign in",
    guestSuffix: "to use a saved address.",
    billingSame: "Billing address is the same as the delivery address.",
    checkCountry: "Check delivery options for this country",
    noProvider: "No payment provider is enabled for this store.",
    paymentMethod: "Payment method",
    cardLabel: "Card",
    paypalLabel: "PayPal",
    stripeTest: "Test mode - no real charge",
    paypalSandbox: "Sandbox mode - no real charge",
    note: "Order note",
    noteHint: "Optional. Anything we should know about this order.",
    marketing: "Email me occasional store updates",
    placeFailed: "We could not place your order",
    paymentStartFailed: "Payment could not be started",
    providerGone:
      "That payment method is no longer available. Reload the page to see the current options.",
    preparing: "Preparing the payment form…",
    reservedNotice:
      "Your order is reserved but not complete until the payment is confirmed by the payment provider. We never mark an order paid from this page.",
    cartChangedTitle: "Your cart changed before payment",
    cartChangedBody:
      "The summary now shows the current prices and availability. Review it, then confirm to continue. Nothing has been charged.",
    reviewed: "I have reviewed the changes",
    notConfiguredTitle: "Online payment is not configured",
    notConfiguredBody:
      "This store has no payment provider enabled, so an order cannot be completed right now. Nothing you enter below would be charged. Please contact the store to place your order.",
    placing: "Placing your order…",
    continue: "Continue to payment",
    blocked: "Choose a country we can deliver to in order to continue.",
    confirmChanges: "Confirm the cart changes above before continuing.",
    nextStepNotice:
      "You will enter payment details on the next step. Nothing is charged until then.",
    summary: {
      label: "Order summary",
      show: "Show order summary",
      hide: "Hide order summary",
      shippingWith: "Shipping ({method})",
      discountWith: "Discount ({code})",
      totalWithShipping: "Total (items + shipping)",
      taxHint:
        "Tax shows as \u201c{label}\u201d because no tax calculation is configured for this store. The amount you are charged is the total confirmed on the next step.",
      checking: "Checking prices and availability…",
    },
    shipping: {
      chooseCountry:
        "Choose a delivery country above to see the available delivery options.",
      checking: "Checking delivery options…",
      loadFailed: "We could not load delivery options",
      blockedTitle: "We cannot deliver to this country yet",
      blockedBody:
        "No delivery rate is configured for this destination, so this order cannot be completed. Choose a different delivery country, or contact us to ask about delivery there.",
      label: "Delivery method",
      days: { one: "{count} business day", other: "{count} business days" },
      range: "{min}-{max} business days",
    },
    stripe: {
      testTitle: "Test mode",
      testBody:
        "This store is in Stripe test mode. Real cards are not charged.",
      failedTitle: "Payment not completed",
      failed: "The payment could not be completed. Nothing was charged.",
      processing: "Processing payment…",
      pay: "Pay {amount}",
      secure:
        "Your card details are entered directly into Stripe and never reach this store\u2019s servers.",
    },
    paypal: {
      sandboxTitle: "Sandbox mode",
      sandboxBody: "This store is in PayPal sandbox mode. No real money moves.",
      failedTitle: "Payment not completed",
      problem:
        "PayPal reported a problem with this payment. Nothing has been charged - you can try again.",
    },
  },

  paymentStatus: {
    paid: {
      title: "Payment confirmed",
      description:
        "Your payment has been confirmed and your order is being prepared.",
    },
    authorized: {
      title: "Payment authorized",
      description:
        "Your payment is authorized and will be captured when the order is prepared. Nothing further is needed from you.",
    },
    partially_refunded: {
      title: "Partially refunded",
      description:
        "Part of this order has been refunded. The amounts below are from our records.",
    },
    refunded: {
      title: "Refunded",
      description: "This order has been refunded in full.",
    },
    failed: {
      title: "Payment failed",
      description:
        "The payment did not go through, so the order has not been placed. You can try paying again - nothing has been charged.",
    },
    cancelled: {
      title: "Payment cancelled",
      description:
        "The payment was cancelled, so the order has not been placed.",
    },
    unpaid: {
      title: "Payment not confirmed yet",
      description:
        "We have not received confirmation from the payment provider. This can take a moment - refresh to check again. Your order is not complete until it is confirmed.",
    },
  },

  status: {
    orderLabel: "Order status:",
    paymentLabel: "Payment status:",
    moderationLabel: "Moderation status:",
    order: {
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
    },
    payment: {
      unpaid: "Unpaid",
      authorized: "Authorized",
      paid: "Paid",
      partially_refunded: "Partially refunded",
      refunded: "Refunded",
      failed: "Failed",
      cancelled: "Cancelled",
    },
    review: {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
    },
  },

  orders: {
    noItems: "This order has no line items on record.",
    sku: "SKU {sku}",
    subtotal: "Subtotal",
    discount: "Discount",
    discountWith: "Discount ({code})",
    shipping: "Shipping",
    tax: "Tax",
    total: "Total",
    carrier: "Carrier:",
    trackingNumber: "Tracking number:",
    track: "Track this shipment",
    orderN: "Order",
    placed: "Placed {date}",
    items: "Items",
    itemsOnOrder: "Items on this order",
    totals: "Totals",
    delivery: "Delivery",
  },

  returnPages: {
    successMetaTitle: "Order status",
    cancelMetaTitle: "Payment cancelled",
    noOrderTitle: "We do not know which order to show",
    noOrderBody:
      "This link is missing the order number, so we cannot look up its status.",
    seeOrders: "See your orders",
    backToStore: "Back to the store",
    notConfirmedTitle: "We could not confirm this order",
    notFoundBody:
      "We could not find that order with the details in this link. If you have an account, your orders are listed there.",
    checkAgain: "Check again",
    signInToSee: "Sign in to see your orders",
    cartUntouched:
      "We have not changed your cart, because we could not verify this order\u2019s payment status.",
    refresh: "Refresh status",
    retry: "Review cart and try again",
    viewInAccount: "View in your account",
    continueShopping: "Continue shopping",
    whyTitle: "Why does this say not confirmed?",
    whyBody:
      "Payment confirmations arrive from the payment provider, not from your browser, so we only show an order as paid once that confirmation has reached us. If you completed a payment, refresh in a moment. Do not pay twice - check your order status first.",
    keepLinkPrefix: "Keep this page\u2019s link to check your order again, or",
    createAccount: "create an account",
    keepLinkSuffix: "with this email address to see it in your order history.",
    wentThroughTitle: "This payment actually went through",
    wentThroughBody:
      "You arrived on the cancelled-payment page, but our records show this order\u2019s payment as {status}. Nothing further is needed.",
    seeStatus: "See order status",
    notCompletedTitle: "Payment not completed",
    notPaidWithOrder:
      "This order has not been paid, so it has not been placed. Your cart is still here and nothing has been charged.",
    notPaidNoOrder:
      "The payment was not completed, so no order has been placed. Your cart is still here and nothing has been charged.",
    tryAgain: "Try payment again",
    reviewCart: "Review your cart",
    checkStatus: "Check this order\u2019s status",
    currencyNote:
      "Store currency: {currency}. If you believe you were charged, check the order status above before paying again.",
  },

  auth: {
    email: "Email address",
    password: "Password",
    name: "Name",
    emailRequired: "Enter your email address.",
    emailInvalid: "Enter a valid email address.",
    passwordRequired: "Enter your password.",
    nameRequired: "Enter your name.",
    passwordMin: "Use at least 8 characters.",
    passwordLetter: "Include at least one letter.",
    passwordNumber: "Include at least one number.",
    passwordHint: "At least 8 characters, including a letter and a number.",
    confirmRequired: "Confirm your password.",
    confirmNewRequired: "Confirm your new password.",
    mismatch: "The passwords do not match.",
    marketing: "Email me occasional store updates",
    login: {
      metaTitle: "Sign in",
      title: "Sign in",
      description: "Access your orders, addresses and account details.",
      failed: "We could not sign you in",
      submitting: "Signing in…",
      submit: "Sign in",
      forgot: "Forgot your password?",
      newHere: "New here?",
      create: "Create an account",
    },
    register: {
      metaTitle: "Create an account",
      title: "Create an account",
      description:
        "Keep track of your orders and save addresses for next time.",
      failed: "We could not create your account",
      confirm: "Confirm password",
      submitting: "Creating account…",
      submit: "Create account",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
    },
    forgot: {
      metaTitle: "Reset your password",
      title: "Reset your password",
      description:
        "Enter the email address on your account and we will send a reset link.",
      failed: "We could not send the request",
      submitting: "Sending…",
      submit: "Send reset link",
      doneTitle: "Check your email",
      doneBody:
        "If an account exists for that address, we have sent a link to reset the password. The link expires after a short time, so use it soon.",
      doneNote:
        "For your security we do not confirm whether an account exists.",
      remembered: "Remembered it?",
      back: "Back to sign in",
    },
    reset: {
      metaTitle: "Set a new password",
      title: "Set a new password",
      incompleteTitle: "This reset link is not complete",
      incompleteBody:
        "The link is missing the information needed to reset a password. Request a new one and open the most recent email.",
      requestNew: "Request a new link",
      back: "Back to sign in",
      failed: "We could not reset your password",
      forEmail: "Resetting the password for {email}.",
      newPassword: "New password",
      confirm: "Confirm new password",
      submitting: "Updating…",
      submit: "Set new password",
      doneTitle: "Password updated",
      doneBody: "You can now sign in with your new password.",
      goSignIn: "Go to sign in",
    },
  },

  search: {
    title: "Search",
    description: "Find products by name, description or SKU.",
    placeholder: "What are you looking for?",
    submit: "Search",
  },

  cartDrawer: {
    title: "Your cart",
    emptyTitle: "Your cart is empty",
    emptyBody: "Items you add will appear here.",
    subtotal: "Subtotal",
    discount: "Discount",
    shipping: "Shipping",
    viewCart: "View cart",
    quantityFor: "Quantity for {name}",
    removeItem: "Remove {name}",
    checkFailed: "We could not check your cart right now.",
    unexpected: "The store returned an unexpected response.",
    unreachable: "We could not reach the store to check your cart.",
  },

  contact: {
    metaTitle: "Contact us",
    metaDescription: "Send a message to {store}.",
    title: "Contact us",
    intro:
      "Send us a message and we will reply by email. You will get a confirmation with a reference as soon as it reaches us.",
    otherWays: "Other ways to reach us",
    shipping: "Shipping",
    returns: "Returns",
    name: "Your name",
    email: "Email address",
    emailHint: "We reply to this address.",
    subject: "Subject",
    message: "Message",
    send: "Send message",
    sending: "Sending…",
    errors: {
      name: "Enter your name.",
      email: "Enter a valid email address.",
      message: "Please describe your question in at least 10 characters.",
      unreachable:
        "We could not reach the store. Please check your connection and try again.",
      rateLimited:
        "That is a lot of messages in a short time. Please try again in a minute.",
      notSent: "Your message was not sent. Please try again.",
    },
    notSentTitle: "Your message was not sent",
    sentTitle: "Your message has been sent",
    sentBody:
      "We have your message and a copy is on its way to your inbox. Your reference is {reference} - quote it if you write to us again.",
  },

  notFound: {
    title: "We could not find that page",
    description:
      "The link may be out of date, or the item may no longer be available.",
  },

  error: {
    title: "Something went wrong",
    description:
      "This page could not be loaded. You can try again, or go back to the home page.",
  },

  degraded: {
    title: "Store settings are unavailable",
    body: "We could not load the store configuration, so some details may be missing. No product data or prices are being shown from a stale copy.",
  },
};
