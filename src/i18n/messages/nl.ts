import type { Messages } from "@/i18n/messages";

/**
 * Nederlands.
 *
 * Typed as `Messages`, so this file must have exactly the keys of the English
 * dictionary: a missing key is a type error, not an empty label in production.
 *
 * Interface copy only. Product names, descriptions and other catalog content
 * come from the API in the language they were written in - nothing here
 * translates or invents product facts.
 */
export const nl: Messages = {
  common: {
    loading: "Laden",
    close: "Sluiten",
    cancel: "Annuleren",
    save: "Opslaan",
    remove: "Verwijderen",
    tryAgain: "Opnieuw proberen",
    back: "Terug",
    previous: "Vorige",
    next: "Volgende",
    page: "Pagina {page}",
    required: "Verplicht",
    optional: "optioneel",
    search: "Zoeken",
    viewAll: "Alles bekijken",
    goHome: "Naar de startpagina",
    browseShop: "Naar de winkel",
    skipToContent: "Naar de inhoud",
    calculatedAtCheckout: "Berekend bij het afrekenen",
    unreachable: "We kunnen de winkel nu niet bereiken. Probeer het opnieuw.",
    somethingWentWrong: "Er ging iets mis. Probeer het opnieuw.",
  },

  ui: {
    close: "Sluiten",
    quantity: "Aantal",
    decrease: "Aantal verlagen",
    increase: "Aantal verhogen",
    pagination: "Paginering",
    previous: "Vorige",
    next: "Volgende",
    pageN: "Pagina {page}",
    showing: "{from}–{to} van {total}",
    rated: {
      one: "Beoordeeld met {average} van de 5 op basis van {count} review",
      other: "Beoordeeld met {average} van de 5 op basis van {count} reviews",
    },
    starBucket: "{bucket} sterren: {count} van {total} reviews",
    errorUnreachableTitle: "We kunnen de winkel niet bereiken",
    errorUnreachableBody:
      "De winkel reageert op dit moment niet. Er is niets verloren gegaan - probeer het zo opnieuw.",
    errorGenericTitle: "Er ging iets mis",
    errorGenericBody:
      "Probeer het opnieuw. Blijft het gebeuren, neem dan contact met ons op en we zoeken het uit.",
    reference: "Referentie: {reference}",
  },

  language: {
    label: "Taal",
    choose: "Kies een taal",
    current: "Huidige taal",
  },

  header: {
    searchProducts: "Producten zoeken",
    searchPlaceholder: "Zoek producten",
    signIn: "Inloggen",
    account: "Account",
    orders: "Bestellingen",
    admin: "Beheer",
    signOut: "Uitloggen",
    signingOut: "Uitloggen…",
    openMenu: "Menu openen",
    more: "Meer",
    moreLinks: "Meer navigatielinks",
    shop: "Winkel",
    browseAll: "Bekijk alle producten",
    viewAllIn: "Alles in {name}",
    allIn: "Alles in {name}",
    categories: "Categorieën",
    all: "Alles",
    cartEmpty: "Winkelwagen, leeg",
    cartItems: {
      one: "Winkelwagen, {count} artikel",
      other: "Winkelwagen, {count} artikelen",
    },
    homeLabel: "{store} startpagina",
    main: "Hoofdmenu",
    pricesIn: "Prijzen in {currency}",
  },

  nav: {
    primary: "Navigatie",
    home: "Home",
    shop: "Winkel",
    search: "Zoeken",
    cart: "Winkelwagen",
    account: "Account",
    items: { one: "{count} artikel", other: "{count} artikelen" },
  },

  footer: {
    categories: "Categorieën",
    pages: "Pagina's",
    allPages: "Alle pagina's",
    contact: "Contact",
    shipping: "Verzending",
    returns: "Retourneren",
    pricesIn: "Prijzen in {currency}",
    testMode: "testmodus",
    card: "Kaart",
    paypal: "PayPal",
    socialOn: "{store} op {network}",
    payments: "Geaccepteerde betaalmethoden",
    rights: "Alle rechten voorbehouden.",
  },

  breadcrumb: {
    label: "Kruimelpad",
    home: "Home",
    shop: "Winkel",
  },

  home: {
    notSetUpTitle: "De startpagina is nog niet ingericht",
    notSetUpBody:
      "Zodra de winkel inhoud voor de startpagina toevoegt, verschijnt die hier.",
    productCount: { one: "{count} product", other: "{count} producten" },
    heroSlides: "Uitgelichte afbeeldingen",
    heroPrevious: "Vorige afbeelding",
    heroNext: "Volgende afbeelding",
    heroGoTo: "Toon afbeelding {index} van {total}",
  },

  listing: {
    shopTitle: "Winkel",
    searchTitle: "Zoeken",
    searchMeta: "Zoeken: {term}",
    resultsFor: "Resultaten voor",
    categoryFallbackTitle: "Categorie",
    subcategories: "Subcategorieën",
    count: { one: "{count} product", other: "{count} producten" },
    reload: "Opnieuw laden",
    clearFilters: "Filters wissen",
    emptyTitle: "Geen producten voor deze filters",
    emptyBody: "Verwijder een filter of verruim de prijsklasse.",
    searchEmptyTitle: "Niets gevonden voor \u201c{term}\u201d",
    searchEmptyBody:
      "Controleer de spelling of probeer een kortere of algemenere zoekterm.",
    searchPromptTitle: "Voer een zoekterm in",
    searchPromptBody: "Zoek op productnaam, SKU of beschrijving.",
    categoryEmptyTitle: "Nog geen producten in deze categorie",
    categoryEmptyBody:
      "Zodra hier producten worden gepubliceerd, verschijnen ze in deze lijst.",
  },

  filters: {
    title: "Filters",
    form: "Productfilters",
    search: "Zoeken",
    searchPlaceholder: "Productnaam of SKU",
    category: "Categorie",
    allCategories: "Alle categorieën",
    price: "Prijs",
    minPrice: "Minimumprijs",
    maxPrice: "Maximumprijs",
    min: "Min",
    max: "Max",
    inStock: "Alleen op voorraad",
    sortBy: "Sorteren op",
    sortDefault: "Standaard",
    sort: {
      relevance: "Relevantie",
      newest: "Nieuwste",
      price_asc: "Prijs: laag naar hoog",
      price_desc: "Prijs: hoog naar laag",
      name_asc: "Naam: A tot Z",
      name_desc: "Naam: Z tot A",
    },
    apply: "Filters toepassen",
    clear: "Wissen",
  },

  productCard: {
    noImage: "Geen afbeelding beschikbaar",
    soldOut: "Uitverkocht",
  },

  availability: {
    in_stock: "Op voorraad",
    low_stock: "Beperkte voorraad",
    out_of_stock: "Niet op voorraad",
    preorder: "Te reserveren",
    unavailable: "Niet beschikbaar",
    left: "nog {count}",
  },

  price: {
    reduced: "afgeprijsd van {from} naar {to}",
  },

  product: {
    metaFallbackTitle: "Product",
    sku: "SKU {sku}",
    quantityFor: "Aantal voor {name}",
    addToCart: "In winkelwagen",
    added: "Toegevoegd",
    addedToCart: "Toegevoegd aan winkelwagen",
    addedNotice: "Toegevoegd aan je winkelwagen.",
    viewCart: "Bekijk winkelwagen",
    combinationUnavailable:
      "Die combinatie is niet beschikbaar. Kies een andere optie.",
    combinationAlert:
      "Die combinatie is niet beschikbaar. Kies een andere optie om verder te gaan.",
    chooseOption: "Kies een optie om verder te gaan.",
    notAvailable: "Dit artikel is niet te koop.",
    outOfStock: "Dit artikel is momenteel niet op voorraad.",
    returnsDays: "{days} dagen retourneren",
    freeShippingOver: "Gratis verzending vanaf {amount}",
    valueNotAvailable: "{value} - niet beschikbaar",
    video: "Video van {name}",
    viewLarger: "Grotere afbeelding bekijken",
    media: "Productmedia",
    showImage: "Afbeelding {n} tonen",
    showVideo: "Video {n} tonen",
    sections: {
      valueProps: "Waarom je dit fijn vindt",
      inUse: "In gebruik",
      included: "Wat zit er in de doos",
      details: "Productdetails",
      specifications: "Specificaties",
      shipping: "Verzending & levering",
      freeShippingOn: "Gratis verzending bij bestellingen vanaf {amount}.",
      returns: "Retourneren & garantie",
      returnsWindow: "{days} dagen bedenktijd voor retourneren.",
      questions: "Vragen",
      related: "Misschien vind je dit ook leuk",
    },
    reviews: {
      title: "Reviews",
      outOf5: "van de 5",
      count: { one: "{count} review", other: "{count} reviews" },
      verified: "Geverifieerde aankoop",
      storeReply: "Reactie van de winkel",
      showing: "{shown} van {total} reviews.",
    },
  },

  cart: {
    metaTitle: "Winkelwagen",
    title: "Je winkelwagen",
    emptyTitle: "Je winkelwagen is leeg",
    emptyBody:
      "Artikelen die je toevoegt, worden hier bewaard terwijl je verder kijkt.",
    checkFailedTitle: "We konden je winkelwagen niet controleren",
    sku: "SKU {sku}",
    quantityFor: "Aantal voor {name}",
    remove: "Verwijderen",
    each: "{price} per stuk",
    continueShopping: "Verder winkelen",
    clear: "Winkelwagen legen",
    summary: "Overzicht",
    subtotal: "Subtotaal",
    discount: "Korting",
    shipping: "Verzending",
    tax: "Btw",
    total: "Totaal",
    totalsUnavailable: "De totalen zijn nu niet beschikbaar.",
    checkingPrices: "Prijzen controleren…",
    notCalculatedHint:
      "Verzending en btw staan op \u201c{label}\u201d tot je een bezorgadres en verzendmethode kiest.",
    checkout: "Afrekenen",
    signInRequired: "Je moet inloggen om je bestelling af te ronden.",
    notices: {
      removed: "Sommige artikelen zijn verwijderd",
      adjusted: "Sommige aantallen zijn gewijzigd",
      quantityReduced: "Aantal verlaagd van {from} naar {to}.",
      check: "Controleer deze artikelen",
    },
  },

  address: {
    firstName: "Voornaam",
    lastName: "Achternaam",
    company: "Bedrijf",
    line1: "Adres",
    line2: "Appartement, toevoeging, enz.",
    city: "Plaats",
    region: "Provincie of regio",
    postalCode: "Postcode",
    country: "Land",
    selectCountry: "Kies een land",
    phone: "Telefoon",
    optional: "Optioneel",
    phoneHint:
      "Optioneel. Alleen gebruikt als er een probleem is met de bezorging.",
    errors: {
      firstName: "Vul een voornaam in.",
      lastName: "Vul een achternaam in.",
      line1: "Vul een straat en huisnummer in.",
      city: "Vul een plaats in.",
      postalCode: "Vul een postcode in.",
      country: "Kies een land.",
    },
  },

  checkout: {
    metaTitle: "Afrekenen",
    emptyTitle: "Je winkelwagen is leeg",
    emptyBody: "Voeg iets toe aan je winkelwagen voordat je afrekent.",
    signInTitle: "Log in om af te rekenen",
    signInBody: "Voor deze winkel heb je een account nodig om te bestellen.",
    signIn: "Inloggen",
    emailRequired: "Vul je e-mailadres in.",
    emailInvalid: "Vul een geldig e-mailadres in.",
    steps: {
      contact: "Contactgegevens",
      contactBody: "Hiermee sturen we je de orderbevestiging.",
      address: "Bezorgadres",
      method: "Verzendmethode",
      methodBody:
        "De tarieven komen uit de ingestelde verzendzones van de winkel.",
      payment: "Betaling",
    },
    orderN: "Bestelling {number}",
    email: "E-mailadres",
    phone: "Telefoon",
    phoneOptional: "Optioneel.",
    guestPrefix: "Je rekent af als gast.",
    guestSignIn: "Log in",
    guestSuffix: "om een opgeslagen adres te gebruiken.",
    billingSame: "Het factuuradres is hetzelfde als het bezorgadres.",
    checkCountry: "Verzendopties voor dit land bekijken",
    noProvider: "Er is geen betaalprovider ingeschakeld voor deze winkel.",
    paymentMethod: "Betaalmethode",
    cardLabel: "Kaart",
    paypalLabel: "PayPal",
    stripeTest: "Testmodus - er wordt niets afgeschreven",
    paypalSandbox: "Sandboxmodus - er wordt niets afgeschreven",
    note: "Opmerking bij de bestelling",
    noteHint: "Optioneel. Alles wat we over deze bestelling moeten weten.",
    marketing: "Stuur me af en toe nieuws van de winkel",
    placeFailed: "We konden je bestelling niet plaatsen",
    paymentStartFailed: "De betaling kon niet worden gestart",
    providerGone:
      "Die betaalmethode is niet meer beschikbaar. Laad de pagina opnieuw om de huidige opties te zien.",
    preparing: "Betaalformulier wordt voorbereid…",
    reservedNotice:
      "Je bestelling is gereserveerd, maar pas compleet als de betaalprovider de betaling bevestigt. We markeren een bestelling nooit vanaf deze pagina als betaald.",
    cartChangedTitle: "Je winkelwagen is gewijzigd voor de betaling",
    cartChangedBody:
      "Het overzicht toont nu de actuele prijzen en beschikbaarheid. Bekijk het en bevestig om verder te gaan. Er is niets afgeschreven.",
    reviewed: "Ik heb de wijzigingen bekeken",
    notConfiguredTitle: "Online betalen is niet ingesteld",
    notConfiguredBody:
      "Deze winkel heeft geen betaalprovider ingeschakeld, dus een bestelling kan nu niet worden afgerond. Er wordt niets afgeschreven van wat je hieronder invult. Neem contact op met de winkel om je bestelling te plaatsen.",
    placing: "Bestelling plaatsen…",
    continue: "Verder naar betalen",
    blocked: "Kies een land waar we naartoe kunnen bezorgen om verder te gaan.",
    confirmChanges:
      "Bevestig eerst de wijzigingen in je winkelwagen hierboven.",
    nextStepNotice:
      "Je vult je betaalgegevens in bij de volgende stap. Tot dan wordt er niets afgeschreven.",
    summary: {
      label: "Overzicht",
      show: "Overzicht tonen",
      hide: "Overzicht verbergen",
      shippingWith: "Verzending ({method})",
      discountWith: "Korting ({code})",
      totalWithShipping: "Totaal (artikelen + verzending)",
      taxHint:
        "De btw staat op \u201c{label}\u201d omdat er voor deze winkel geen btw-berekening is ingesteld. Je betaalt het totaal dat bij de volgende stap wordt bevestigd.",
      checking: "Prijzen en beschikbaarheid controleren…",
    },
    shipping: {
      chooseCountry:
        "Kies hierboven een bezorgland om de beschikbare verzendopties te zien.",
      checking: "Verzendopties controleren…",
      loadFailed: "We konden de verzendopties niet laden",
      blockedTitle: "We bezorgen nog niet in dit land",
      blockedBody:
        "Voor deze bestemming is geen verzendtarief ingesteld, dus deze bestelling kan niet worden afgerond. Kies een ander bezorgland of neem contact met ons op over bezorging daar.",
      label: "Verzendmethode",
      days: { one: "{count} werkdag", other: "{count} werkdagen" },
      range: "{min}-{max} werkdagen",
    },
    stripe: {
      testTitle: "Testmodus",
      testBody:
        "Deze winkel staat in de testmodus van Stripe. Echte kaarten worden niet belast.",
      failedTitle: "Betaling niet voltooid",
      failed: "De betaling kon niet worden voltooid. Er is niets afgeschreven.",
      processing: "Betaling verwerken…",
      pay: "Betaal {amount}",
      secure:
        "Je kaartgegevens voer je rechtstreeks bij Stripe in; ze komen nooit op de servers van deze winkel.",
    },
    paypal: {
      sandboxTitle: "Sandboxmodus",
      sandboxBody:
        "Deze winkel staat in de sandboxmodus van PayPal. Er wordt geen echt geld overgemaakt.",
      failedTitle: "Betaling niet voltooid",
      problem:
        "PayPal meldde een probleem met deze betaling. Er is niets afgeschreven - je kunt het opnieuw proberen.",
    },
  },

  paymentStatus: {
    paid: {
      title: "Betaling bevestigd",
      description:
        "Je betaling is bevestigd en je bestelling wordt klaargemaakt.",
    },
    authorized: {
      title: "Betaling geautoriseerd",
      description:
        "Je betaling is geautoriseerd en wordt afgeschreven zodra de bestelling wordt klaargemaakt. Je hoeft verder niets te doen.",
    },
    partially_refunded: {
      title: "Gedeeltelijk terugbetaald",
      description:
        "Een deel van deze bestelling is terugbetaald. De bedragen hieronder komen uit onze administratie.",
    },
    refunded: {
      title: "Terugbetaald",
      description: "Deze bestelling is volledig terugbetaald.",
    },
    failed: {
      title: "Betaling mislukt",
      description:
        "De betaling is niet gelukt, dus de bestelling is niet geplaatst. Je kunt opnieuw proberen te betalen - er is niets afgeschreven.",
    },
    cancelled: {
      title: "Betaling geannuleerd",
      description:
        "De betaling is geannuleerd, dus de bestelling is niet geplaatst.",
    },
    unpaid: {
      title: "Betaling nog niet bevestigd",
      description:
        "We hebben nog geen bevestiging van de betaalprovider ontvangen. Dat kan even duren - vernieuw om het opnieuw te controleren. Je bestelling is pas compleet als die bevestigd is.",
    },
  },

  status: {
    orderLabel: "Bestelstatus:",
    paymentLabel: "Betaalstatus:",
    moderationLabel: "Moderatiestatus:",
    order: {
      pending: "In afwachting",
      processing: "In behandeling",
      shipped: "Verzonden",
      delivered: "Bezorgd",
      cancelled: "Geannuleerd",
      refunded: "Terugbetaald",
    },
    payment: {
      unpaid: "Onbetaald",
      authorized: "Geautoriseerd",
      paid: "Betaald",
      partially_refunded: "Gedeeltelijk terugbetaald",
      refunded: "Terugbetaald",
      failed: "Mislukt",
      cancelled: "Geannuleerd",
    },
    review: {
      pending: "In afwachting",
      approved: "Goedgekeurd",
      rejected: "Afgewezen",
    },
  },

  orders: {
    noItems: "Er staan geen artikelen bij deze bestelling geregistreerd.",
    sku: "SKU {sku}",
    subtotal: "Subtotaal",
    discount: "Korting",
    discountWith: "Korting ({code})",
    shipping: "Verzending",
    tax: "Btw",
    total: "Totaal",
    carrier: "Vervoerder:",
    trackingNumber: "Trackingnummer:",
    track: "Zending volgen",
    orderN: "Bestelling",
    placed: "Geplaatst op {date}",
    items: "Artikelen",
    itemsOnOrder: "Artikelen in deze bestelling",
    totals: "Totalen",
    delivery: "Bezorging",
  },

  returnPages: {
    successMetaTitle: "Bestelstatus",
    cancelMetaTitle: "Betaling geannuleerd",
    noOrderTitle: "We weten niet welke bestelling we moeten tonen",
    noOrderBody:
      "In deze link ontbreekt het bestelnummer, dus we kunnen de status niet opzoeken.",
    seeOrders: "Bekijk je bestellingen",
    backToStore: "Terug naar de winkel",
    notConfirmedTitle: "We konden deze bestelling niet bevestigen",
    notFoundBody:
      "We konden die bestelling niet vinden met de gegevens in deze link. Heb je een account, dan staan je bestellingen daar.",
    checkAgain: "Opnieuw controleren",
    signInToSee: "Log in om je bestellingen te zien",
    cartUntouched:
      "We hebben je winkelwagen niet gewijzigd, omdat we de betaalstatus van deze bestelling niet konden controleren.",
    refresh: "Status vernieuwen",
    retry: "Winkelwagen bekijken en opnieuw proberen",
    viewInAccount: "Bekijk in je account",
    continueShopping: "Verder winkelen",
    whyTitle: "Waarom staat hier dat het niet bevestigd is?",
    whyBody:
      "Betaalbevestigingen komen van de betaalprovider, niet van je browser. Daarom tonen we een bestelling pas als betaald wanneer die bevestiging bij ons binnen is. Heb je betaald, vernieuw dan zo. Betaal niet twee keer - controleer eerst je bestelstatus.",
    keepLinkPrefix:
      "Bewaar de link van deze pagina om je bestelling later opnieuw te bekijken, of",
    createAccount: "maak een account aan",
    keepLinkSuffix:
      "met dit e-mailadres om hem in je bestelgeschiedenis te zien.",
    wentThroughTitle: "Deze betaling is toch gelukt",
    wentThroughBody:
      "Je kwam op de pagina voor geannuleerde betalingen, maar volgens onze gegevens is de betaling van deze bestelling {status}. Je hoeft verder niets te doen.",
    seeStatus: "Bestelstatus bekijken",
    notCompletedTitle: "Betaling niet voltooid",
    notPaidWithOrder:
      "Deze bestelling is niet betaald, dus hij is niet geplaatst. Je winkelwagen staat er nog en er is niets afgeschreven.",
    notPaidNoOrder:
      "De betaling is niet voltooid, dus er is geen bestelling geplaatst. Je winkelwagen staat er nog en er is niets afgeschreven.",
    tryAgain: "Opnieuw betalen",
    reviewCart: "Winkelwagen bekijken",
    checkStatus: "Status van deze bestelling controleren",
    currencyNote:
      "Valuta van de winkel: {currency}. Denk je dat er iets is afgeschreven, controleer dan eerst de bestelstatus hierboven voordat je opnieuw betaalt.",
  },

  auth: {
    email: "E-mailadres",
    password: "Wachtwoord",
    name: "Naam",
    emailRequired: "Vul je e-mailadres in.",
    emailInvalid: "Vul een geldig e-mailadres in.",
    passwordRequired: "Vul je wachtwoord in.",
    nameRequired: "Vul je naam in.",
    passwordMin: "Gebruik minstens 8 tekens.",
    passwordLetter: "Gebruik minstens één letter.",
    passwordNumber: "Gebruik minstens één cijfer.",
    passwordHint: "Minstens 8 tekens, met een letter en een cijfer.",
    confirmRequired: "Bevestig je wachtwoord.",
    confirmNewRequired: "Bevestig je nieuwe wachtwoord.",
    mismatch: "De wachtwoorden komen niet overeen.",
    marketing: "Stuur me af en toe nieuws van de winkel",
    login: {
      metaTitle: "Inloggen",
      title: "Inloggen",
      description: "Bekijk je bestellingen, adressen en accountgegevens.",
      failed: "We konden je niet inloggen",
      submitting: "Inloggen…",
      submit: "Inloggen",
      forgot: "Wachtwoord vergeten?",
      newHere: "Nieuw hier?",
      create: "Account aanmaken",
    },
    register: {
      metaTitle: "Account aanmaken",
      title: "Account aanmaken",
      description:
        "Houd je bestellingen bij en bewaar adressen voor de volgende keer.",
      failed: "We konden je account niet aanmaken",
      confirm: "Wachtwoord bevestigen",
      submitting: "Account aanmaken…",
      submit: "Account aanmaken",
      haveAccount: "Heb je al een account?",
      signIn: "Inloggen",
    },
    forgot: {
      metaTitle: "Wachtwoord opnieuw instellen",
      title: "Wachtwoord opnieuw instellen",
      description:
        "Vul het e-mailadres van je account in en we sturen je een link om het wachtwoord opnieuw in te stellen.",
      failed: "We konden het verzoek niet versturen",
      submitting: "Versturen…",
      submit: "Link versturen",
      doneTitle: "Controleer je e-mail",
      doneBody:
        "Als er een account bestaat voor dat adres, hebben we een link gestuurd om het wachtwoord opnieuw in te stellen. De link verloopt na korte tijd, dus gebruik hem snel.",
      doneNote:
        "Voor je veiligheid bevestigen we niet of er een account bestaat.",
      remembered: "Weet je het weer?",
      back: "Terug naar inloggen",
    },
    reset: {
      metaTitle: "Nieuw wachtwoord instellen",
      title: "Nieuw wachtwoord instellen",
      incompleteTitle: "Deze link is niet compleet",
      incompleteBody:
        "In de link ontbreekt informatie die nodig is om een wachtwoord opnieuw in te stellen. Vraag een nieuwe aan en open de meest recente e-mail.",
      requestNew: "Nieuwe link aanvragen",
      back: "Terug naar inloggen",
      failed: "We konden je wachtwoord niet opnieuw instellen",
      forEmail: "Je stelt het wachtwoord opnieuw in voor {email}.",
      newPassword: "Nieuw wachtwoord",
      confirm: "Nieuw wachtwoord bevestigen",
      submitting: "Bijwerken…",
      submit: "Nieuw wachtwoord instellen",
      doneTitle: "Wachtwoord bijgewerkt",
      doneBody: "Je kunt nu inloggen met je nieuwe wachtwoord.",
      goSignIn: "Naar inloggen",
    },
  },

  search: {
    title: "Zoeken",
    description: "Zoek producten op naam, beschrijving of SKU.",
    placeholder: "Waar ben je naar op zoek?",
    submit: "Zoeken",
  },

  cartDrawer: {
    title: "Je winkelwagen",
    emptyTitle: "Je winkelwagen is leeg",
    emptyBody: "Artikelen die je toevoegt, verschijnen hier.",
    subtotal: "Subtotaal",
    discount: "Korting",
    shipping: "Verzending",
    viewCart: "Bekijk winkelwagen",
    quantityFor: "Aantal voor {name}",
    removeItem: "{name} verwijderen",
    checkFailed: "We kunnen je winkelwagen nu niet controleren.",
    unexpected: "De winkel gaf een onverwacht antwoord.",
    unreachable:
      "We konden de winkel niet bereiken om je winkelwagen te controleren.",
  },

  contact: {
    metaTitle: "Contact",
    metaDescription: "Stuur een bericht naar {store}.",
    title: "Neem contact op",
    intro:
      "Stuur ons een bericht en we antwoorden per e-mail. Zodra je bericht binnen is, ontvang je een bevestiging met een referentie.",
    otherWays: "Andere manieren om ons te bereiken",
    shipping: "Verzending",
    returns: "Retourneren",
    name: "Je naam",
    email: "E-mailadres",
    emailHint: "We antwoorden op dit adres.",
    subject: "Onderwerp",
    message: "Bericht",
    send: "Bericht versturen",
    sending: "Versturen…",
    errors: {
      name: "Vul je naam in.",
      email: "Vul een geldig e-mailadres in.",
      message: "Beschrijf je vraag in minstens 10 tekens.",
      unreachable:
        "We kunnen de winkel niet bereiken. Controleer je verbinding en probeer het opnieuw.",
      rateLimited:
        "Dat zijn veel berichten in korte tijd. Probeer het over een minuut opnieuw.",
      notSent: "Je bericht is niet verstuurd. Probeer het opnieuw.",
    },
    notSentTitle: "Je bericht is niet verstuurd",
    sentTitle: "Je bericht is verstuurd",
    sentBody:
      "We hebben je bericht ontvangen en er is een kopie onderweg naar je inbox. Je referentie is {reference} - vermeld die als je ons opnieuw schrijft.",
  },

  notFound: {
    title: "We kunnen deze pagina niet vinden",
    description:
      "De link is misschien verouderd, of het artikel is niet meer beschikbaar.",
  },

  error: {
    title: "Er ging iets mis",
    description:
      "Deze pagina kon niet worden geladen. Probeer het opnieuw of ga terug naar de startpagina.",
  },

  degraded: {
    title: "Winkelinstellingen zijn niet beschikbaar",
    body: "We konden de winkelconfiguratie niet laden, dus sommige gegevens kunnen ontbreken. Er worden geen productgegevens of prijzen uit een verouderde kopie getoond.",
  },
};
