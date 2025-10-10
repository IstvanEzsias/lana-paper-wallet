export type Language = 'en' | 'sl' | 'hu';

export interface Translations {
  menu: {
    createWallet: string;
    connectRegistrar: string;
  };
  instructions: {
    title: string;
    text1: string;
    text2: string;
  };
  input: {
    title: string;
    description: string;
    label: string;
    placeholder: string;
    scanButton: string;
    invalidFormat: string;
    showNostr: string;
    nostrInfo: string;
    convertButton: string;
    converting: string;
  };
  results: {
    complete: string;
    lanaPrivateKey: string;
    lanaPrivateKeyDesc: string;
    walletId: string;
    walletIdDesc: string;
    nostrHexId: string;
    nostrHexIdDesc: string;
    nostrNpubId: string;
    nostrNpubIdDesc: string;
    nostrPrivateKey: string;
    nostrPrivateKeyDesc: string;
  };
  print: {
    title: string;
    description: string;
    customTextLabel: string;
    customTextPlaceholder: string;
    twoCards: string;
    fiveCards: string;
    generateButton: string;
    securityNotice: string;
    securityText: string;
  };
  printDoc: {
    walletTitle: string;
    lanaPrivateKey: string;
    walletId: string;
    nostrHexId: string;
    nostrNpubId: string;
    nostrPrivateKeyHex: string;
    securityWarningTitle: string;
    securityWarningText: string;
  };
  toasts: {
    conversionSuccess: string;
    conversionSuccessDesc: string;
    conversionFailed: string;
    copied: string;
    copiedDesc: string;
    copyFailed: string;
    copyFailedDesc: string;
    qrScanned: string;
    qrScannedDesc: string;
    printError: string;
    printErrorDesc: string;
  };
  errors: {
    enterWif: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    menu: {
      createWallet: 'Create New Wallet',
      connectRegistrar: 'Connect to Registrar',
    },
    instructions: {
      title: 'Instructions',
      text1: 'This website is designed to help you generate QR codes from your LanaCoin private keys and print them for secure offline storage.',
      text2: 'Enter your WIF private key below, generate the conversion, and then print the document to store your wallet information safely in multiple secure locations.',
    },
    input: {
      title: 'WIF Private Key Input',
      description: 'Enter your LanaCoin WIF (Wallet Import Format) private key to convert it',
      label: 'WIF Private Key',
      placeholder: 'e.g., 6vNKUjypr3h3gPWSaa9TU9s3mgDujuaeZtAi63vHq7wGZqH3iH3',
      scanButton: 'Scan QR Code',
      invalidFormat: 'Invalid WIF format. Please check your input.',
      showNostr: 'Show NOSTR data',
      nostrInfo: 'You will only need NOSTR data if you have an account on other NOSTR platforms. Otherwise, only the LANA Private Key is sufficient, from which you can always derive NOSTR data later.',
      convertButton: 'Convert to IDs',
      converting: 'Converting...',
    },
    results: {
      complete: 'Conversion Complete',
      lanaPrivateKey: 'LANA Private Key (WIF)',
      lanaPrivateKeyDesc: 'Your original LanaCoin private key in WIF format',
      walletId: 'LanaCoin Wallet ID',
      walletIdDesc: 'Your LanaCoin wallet address derived from the private key',
      nostrHexId: 'Nostr HEX ID',
      nostrHexIdDesc: '32-byte hexadecimal Nostr public key identifier',
      nostrNpubId: 'Nostr npub ID',
      nostrNpubIdDesc: 'Human-readable bech32-encoded Nostr public key (npub format)',
      nostrPrivateKey: 'Nostr Private Key (HEX)',
      nostrPrivateKeyDesc: '32-byte hexadecimal Nostr private key for signing',
    },
    print: {
      title: 'Generate Print Document',
      description: 'Create an A4 document with wallets and QR codes for secure storage',
      customTextLabel: 'Text at the top (optional)',
      customTextPlaceholder: 'e.g. 100 Million Fun',
      twoCards: 'The document will contain 2 cards: LANA Private Key and Wallet ID',
      fiveCards: 'The document will contain 5 cards: LANA Private Key, Wallet ID and 3 NOSTR data fields',
      generateButton: 'Generate Print Document',
      securityNotice: 'IMPORTANT SECURITY NOTICE:',
      securityText: 'Store this document securely in THREE separate locations. Keep it away from moisture, fire, and unauthorized access. Anyone with access to the Private Key can access your funds.',
    },
    printDoc: {
      walletTitle: 'LANA Wallet',
      lanaPrivateKey: 'LANA Private Key (WIF)',
      walletId: 'LanaCoin Wallet ID',
      nostrHexId: 'Nostr HEX ID',
      nostrNpubId: 'Nostr npub ID',
      nostrPrivateKeyHex: 'Nostr Private Key (HEX)',
      securityWarningTitle: '⚠️ IMPORTANT SECURITY NOTICE ⚠️',
      securityWarningText: 'Store this document securely in THREE separate locations. Keep it away from moisture, fire, and unauthorized access. Anyone with access to the Private Key can access your funds. Never share your private key with anyone.',
    },
    toasts: {
      conversionSuccess: 'Conversion Successful',
      conversionSuccessDesc: 'Your WIF has been converted to Wallet ID and Nostr identifiers.',
      conversionFailed: 'Conversion Failed',
      copied: 'Copied!',
      copiedDesc: 'copied to clipboard',
      copyFailed: 'Copy Failed',
      copyFailedDesc: 'Could not copy to clipboard',
      qrScanned: 'QR Code Scanned',
      qrScannedDesc: 'Private key has been read from QR code',
      printError: 'Error',
      printErrorDesc: 'Cannot open print window. Check your browser settings.',
    },
    errors: {
      enterWif: 'Please enter a WIF private key',
    },
  },
  sl: {
    menu: {
      createWallet: 'Ustvari novo denarnico',
      connectRegistrar: 'Poveži se z registrarjem',
    },
    instructions: {
      title: 'Navodila',
      text1: 'Ta spletna stran je namenjena generiranju QR kod iz vaših LanaCoin zasebnih ključev in njihovemu tiskanju za varno shranjevanje brez povezave.',
      text2: 'Vnesite svoj WIF zasebni ključ spodaj, generirajte pretvorbo in nato natisnite dokument za varno shranjevanje informacij o denarnici na več varnih lokacijah.',
    },
    input: {
      title: 'Vnos WIF zasebnega ključa',
      description: 'Vnesite svoj LanaCoin WIF (Wallet Import Format) zasebni ključ za pretvorbo',
      label: 'WIF zasebni ključ',
      placeholder: 'npr., 6vNKUjypr3h3gPWSaa9TU9s3mgDujuaeZtAi63vHq7wGZqH3iH3',
      scanButton: 'Skeniraj QR kodo',
      invalidFormat: 'Neveljavna WIF oblika. Preverite svoj vnos.',
      showNostr: 'Prikaži NOSTR podatke',
      nostrInfo: 'NOSTR podatke boste potrebovali le, če imate račun na drugih NOSTR platformah. V nasprotnem primeru zadostuje le LANA zasebni ključ, iz katerega lahko vedno kasneje izpeljete NOSTR podatke.',
      convertButton: 'Pretvori v ID-je',
      converting: 'Pretvarjam...',
    },
    results: {
      complete: 'Pretvorba končana',
      lanaPrivateKey: 'LANA zasebni ključ (WIF)',
      lanaPrivateKeyDesc: 'Vaš originalni LanaCoin zasebni ključ v WIF obliki',
      walletId: 'LanaCoin ID denarnice',
      walletIdDesc: 'Vaš LanaCoin naslov denarnice, izpeljan iz zasebnega ključa',
      nostrHexId: 'Nostr HEX ID',
      nostrHexIdDesc: '32-bajtni heksadecimalni Nostr javni ključ identifikator',
      nostrNpubId: 'Nostr npub ID',
      nostrNpubIdDesc: 'Človeško berljiv bech32-kodiran Nostr javni ključ (npub oblika)',
      nostrPrivateKey: 'Nostr zasebni ključ (HEX)',
      nostrPrivateKeyDesc: '32-bajtni heksadecimalni Nostr zasebni ključ za podpisovanje',
    },
    print: {
      title: 'Generiraj dokument za tiskanje',
      description: 'Ustvari A4 dokument z denarnicami in QR kodami za varno shranjevanje',
      customTextLabel: 'Besedilo na vrhu (opcijsko)',
      customTextPlaceholder: 'npr. 100 milijonov zabave',
      twoCards: 'Dokument bo vseboval 2 kartici: LANA zasebni ključ in ID denarnice',
      fiveCards: 'Dokument bo vseboval 5 kartic: LANA zasebni ključ, ID denarnice in 3 NOSTR podatkovna polja',
      generateButton: 'Generiraj dokument za tiskanje',
      securityNotice: 'POMEMBNO VARNOSTNO OBVESTILO:',
      securityText: 'Ta dokument shranjujte varno na TREH ločenih lokacijah. Hranite ga stran od vlage, ognja in nepooblaščenega dostopa. Kdorkoli ima dostop do zasebnega ključa, lahko dostopa do vaših sredstev.',
    },
    printDoc: {
      walletTitle: 'LANA denarnica',
      lanaPrivateKey: 'LANA zasebni ključ (WIF)',
      walletId: 'LanaCoin ID denarnice',
      nostrHexId: 'Nostr HEX ID',
      nostrNpubId: 'Nostr npub ID',
      nostrPrivateKeyHex: 'Nostr zasebni ključ (HEX)',
      securityWarningTitle: '⚠️ POMEMBNO VARNOSTNO OBVESTILO ⚠️',
      securityWarningText: 'Ta dokument shranjujte varno na TREH ločenih lokacijah. Hranite ga stran od vlage, ognja in nepooblaščenega dostopa. Kdorkoli ima dostop do zasebnega ključa, lahko dostopa do vaših sredstev. Nikoli ne delite svojega zasebnega ključa z nikomer.',
    },
    toasts: {
      conversionSuccess: 'Pretvorba uspešna',
      conversionSuccessDesc: 'Vaš WIF je bil pretvorjen v ID denarnice in Nostr identifikatorje.',
      conversionFailed: 'Pretvorba neuspešna',
      copied: 'Kopirano!',
      copiedDesc: 'kopirano v odložišče',
      copyFailed: 'Kopiranje neuspešno',
      copyFailedDesc: 'Ni mogoče kopirati v odložišče',
      qrScanned: 'QR koda skenirana',
      qrScannedDesc: 'Zasebni ključ je bil prebran iz QR kode',
      printError: 'Napaka',
      printErrorDesc: 'Ni mogoče odpreti okna za tiskanje. Preverite nastavitve brskalnika.',
    },
    errors: {
      enterWif: 'Prosim vnesite WIF zasebni ključ',
    },
  },
  hu: {
    menu: {
      createWallet: 'Új tárca létrehozása',
      connectRegistrar: 'Csatlakozás a regisztrátorhoz',
    },
    instructions: {
      title: 'Utasítások',
      text1: 'Ez a weboldal arra szolgál, hogy QR kódokat generáljon LanaCoin privát kulcsaiból és kinyomtassa őket biztonságos offline tárolás céljából.',
      text2: 'Adja meg WIF privát kulcsát alább, generálja a konverziót, majd nyomtassa ki a dokumentumot, hogy tárca információit biztonságosan több helyen tárolja.',
    },
    input: {
      title: 'WIF privát kulcs bevitel',
      description: 'Adja meg LanaCoin WIF (Wallet Import Format) privát kulcsát a konvertáláshoz',
      label: 'WIF privát kulcs',
      placeholder: 'pl., 6vNKUjypr3h3gPWSaa9TU9s3mgDujuaeZtAi63vHq7wGZqH3iH3',
      scanButton: 'QR kód beolvasása',
      invalidFormat: 'Érvénytelen WIF formátum. Kérjük, ellenőrizze a bevitelt.',
      showNostr: 'NOSTR adatok megjelenítése',
      nostrInfo: 'NOSTR adatokra csak akkor lesz szüksége, ha más NOSTR platformokon van fiókja. Egyébként csak a LANA privát kulcs elegendő, amelyből később bármikor származtathatja a NOSTR adatokat.',
      convertButton: 'Konvertálás ID-kké',
      converting: 'Konvertálás...',
    },
    results: {
      complete: 'Konverzió befejezve',
      lanaPrivateKey: 'LANA privát kulcs (WIF)',
      lanaPrivateKeyDesc: 'Az eredeti LanaCoin privát kulcsa WIF formátumban',
      walletId: 'LanaCoin tárca azonosító',
      walletIdDesc: 'LanaCoin tárca címe, amely a privát kulcsból származik',
      nostrHexId: 'Nostr HEX ID',
      nostrHexIdDesc: '32 bájtos hexadecimális Nostr nyilvános kulcs azonosító',
      nostrNpubId: 'Nostr npub ID',
      nostrNpubIdDesc: 'Ember által olvasható bech32-kódolt Nostr nyilvános kulcs (npub formátum)',
      nostrPrivateKey: 'Nostr privát kulcs (HEX)',
      nostrPrivateKeyDesc: '32 bájtos hexadecimális Nostr privát kulcs aláíráshoz',
    },
    print: {
      title: 'Nyomtatási dokumentum generálása',
      description: 'A4-es dokumentum létrehozása tárcákkal és QR kódokkal biztonságos tároláshoz',
      customTextLabel: 'Szöveg a tetején (opcionális)',
      customTextPlaceholder: 'pl. 100 millió móka',
      twoCards: 'A dokumentum 2 kártyát fog tartalmazni: LANA privát kulcs és tárca azonosító',
      fiveCards: 'A dokumentum 5 kártyát fog tartalmazni: LANA privát kulcs, tárca azonosító és 3 NOSTR adat mező',
      generateButton: 'Nyomtatási dokumentum generálása',
      securityNotice: 'FONTOS BIZTONSÁGI FIGYELMEZTETÉS:',
      securityText: 'Ezt a dokumentumot biztonságosan HÁROM külön helyen tárolja. Tartsa távol nedvességtől, tűztől és jogosulatlan hozzáféréstől. Bárki, aki hozzáfér a privát kulcshoz, hozzáférhet az eszközeihez.',
    },
    printDoc: {
      walletTitle: 'LANA tárca',
      lanaPrivateKey: 'LANA privát kulcs (WIF)',
      walletId: 'LanaCoin tárca azonosító',
      nostrHexId: 'Nostr HEX ID',
      nostrNpubId: 'Nostr npub ID',
      nostrPrivateKeyHex: 'Nostr privát kulcs (HEX)',
      securityWarningTitle: '⚠️ FONTOS BIZTONSÁGI FIGYELMEZTETÉS ⚠️',
      securityWarningText: 'Ezt a dokumentumot biztonságosan HÁROM külön helyen tárolja. Tartsa távol nedvességtől, tűztől és jogosulatlan hozzáféréstől. Bárki, aki hozzáfér a privát kulcshoz, hozzáférhet az eszközeihez. Soha ne ossza meg privát kulcsát senkivel.',
    },
    toasts: {
      conversionSuccess: 'Sikeres konverzió',
      conversionSuccessDesc: 'WIF-je konvertálva lett tárca azonosítóvá és Nostr azonosítókká.',
      conversionFailed: 'Sikertelen konverzió',
      copied: 'Másolva!',
      copiedDesc: 'vágólapra másolva',
      copyFailed: 'Másolás sikertelen',
      copyFailedDesc: 'Nem sikerült a vágólapra másolni',
      qrScanned: 'QR kód beolvasva',
      qrScannedDesc: 'Privát kulcs beolvasva a QR kódból',
      printError: 'Hiba',
      printErrorDesc: 'Nem lehet megnyitni a nyomtatási ablakot. Ellenőrizze a böngésző beállításait.',
    },
    errors: {
      enterWif: 'Kérjük, adjon meg egy WIF privát kulcsot',
    },
  },
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  sl: 'Slovenščina',
  hu: 'Magyar',
};
